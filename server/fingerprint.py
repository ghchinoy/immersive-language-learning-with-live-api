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

import hashlib
from fastapi import Request

def generate_fingerprint(request: Request):
    """Generates a unique ID based on client request details."""
    # Combine IP, User-Agent, and Accept headers
    # FastAPI request.client can be None in some cases (e.g. test client), handle gracefully
    client_host = request.client.host if request.client else "unknown"
    
    data_points = [
        client_host,
        request.headers.get('User-Agent', ''),
        request.headers.get('Accept-Language', ''),
        request.headers.get('Accept', '')
    ]
    # Create a consistent string and hash it
    raw_id = "|".join(str(d) for d in data_points)
    return hashlib.sha256(raw_id.encode('utf-8')).hexdigest()
