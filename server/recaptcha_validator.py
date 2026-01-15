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

from google.cloud import recaptchaenterprise_v1
from google.cloud.recaptchaenterprise_v1 import Assessment
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class RecaptchaValidator:
    def __init__(self, project_id: str, recaptcha_key: str, score_threshold: float = 0.5):
        self.project_id = project_id
        self.recaptcha_key = recaptcha_key
        self.score_threshold = score_threshold
        self.client = recaptchaenterprise_v1.RecaptchaEnterpriseServiceClient()

    def validate_token(self, token: str, recaptcha_action: str) -> Dict[str, Any]:
        """
        Validate a reCAPTCHA Enterprise token.

        Args:
            token: The token to validate
            recaptcha_action: The expected action name (e.g., "LOGIN")

        Returns:
            Dictionary containing validation results
        """
        try:
            assessment = self._create_assessment(token, recaptcha_action)

            if not assessment:
                return {
                    'valid': False,
                    'score': 0.0,
                    'error': 'Failed to create assessment'
                }

            # Check if the token is valid
            if not assessment.token_properties.valid:
                logger.warning(
                    f"The createAssessment call failed because the token was: {assessment.token_properties.invalid_reason}"
                )
                return {
                    'valid': False,
                    'score': 0.0,
                    'error': f"Invalid token: {assessment.token_properties.invalid_reason}",
                    'reasons': []
                }

            # Check if the expected action matches the one in the assessment
            if assessment.token_properties.action != recaptcha_action:
                logger.warning(
                    f"The action attribute in your reCAPTCHA tag is: {assessment.token_properties.action} "
                    f"but the validation action is: {recaptcha_action}"
                )
                return {
                    'valid': False,
                    'score': 0.0,
                    'error': 'Action mismatch',
                    'reasons': []
                }

            # Get the risk score
            score = assessment.risk_analysis.score
            reasons = list(assessment.risk_analysis.reasons)

            # Log the assessment details
            logger.info(f"reCAPTCHA score: {score}, reasons: {reasons}")

            # Determine if the request passes the threshold
            is_valid = score >= self.score_threshold

            return {
                'valid': is_valid,
                'score': score,
                'reasons': reasons,
                'passes_threshold': is_valid,
                'threshold': self.score_threshold
            }

        except Exception as e:
            logger.error(f"Error validating reCAPTCHA token: {e}")
            return {
                'valid': False,
                'score': 0.0,
                'error': str(e)
            }

    def _create_assessment(
        self,
        token: str,
        recaptcha_action: str
    ) -> Optional[Assessment]:
        """
        Create a reCAPTCHA Enterprise assessment.

        Args:
            token: The token to assess
            recaptcha_action: The expected action

        Returns:
            The Assessment object or None if creation failed
        """
        try:
            # Set up the event
            event = recaptchaenterprise_v1.Event()
            event.site_key = self.recaptcha_key
            event.token = token

            # Create the assessment
            assessment = recaptchaenterprise_v1.Assessment()
            assessment.event = event

            # Build the request
            project_name = f"projects/{self.project_id}"
            request = recaptchaenterprise_v1.CreateAssessmentRequest()
            request.assessment = assessment
            request.parent = project_name

            # Send the request and get the response
            response = self.client.create_assessment(request)

            # Get the assessment ID for logging
            assessment_name = self.client.parse_assessment_path(response.name).get("assessment")
            logger.info(f"Created assessment: {assessment_name}")

            return response

        except Exception as e:
            logger.error(f"Failed to create assessment: {e}")
            return None

    def is_bot_likely(self, score: float) -> bool:
        """
        Determine if the request is likely from a bot based on the score.

        Args:
            score: The reCAPTCHA score (0.0 to 1.0)

        Returns:
            True if likely a bot, False otherwise
        """
        return score < self.score_threshold
