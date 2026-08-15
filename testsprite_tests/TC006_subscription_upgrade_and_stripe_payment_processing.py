import requests
import time

BASE_URL = "http://localhost:3000"
API_KEY = "Authorization"  # The header key name for API key auth
API_KEY_VALUE = "Bearer YOUR_API_KEY_HERE"  # Replace with a valid API key for testing
TIMEOUT = 30

headers_auth = {
    API_KEY: API_KEY_VALUE,
    "Content-Type": "application/json",
}

def test_subscription_upgrade_and_stripe_payment_processing():
    """
    Test the subscription upgrade flow from Free to Pro plan including:
    - Fetching current subscription status
    - Initiating upgrade to Pro plan
    - Simulating Stripe checkout session creation
    - Simulating Stripe payment confirmation (mocking the webhook or payment intent confirmation)
    - Validating subscription state upgraded to Pro
    - Validating access to advanced SMARTAI features post-upgrade
    - Testing error cases such as invalid upgrade requests, payment failures, expired sessions
    """

    session = requests.Session()
    session.headers.update(headers_auth)

    subscription_id = None

    try:
        # Step 1: Get current subscription status (expecting Free plan initially)
        resp = session.get(f"{BASE_URL}/api/subscription", timeout=TIMEOUT)
        assert resp.status_code == 200, f"Failed to get current subscription, status: {resp.status_code}"
        current_sub = resp.json()
        assert "plan" in current_sub, "Subscription response missing 'plan'"
        assert current_sub["plan"] == "Free", f"User should start on Free plan, got {current_sub['plan']}"
        subscription_id = current_sub.get("id")

        # Step 2: Initiate upgrade to Pro plan - create Stripe checkout session
        upgrade_payload = {
            "plan": "Pro"
        }
        resp = session.post(f"{BASE_URL}/api/subscription/upgrade", json=upgrade_payload, timeout=TIMEOUT)
        assert resp.status_code == 201, f"Failed to initiate upgrade, status: {resp.status_code}"
        upgrade_data = resp.json()
        assert "checkoutSessionId" in upgrade_data, "No checkoutSessionId in upgrade response"
        checkout_session_id = upgrade_data["checkoutSessionId"]
        assert isinstance(checkout_session_id, str) and len(checkout_session_id) > 0, "Invalid checkoutSessionId"

        # Step 3: Simulate Stripe Checkout payment confirmation
        # This usually involves webhook event from Stripe.
        # For testing, simulate calling webhook endpoint with payment succeeded event

        # Compose mock Stripe webhook event payload to inform backend of payment success
        stripe_event_payload = {
            "id": "evt_test_payment_succeeded",
            "object": "event",
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": checkout_session_id,
                    "payment_status": "paid",
                    "subscription": "sub_test_12345",
                    "customer": "cus_test_12345",
                    "metadata": {
                        "user_id": "test_user"
                    }
                }
            }
        }

        # POST to webhook endpoint for Stripe events (assuming '/api/webhook/stripe')
        resp = session.post(f"{BASE_URL}/api/webhook/stripe", json=stripe_event_payload, timeout=TIMEOUT)
        assert resp.status_code in (200, 204), f"Stripe webhook simulation failed with status {resp.status_code}"

        # Small delay to ensure backend processes webhook & updates subscription state
        time.sleep(2)

        # Step 4: Confirm subscription is upgraded to Pro
        resp = session.get(f"{BASE_URL}/api/subscription", timeout=TIMEOUT)
        assert resp.status_code == 200, f"Failed to get subscription after upgrade, status: {resp.status_code}"
        upgraded_sub = resp.json()
        assert upgraded_sub.get("plan") == "Pro", f"Expected plan 'Pro', got {upgraded_sub.get('plan')}"

        # Step 5: Check access to advanced SMARTAI features endpoint
        # Assume an endpoint that returns user features: /api/features
        resp = session.get(f"{BASE_URL}/api/features", timeout=TIMEOUT)
        assert resp.status_code == 200, f"Failed to get features, status: {resp.status_code}"
        features = resp.json()
        assert isinstance(features, dict), "Features response not a dict"
        assert features.get("smartAIAdvancedAccess") is True, "User does not have access to advanced SMARTAI features after upgrade"

        # Step 6: Test error handling for invalid upgrade request (e.g., downgrade not allowed here)
        invalid_payload = {"plan": "InvalidPlan"}
        resp = session.post(f"{BASE_URL}/api/subscription/upgrade", json=invalid_payload, timeout=TIMEOUT)
        assert resp.status_code == 400 or resp.status_code == 422, f"Invalid plan upgrade should be rejected, status: {resp.status_code}"
        error_resp = resp.json()
        assert "error" in error_resp or "message" in error_resp, "Error response missing error message"

        # Step 7: Test error handling for expired Stripe checkout session
        # Assume endpoint to confirm checkout session payment with session id (simulate expired)
        expired_session_id = "expired_session_123"
        resp = session.post(f"{BASE_URL}/api/subscription/confirm", json={"checkoutSessionId": expired_session_id}, timeout=TIMEOUT)
        assert resp.status_code == 400 or resp.status_code == 404, f"Expired session confirmation should fail, status: {resp.status_code}"
        error_resp = resp.json()
        assert "error" in error_resp or "message" in error_resp, "Error response missing error message for expired session"

        # Step 8: Test access to SMARTAI features denied if subscription is downgraded (simulate downgrade)
        # If API supports downgrade, attempt it and verify feature access denied
        downgrade_payload = {"plan": "Free"}
        resp = session.post(f"{BASE_URL}/api/subscription/downgrade", json=downgrade_payload, timeout=TIMEOUT)
        if resp.status_code == 200:
            time.sleep(2)
            resp_features = session.get(f"{BASE_URL}/api/features", timeout=TIMEOUT)
            features_after_downgrade = resp_features.json()
            assert features_after_downgrade.get("smartAIAdvancedAccess") is not True, "SMARTAI advanced features should be revoked after downgrade"

    finally:
        # Cleanup: revert subscription if possible (downgrade to Free)
        try:
            resp = session.post(f"{BASE_URL}/api/subscription/downgrade", json={"plan": "Free"}, timeout=TIMEOUT)
            # Optional: No assert here, just best effort cleanup
        except Exception:
            pass

test_subscription_upgrade_and_stripe_payment_processing()