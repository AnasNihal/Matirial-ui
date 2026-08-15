import requests
import uuid

BASE_URL = "http://localhost:3000"
AUTH_HEADER_KEY = "Authorization"
API_KEY = "API key"  # Assuming the key type is a string like 'API key', need actual token below
TIMEOUT = 30

# NOTE: Since no exact Clerk API endpoint URLs are provided in PRD,
# we assume standard RESTful endpoints under /api/auth/ for demonstration.
# Adjust endpoints if actual ones differ.
# Also assuming API key auth in the Authorization header (e.g. "Authorization: Bearer <token>")
# For sign-up and sign-in, Clerk usually requires JSON payload with email/password or phone.
# We'll simulate common flows: sign-up, sign-in, get session, sign-out
# We will check error handling by attempting invalid sign-in and malformed requests.

def test_user_authentication_via_clerk():
    session_token = None
    test_email = f"testuser_{uuid.uuid4()}@example.com"
    test_password = "StrongP@ssw0rd!"
    headers = {AUTH_HEADER_KEY: f"Bearer {API_KEY}"}

    # Helper to extract auth token from sign-in / sign-up responses
    def get_token(response_json):
        # Assuming response includes a session token or access token under ["session"]["token"] or similar
        # This is hypothetical; adjust if actual API differs.
        token = None
        if isinstance(response_json, dict):
            if "session" in response_json and isinstance(response_json["session"], dict):
                token = response_json["session"].get("token")
            elif "access_token" in response_json:
                token = response_json["access_token"]
        return token

    try:
        # 1. Sign-up new user with email and password (happy path)
        signup_payload = {
            "email": test_email,
            "password": test_password,
            "firstName": "Test",
            "lastName": "User"
        }
        resp = requests.post(
            f"{BASE_URL}/api/auth/signup",
            headers={**headers, "Content-Type": "application/json"},
            json=signup_payload,
            timeout=TIMEOUT
        )
        assert resp.status_code == 201 or resp.status_code == 200, f"Sign-up failed: {resp.status_code}, {resp.text}"
        signup_data = resp.json()
        token = get_token(signup_data)
        assert token is not None, "Sign-up response missing token"
        session_token = token

        # 2. Sign-in user (happy path)
        signin_payload = {
            "email": test_email,
            "password": test_password,
        }
        resp = requests.post(
            f"{BASE_URL}/api/auth/signin",
            headers={**headers, "Content-Type": "application/json"},
            json=signin_payload,
            timeout=TIMEOUT
        )
        assert resp.status_code == 200, f"Sign-in failed: {resp.status_code}, {resp.text}"
        signin_data = resp.json()
        token = get_token(signin_data)
        assert token is not None, "Sign-in response missing token"
        session_token = token

        # Use session token to get current session info (session management)
        resp = requests.get(
            f"{BASE_URL}/api/auth/session",
            headers={AUTH_HEADER_KEY: f"Bearer {session_token}"},
            timeout=TIMEOUT
        )
        assert resp.status_code == 200, f"Get session failed: {resp.status_code}, {resp.text}"
        session_data = resp.json()
        assert "user" in session_data and session_data["user"]["email"] == test_email, "Session user email mismatch"

        # 3. Attempt sign-in with wrong password (error handling)
        bad_signin_payload = {
            "email": test_email,
            "password": "WrongPassword!",
        }
        resp = requests.post(
            f"{BASE_URL}/api/auth/signin",
            headers={**headers, "Content-Type": "application/json"},
            json=bad_signin_payload,
            timeout=TIMEOUT
        )
        assert resp.status_code == 401 or resp.status_code == 400, "Expected unauthorized or bad request for wrong password"
        error_resp = resp.json()
        assert "error" in error_resp or "message" in error_resp, "Error message missing for failed sign-in"

        # 4. Attempt sign-up with existing email (error handling)
        resp = requests.post(
            f"{BASE_URL}/api/auth/signup",
            headers={**headers, "Content-Type": "application/json"},
            json=signup_payload,
            timeout=TIMEOUT
        )
        assert resp.status_code == 409 or resp.status_code == 400, "Expected conflict or bad request for duplicate sign-up"
        error_resp = resp.json()
        assert "error" in error_resp or "message" in error_resp, "Error message missing for duplicate sign-up"

        # 5. Sign-out current session
        resp = requests.post(
            f"{BASE_URL}/api/auth/signout",
            headers={AUTH_HEADER_KEY: f"Bearer {session_token}"},
            timeout=TIMEOUT
        )
        assert resp.status_code == 200 or resp.status_code == 204, f"Sign-out failed: {resp.status_code}"

        # 6. Check session after sign-out (should fail or no user)
        resp = requests.get(
            f"{BASE_URL}/api/auth/session",
            headers={AUTH_HEADER_KEY: f"Bearer {session_token}"},
            timeout=TIMEOUT
        )
        # Expect 401 unauthorized or empty session
        assert resp.status_code == 401 or resp.status_code == 403 or (resp.status_code == 200 and ("user" not in resp.json() or resp.json()["user"] is None)), \
            "Session still active after sign-out"

        # 7. Attempt malformed sign-up request (missing required fields)
        malformed_payloads = [
            {},  # empty
            {"email": "no_password@example.com"},
            {"password": "NoEmailPass123"}
        ]
        for mp in malformed_payloads:
            resp = requests.post(
                f"{BASE_URL}/api/auth/signup",
                headers={**headers, "Content-Type": "application/json"},
                json=mp,
                timeout=TIMEOUT
            )
            assert resp.status_code == 400 or resp.status_code == 422, "Expected validation error for malformed sign-up"
            error_resp = resp.json()
            assert "error" in error_resp or "message" in error_resp, "Error message missing for malformed sign-up"

        # 8. Attempt sign-in with malformed payload
        resp = requests.post(
            f"{BASE_URL}/api/auth/signin",
            headers={**headers, "Content-Type": "application/json"},
            json={"email": test_email},
            timeout=TIMEOUT
        )
        assert resp.status_code == 400 or resp.status_code == 422, "Expected validation error for malformed sign-in missing password"
        error_resp = resp.json()
        assert "error" in error_resp or "message" in error_resp, "Error message missing for malformed sign-in"

    except requests.RequestException as e:
        assert False, f"HTTP request failed with exception: {e}"

test_user_authentication_via_clerk()