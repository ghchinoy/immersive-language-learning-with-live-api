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

import os
import logging
import google.auth

logger = logging.getLogger(__name__)

def get_project_id():
    """
    Get the project ID from the environment or Google Cloud default credentials.
    """
    # 1. Try Environment Variable
    env_project_id = os.getenv("PROJECT_ID")
    if env_project_id and env_project_id != "your-project-id":
        return env_project_id

    # 2. Try Google Auth (Standard way for Cloud Run/GCE/Local ADC)
    try:
        _, auth_project_id = google.auth.default()
        if auth_project_id:
            logger.info(f"Fetched PROJECT_ID from Google Auth: {auth_project_id}")
            return auth_project_id
    except Exception as e:
        logger.warning(f"Could not determine PROJECT_ID from Google Auth: {e}")

    # 3. Fallback
    return "your-project-id"
