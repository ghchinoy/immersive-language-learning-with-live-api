#!/bin/bash
# Copyright 2025 Google LLC
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


# Configuration
# Replace these values with your own project configuration
PROJECT_ID="your-project-id"
SERVICE_NAME="immersive-language-learning"
REGION="us-central1"
MODEL="gemini-live-2.5-flash-native-audio"

RECAPTCHA_SITE_KEY="your-recaptcha-site-key"

REDIS_URL="redis://10.0.0.3:6379/0" # Ensure your VPC setup allows access
SESSION_TIME_LIMIT="180"
GLOBAL_RATE_LIMIT="100 per 5 minutes"
PER_USER_RATE_LIMIT="2 per minute"

# BigQuery Analytics (Optional)
DATASET_ID="your-dataset-id"
TABLE_ID="your-table-id"
DEMO_NAME="immersive-language-learning"

DEV_MODE="false" # Set to true to disable Redis/Recaptcha


echo "📦 Building frontend..."
npm run build

echo "🚀 Deploying $SERVICE_NAME to Cloud Run..."

# NOTE: Ensure you have authenticated with gcloud:
# gcloud auth login
# gcloud config set project $PROJECT_ID

gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --allow-unauthenticated \
  --project $PROJECT_ID \
  --network default \
  --subnet default \
  --session-affinity \
  --clear-base-image \
  --set-env-vars PROJECT_ID=$PROJECT_ID  \
  --set-env-vars LOCATION=$REGION \
  --set-env-vars MODEL=$MODEL \
  --set-env-vars SESSION_TIME_LIMIT=$SESSION_TIME_LIMIT \
  --set-env-vars APP_NAME=$SERVICE_NAME \
  --set-env-vars GLOBAL_RATE_LIMIT="$GLOBAL_RATE_LIMIT" \
  --set-env-vars PER_USER_RATE_LIMIT="$PER_USER_RATE_LIMIT" \
  --set-env-vars RECAPTCHA_SITE_KEY=$RECAPTCHA_SITE_KEY \
  --set-env-vars REDIS_URL=$REDIS_URL \
  --set-env-vars DEV_MODE=$DEV_MODE \
  --set-env-vars DATASET_ID=$DATASET_ID \
  --set-env-vars TABLE_ID=$TABLE_ID \
  --set-env-vars DEMO_NAME=$DEMO_NAME


echo "✅ Deployment command finished."
