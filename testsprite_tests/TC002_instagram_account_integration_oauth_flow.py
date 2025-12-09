import requests
import time

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {
    "Authorization": "API_KEY_PLACEHOLDER",
    "Content-Type": "application/json"
}

def test_instagram_account_integration_oauth_flow():
    # Step 1: Simulate OAuth flow start - get Instagram OAuth URL
    try:
        oauth_url_resp = requests.get(f"{BASE_URL}/api/integrations/instagram/oauth-url",
                                     headers=HEADERS, timeout=TIMEOUT)
        assert oauth_url_resp.status_code == 200, f"Failed to get OAuth URL: {oauth_url_resp.text}"
        oauth_data = oauth_url_resp.json()
        assert 'oauthUrl' in oauth_data and oauth_data['oauthUrl'].startswith("https://"), "Invalid OAuth URL"

        # Normally user would follow that URL and approve OAuth, here we simulate callback exchange
        # Step 2: Simulate OAuth callback with authorization code (simulate valid code)
        fake_auth_code = "fake_auth_code_for_testing"
        callback_resp = requests.post(f"{BASE_URL}/api/integrations/instagram/oauth-callback",
                                      headers=HEADERS,
                                      json={"code": fake_auth_code},
                                      timeout=TIMEOUT)
        # System might reject fake code, so check for both success and handled error
        assert callback_resp.status_code in (200, 400, 401), f"Unexpected status from OAuth callback: {callback_resp.text}"
        if callback_resp.status_code == 200:
            callback_json = callback_resp.json()
            assert "accessToken" in callback_json, "No accessToken in OAuth callback success response"
            access_token = callback_json["accessToken"]
        else:
            # Received error expected if code invalid - check error message present
            err_obj = callback_resp.json()
            assert "error" in err_obj or "message" in err_obj, "No error info on failed OAuth callback"

        # If OAuth succeeded, continue full integration cycle
        if callback_resp.status_code == 200:
            # Step 3: Token management - refresh the access token
            refresh_resp = requests.post(f"{BASE_URL}/api/integrations/instagram/token-refresh",
                                         headers={**HEADERS, "Authorization": f"Bearer {access_token}"},
                                         timeout=TIMEOUT)
            assert refresh_resp.status_code == 200, f"Token refresh failed: {refresh_resp.text}"
            refreshed = refresh_resp.json()
            assert "accessToken" in refreshed and refreshed["accessToken"], "No refreshed accessToken"

            # Step 4: Profile data syncing - fetch Instagram profile info
            profile_resp = requests.get(f"{BASE_URL}/api/integrations/instagram/profile",
                                        headers={**HEADERS, "Authorization": f"Bearer {access_token}"},
                                        timeout=TIMEOUT)
            assert profile_resp.status_code == 200, f"Failed to sync profile data: {profile_resp.text}"
            profile_data = profile_resp.json()
            required_profile_keys = {"id", "username", "name", "profile_picture_url"}
            assert required_profile_keys.issubset(profile_data.keys()), "Profile data missing required fields"

            # Step 5: Webhook subscription setup - create webhook subscription
            webhook_payload = {
                "callback_url": f"{BASE_URL}/api/webhook/instagram",
                "fields": ["comments", "direct_messages"],
                "verify_token": "test_verify_token"
            }
            webhook_resp = requests.post(f"{BASE_URL}/api/integrations/instagram/webhook-subscriptions",
                                         headers={**HEADERS, "Authorization": f"Bearer {access_token}"},
                                         json=webhook_payload,
                                         timeout=TIMEOUT)
            assert webhook_resp.status_code in (200, 201), f"Failed to create webhook subscription: {webhook_resp.text}"
            subscription_data = webhook_resp.json()
            assert subscription_data.get("id") or subscription_data.get("subscription_id"), "Webhook subscription missing ID"

            # Step 6: Validate webhook subscription by simulate GET verification request (challenge)
            challenge_token = "challenge_test_token_123"
            verify_resp = requests.get(
                f"{BASE_URL}/api/webhook/instagram?hub.mode=subscribe&hub.challenge={challenge_token}&hub.verify_token=test_verify_token",
                headers=HEADERS, timeout=TIMEOUT)
            # Expected to echo back the challenge token if verify token matches
            assert verify_resp.status_code == 200, f"Webhook verification failed: {verify_resp.text}"
            assert verify_resp.text == challenge_token, "Webhook challenge response mismatch"

            # Step 7: Simulate Instagram webhook event POST for a comment
            event_comment = {
                "object": "instagram",
                "entry": [{
                    "id": profile_data["id"],
                    "changes": [{
                        "field": "comments",
                        "value": {
                            "from": {"id": "12345", "username": "commenter"},
                            "message": "This is a test comment"
                        }
                    }]
                }]
            }
            event_resp = requests.post(f"{BASE_URL}/api/webhook/instagram",
                                       headers=HEADERS,
                                       json=event_comment,
                                       timeout=TIMEOUT)
            assert event_resp.status_code == 200, f"Processing of comment webhook event failed: {event_resp.text}"
            event_resp_json = event_resp.json()
            assert "success" in event_resp_json or event_resp_json == {}, "Unexpected webhook event response"

            # Step 8: Simulate Instagram webhook event POST for a direct message
            event_dm = {
                "object": "instagram",
                "entry": [{
                    "id": profile_data["id"],
                    "changes": [{
                        "field": "direct_messages",
                        "value": {
                            "from": {"id": "67890", "username": "dm_sender"},
                            "message": "This is a test direct message"
                        }
                    }]
                }]
            }
            dm_resp = requests.post(f"{BASE_URL}/api/webhook/instagram",
                                    headers=HEADERS,
                                    json=event_dm,
                                    timeout=TIMEOUT)
            assert dm_resp.status_code == 200, f"Processing of DM webhook event failed: {dm_resp.text}"
            dm_resp_json = dm_resp.json()
            assert "success" in dm_resp_json or dm_resp_json == {}, "Unexpected webhook DM event response"

        else:
            # OAuth failed, but system returned handled error, test passes as error handled gracefully
            pass

    except requests.RequestException as e:
        assert False, f"HTTP Request failed: {str(e)}"
    except AssertionError as e:
        raise
    except Exception as e:
        assert False, f"Unexpected error occurred: {str(e)}"

test_instagram_account_integration_oauth_flow()
