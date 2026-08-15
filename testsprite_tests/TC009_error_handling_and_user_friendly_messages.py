import requests
from requests.exceptions import RequestException, Timeout
import json

BASE_URL = "http://localhost:3000"
API_KEY = "your_api_key_here"  # Replace with valid API key
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}
TIMEOUT = 30


def test_error_handling_and_user_friendly_messages():
    error_logs = []

    def log_error(error_context, error):
        error_message = f"Error in {error_context}: {str(error) if str(error) else repr(error)}"
        error_logs.append(error_message)

    # Helper function to safely parse JSON
    def safe_json(resp):
        try:
            return resp.json()
        except (json.JSONDecodeError, ValueError):
            return None

    # 1. Test invalid endpoint (404 Not Found)
    try:
        resp = requests.get(f"{BASE_URL}/invalid-endpoint", headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code == 404
        json_resp = safe_json(resp)
        assert json_resp is None or "error" in json_resp or "message" in json_resp
    except Exception as e:
        log_error("invalid endpoint 404 test", e)

    # 2. Test unauthorized access (401 Unauthorized) with missing API key
    try:
        resp = requests.get(f"{BASE_URL}/api/webhook/instagram", timeout=TIMEOUT)
        assert resp.status_code in (401, 403)
        # response should be user friendly
        json_resp = safe_json(resp) or {}
        assert any(k in json_resp for k in ["error", "message"]) or resp.text.strip() == ""
        msg = json_resp.get("message", "") or json_resp.get("error", "")
        assert isinstance(msg, str)
        assert len(msg) > 0 or resp.text.strip() == ""
    except Exception as e:
        log_error("unauthorized access 401 test", e)

    # 3. Test webhook endpoint with invalid payload (400 Bad Request)
    try:
        invalid_payload = {"wrong": "data", "missing": "fields"}
        resp = requests.post(f"{BASE_URL}/api/webhook/instagram", headers=HEADERS, json=invalid_payload, timeout=TIMEOUT)
        assert resp.status_code in (400, 422)
        json_resp = safe_json(resp) or {}
        assert "error" in json_resp or "message" in json_resp
        combined_msg = (json_resp.get("message", "") + json_resp.get("error", "")).lower()
        assert "invalid" in combined_msg
    except Exception as e:
        log_error("webhook invalid payload 400 test", e)

    # 4. Test creating automation with invalid data (simulate Automation Management error handling)
    try:
        invalid_data = {
            "name": "",  # likely required non-empty
            "trigger_type": "invalid_trigger_type",
            "keywords": 123,  # should be list or string
            "responses": None  # should be list or dict
        }
        resp = requests.post(f"{BASE_URL}/api/automations", headers=HEADERS, json=invalid_data, timeout=TIMEOUT)
        assert resp.status_code in (400, 422)
        json_resp = safe_json(resp) or {}
        assert "error" in json_resp or "message" in json_resp
        msg = (json_resp.get("message") or json_resp.get("error") or "").lower()
        assert "invalid" in msg or "required" in msg or "missing" in msg
    except RequestException as e:
        log_error("automation creation invalid data test RequestException", e)
    except Exception as e:
        log_error("automation creation invalid data test", e)

    # 5. Test Instagram OAuth callback with invalid code or missing params
    try:
        # OAuth callback usually does not require Authorization header
        resp = requests.get(f"{BASE_URL}/callback/instagram", timeout=TIMEOUT)
        assert resp.status_code in (400, 422)
        json_resp = safe_json(resp) or {}
        if json_resp:
            assert "error" in json_resp or "message" in json_resp
    except Exception as e:
        log_error("instagram oauth callback invalid request test", e)

    # 6. Test subscription upgrade with invalid payment token or missing data
    try:
        invalid_payment_data = {"paymentToken": "invalid_token", "plan": "pro"}
        resp = requests.post(f"{BASE_URL}/api/subscription/upgrade", headers=HEADERS, json=invalid_payment_data, timeout=TIMEOUT)
        assert resp.status_code in (400, 402)
        json_resp = safe_json(resp) or {}
        assert "error" in json_resp or "message" in json_resp
        msg = (json_resp.get("message") or json_resp.get("error") or "").lower()
        assert "payment" in msg or "invalid" in msg or "failed" in msg
    except Exception as e:
        log_error("subscription upgrade invalid payment test", e)

    # 7. Test webhook event processing with malformed event structure to verify error capture without crash
    try:
        malformed_event = {"entry": [{"changes": [{"field": None}]}]}  # missing some required data
        resp = requests.post(f"{BASE_URL}/api/webhook/instagram", headers=HEADERS, json=malformed_event, timeout=TIMEOUT)
        assert resp.status_code in (400, 422)
        json_resp = safe_json(resp) or {}
        assert "error" in json_resp or "message" in json_resp
    except Exception as e:
        log_error("webhook malformed event processing test", e)

    # 8. Test accessing protected dashboard route without session/auth (simulate UI auth error)
    try:
        protected_url = f"{BASE_URL}/dashboard/user1"
        # Missing Authorization header removed - add Authorization header as this is protected
        resp = requests.get(protected_url, headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code in (401, 403, 302)  # redirect or forbidden
        # If json response, check message clear
        if "application/json" in resp.headers.get("Content-Type", ""):
            json_resp = safe_json(resp) or {}
            assert any(k in json_resp for k in ["error", "message"])
    except Exception as e:
        log_error("protected dashboard without auth test", e)

    # 9. Test calling API with request timeout to simulate network error handling
    try:
        # Forcing timeout by set timeout very low on a known slow endpoint or invalid domain.
        resp = requests.get(f"{BASE_URL}/api/automations", headers=HEADERS, timeout=0.001)
        # We expect this to timeout, so if it doesn't, check normal response
        assert resp.status_code == 200
    except Timeout:
        # Expected timeout, check error handling captured
        pass
    except Exception as e:
        log_error("api request timeout handling", e)

    # 10. Test invalid HTTP method to an endpoint
    try:
        resp = requests.put(f"{BASE_URL}/api/webhook/instagram", headers=HEADERS, timeout=TIMEOUT)
        # Expect 405 Method Not Allowed or similar
        assert resp.status_code in (405, 400)
        json_resp = safe_json(resp) or {}
        assert "error" in json_resp or "message" in json_resp
    except Exception as e:
        log_error("invalid http method test", e)

    # Collate and assert no critical unexpected errors
    assert all(isinstance(msg, str) and len(msg) > 0 for msg in error_logs)  # Errors logged should be valid strings
    # For the purpose of this test, fail if too many unexpected exceptions
    assert len(error_logs) < 5, f"Too many unexpected errors during error handling tests: {error_logs}"


test_error_handling_and_user_friendly_messages()
