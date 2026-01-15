# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import google.genai as genai
from google.genai import types
import asyncio
import base64
import json
import logging
import inspect
from typing import Optional, List, Dict, Callable

logger = logging.getLogger(__name__)

class GeminiLive:
    def __init__(self, project_id: str, location: str, model: str, input_sample_rate: int = 16000):
        self.project_id = project_id
        self.location = location
        self.model = model
        self.input_sample_rate = input_sample_rate
        print("🚀 GeminiLive initialized with:")
        print(f"  Project ID: {project_id}")
        print(f"  Location: {location}")
        print(f"  Model: {model}")
        print(f"  Input Sample Rate: {input_sample_rate}")
        
        # Initialize client
        self.client = genai.Client(vertexai=True, project=project_id, location=location)
        self.tool_mapping = {}

    def register_tool(self, func: Callable):
        self.tool_mapping[func.__name__] = func
        return func

    async def start_session(
        self, 
        audio_input_queue: asyncio.Queue,
        video_input_queue: asyncio.Queue,
        text_input_queue: asyncio.Queue,
        audio_output_callback: Callable,
        audio_interrupt_callback: Optional[Callable] = None,
        setup_config: Optional[Dict] = None
    ):
        """
        Connects to Gemini Live and proxies data between queues/callbacks and the session.
        """

        print("⚡️ setup_config", json.dumps(setup_config, indent=4))

        config_args = {
            "response_modalities": [types.Modality.AUDIO]
        }
        
        if setup_config:
            # Parse configuration from frontend
            if "generation_config" in setup_config:
                gen_config = setup_config["generation_config"]
                if "response_modalities" in gen_config:
                    config_args["response_modalities"] = [
                        types.Modality(m) for m in gen_config["response_modalities"]
                    ]
                if "speech_config" in gen_config:
                   try:
                       voice_name = gen_config["speech_config"]["voice_config"]["prebuilt_voice_config"]["voice_name"]
                       config_args["speech_config"] = types.SpeechConfig(
                           voice_config=types.VoiceConfig(
                               prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice_name)
                           )
                       )
                   except (KeyError, TypeError):
                       pass

            if "system_instruction" in setup_config:
                try:
                    text = setup_config["system_instruction"]["parts"][0]["text"]
                    config_args["system_instruction"] = types.Content(parts=[types.Part(text=text)])
                except (KeyError, IndexError, TypeError):
                    pass
            
            if "proactivity" in setup_config:
                try:
                    proactive_audio = setup_config["proactivity"].get("proactiveAudio", False)
                    config_args["proactivity"] = types.ProactivityConfig(proactive_audio=proactive_audio)
                except (AttributeError, TypeError):
                    pass

            if "tools" in setup_config:
                try:
                    tool_config = setup_config["tools"]
                    if "function_declarations" in tool_config:
                        fds = []
                        for fd in tool_config["function_declarations"]:
                            fds.append(types.FunctionDeclaration(
                                name=fd.get("name"),
                                description=fd.get("description"),
                                parameters=fd.get("parameters")
                            ))
                        config_args["tools"] = [types.Tool(function_declarations=fds)]
                except Exception as e:
                    logger.warning(f"Error parsing tools config: {e}")

        # Config output transcription
        if "output_audio_transcription" in setup_config:
            print("💬 output_audio_transcription ENABLED")
            config_args["output_audio_transcription"] = types.AudioTranscriptionConfig()
        if "input_audio_transcription" in setup_config:
            print("💬 input_audio_transcription ENABLED")
            config_args["input_audio_transcription"] = types.AudioTranscriptionConfig()

        config = types.LiveConnectConfig(**config_args)
        
        # Connect using the new async client interface
        async with self.client.aio.live.connect(model=self.model, config=config) as session:
            
            async def send_audio():
                try:
                    while True:
                        chunk = await audio_input_queue.get()
                        await session.send_realtime_input(
                            audio=types.Blob(data=chunk, mime_type=f"audio/pcm;rate={self.input_sample_rate}")
                        )
                except asyncio.CancelledError:
                    pass

            async def send_video():
                # Not heavily used in Immergo yet, but good to have
                try:
                    while True:
                        chunk = await video_input_queue.get()
                        await session.send_realtime_input(
                            video=types.Blob(data=chunk, mime_type="image/jpeg")
                        )
                except asyncio.CancelledError:
                    pass

            async def send_text():
                try:
                    while True:
                        text = await text_input_queue.get()
                        await session.send(input=text, end_of_turn=True)
                except asyncio.CancelledError:
                    pass

            event_queue = asyncio.Queue()

            async def receive_loop():
                try:
                    while True:
                        async for response in session.receive():
                            server_content = response.server_content
                            tool_call = response.tool_call
                            
                            if server_content:
                                if server_content.model_turn:
                                    for part in server_content.model_turn.parts:
                                        if part.inline_data:
                                            # Audio data being returned
                                            if inspect.iscoroutinefunction(audio_output_callback):
                                                await audio_output_callback(part.inline_data.data)
                                            else:
                                                audio_output_callback(part.inline_data.data)
                                
                                if server_content.input_transcription:
                                    # User speech transcription
                                    await event_queue.put({
                                        "serverContent": {
                                            "inputTranscription": {
                                                "text": server_content.input_transcription.text,
                                                "finished": True 
                                            }
                                        }
                                    })
                                
                                if server_content.output_transcription:
                                    # Model output transcription
                                    print("output_transcription", server_content.output_transcription)
                                    await event_queue.put({
                                        "serverContent": {
                                            "outputTranscription": {
                                                "text": server_content.output_transcription.text,
                                                "finished": True
                                            }
                                        }
                                    })
                                
                                if server_content.turn_complete:
                                    await event_queue.put({"serverContent": {"turnComplete": True}})
                                
                                if server_content.interrupted:
                                    await event_queue.put({"serverContent": {"interrupted": True}})
                                    # Stop playback on client is handled by event, but we can callback too
                                    if audio_interrupt_callback:
                                        if inspect.iscoroutinefunction(audio_interrupt_callback):
                                            await audio_interrupt_callback()
                                        else:
                                            audio_interrupt_callback()
                                    await event_queue.put({"type": "interrupted"})

                            if tool_call:
                                function_responses = []
                                client_tool_calls = []

                                for fc in tool_call.function_calls:
                                    func_name = fc.name
                                    args = fc.args or {}
                                    
                                    if func_name in self.tool_mapping:
                                        try:
                                            tool_func = self.tool_mapping[func_name]
                                            if inspect.iscoroutinefunction(tool_func):
                                                result = await tool_func(**args)
                                            else:
                                                loop = asyncio.get_running_loop()
                                                result = await loop.run_in_executor(None, lambda: tool_func(**args))
                                        except Exception as e:
                                            result = f"Error: {e}"
                                        
                                        function_responses.append(types.FunctionResponse(
                                            name=func_name,
                                            id=fc.id,
                                            response={"result": result}
                                        ))
                                        await event_queue.put({"type": "tool_call", "name": func_name, "args": args, "result": result})
                                    else:
                                        # Unknown tool, assume client-side
                                        client_tool_calls.append({
                                            "name": fc.name,
                                            "args": args,
                                            "id": fc.id
                                        })
                                
                                if client_tool_calls:
                                    # Forward to client
                                    await event_queue.put({
                                        "toolCall": {
                                            "functionCalls": client_tool_calls
                                        }
                                    })

                                if function_responses:
                                    await session.send_tool_response(function_responses=function_responses)

                except Exception as e:
                    await event_queue.put({"type": "error", "error": str(e)})
                finally:
                    await event_queue.put(None)

            send_audio_task = asyncio.create_task(send_audio())
            send_video_task = asyncio.create_task(send_video())
            send_text_task = asyncio.create_task(send_text())
            receive_task = asyncio.create_task(receive_loop())

            try:
                while True:
                    event = await event_queue.get()
                    if event is None:
                        break
                    yield event
            finally:
                send_audio_task.cancel()
                send_video_task.cancel()
                send_text_task.cancel()
                receive_task.cancel()
