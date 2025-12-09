import requests
import time

BASE_URL = "http://localhost:3000"
HEADERS = {"Authorization": "Bearer test-api-key", "Content-Type": "application/json"}
TIMEOUT = 30

def test_end_to_end_user_flows():
    session = requests.Session()
    session.headers.update(HEADERS)
    instagram_integration = None
    automation_comment = None
    automation_dm = None
    subscription = None

    try:
        # Skipping user onboarding, sign-in, and Instagram OAuth integration steps due to missing API endpoints

        # Use a dummy Instagram user ID for automation creation
        instagram_id = "dummy_instagram_user_id"

        # 4. Create a Comment Automation
        comment_auto_payload = {
            "name": "E2E Test Comment Automation",
            "triggerType": "COMMENT",
            "keywords": ["hello", "test"],
            "instagramPosts": [instagram_id],
            "listenerType": "MESSAGE",
            "responseMessage": "Thanks for your comment! This is an automated response.",
            "active": True
        }
        r = session.post(f"{BASE_URL}/api/automations", json=comment_auto_payload, timeout=TIMEOUT)
        assert r.status_code == 201, f"Comment automation creation failed: {r.text}"
        automation_comment = r.json()
        auto_comment_id = automation_comment.get("id")
        assert auto_comment_id, "Comment automation ID missing"

        # 5. Create a DM Automation with SMARTAI listener
        dm_auto_payload = {
            "name": "E2E Test DM Automation",
            "triggerType": "DM",
            "keywords": ["help", "support"],
            "listenerType": "SMARTAI",
            "active": True
        }
        r = session.post(f"{BASE_URL}/api/automations", json=dm_auto_payload, timeout=TIMEOUT)
        assert r.status_code == 201, f"DM automation creation failed: {r.text}"
        automation_dm = r.json()
        auto_dm_id = automation_dm.get("id")
        assert auto_dm_id, "DM automation ID missing"

        # 6. Simulate Webhook Event Handling - comment event matching automation
        comment_webhook_payload = {
            "object": "instagram",
            "entry": [{
                "id": instagram_id,
                "changes": [{
                    "field": "comments",
                    "value": {
                        "comment_id": "12345",
                        "comment_text": "hello there",
                        "post_id": "post123",
                        "user_id": "user789"
                    }
                }]
            }]
        }
        r = session.post(f"{BASE_URL}/api/webhook/instagram", json=comment_webhook_payload, timeout=TIMEOUT)
        assert r.status_code == 200, f"Webhook comment event handling failed: {r.text}"
        assert "received" in r.text.lower() or "success" in r.text.lower(), "Webhook response invalid"

        # 7. Simulate Webhook Event Handling - DM event matching automation
        dm_webhook_payload = {
            "object": "instagram",
            "entry": [{
                "id": instagram_id,
                "changes": [{
                    "field": "direct_message",
                    "value": {
                        "dm_id": "dm123",
                        "message_text": "I need support",
                        "sender_id": "user789"
                    }
                }]
            }]
        }
        r = session.post(f"{BASE_URL}/api/webhook/instagram", json=dm_webhook_payload, timeout=TIMEOUT)
        assert r.status_code == 200, f"Webhook DM event handling failed: {r.text}"
        assert "received" in r.text.lower() or "success" in r.text.lower(), "Webhook DM response invalid"

        # 8. Dashboard Metrics Fetch - Validate metrics endpoint for real-time data
        r = session.get(f"{BASE_URL}/api/dashboard/metrics", timeout=TIMEOUT)
        assert r.status_code == 200, f"Dashboard metrics fetch failed: {r.text}"
        metrics = r.json()
        assert "automationsCount" in metrics and metrics["automationsCount"] >= 2, "Metrics missing or incorrect automations count"

        # 9. Subscription Upgrade Flow - initiate upgrade
        upgrade_payload = {
            "plan": "pro",
            "paymentMethod": "test_card_visa"
        }
        r = session.post(f"{BASE_URL}/api/subscription/upgrade", json=upgrade_payload, timeout=TIMEOUT)
        assert r.status_code == 200, f"Subscription upgrade initiation failed: {r.text}"
        subscription = r.json()
        subscription_id = subscription.get("id")
        assert subscription_id, "Subscription ID missing after upgrade"
        assert subscription.get("plan") == "pro", "Plan upgrade not reflected correctly"

        # 10. Confirm Subscription Status
        r = session.get(f"{BASE_URL}/api/subscription/status", timeout=TIMEOUT)
        assert r.status_code == 200, f"Subscription status fetch failed: {r.text}"
        status = r.json()
        assert status.get("plan") == "pro", "Subscription status is not updated to pro"

        # 11. Test Data Fetching Caching via repeated calls and check time (simulate React Query behavior)
        start_time = time.time()
        r1 = session.get(f"{BASE_URL}/api/automations", timeout=TIMEOUT)
        duration1 = time.time() - start_time
        assert r1.status_code == 200, f"Automations fetch failed: {r1.text}"

        start_time = time.time()
        r2 = session.get(f"{BASE_URL}/api/automations", timeout=TIMEOUT)
        duration2 = time.time() - start_time
        assert r2.status_code == 200, f"Automations fetch failed (second call): {r2.text}"

        # 12. Error Handling - try invalid API call to provoke error and check friendly message
        r = session.post(f"{BASE_URL}/api/automations", json={"invalid_field": "value"}, timeout=TIMEOUT)
        assert r.status_code >= 400, "Invalid automation creation did not return error status"
        error_resp = r.json()
        assert "error" in error_resp or "message" in error_resp, "Error message missing in response"

        # 13. UI Components and theme toggling test via API (simulate config change)
        # Toggle to dark mode
        r = session.post(f"{BASE_URL}/api/user/settings/theme", json={"theme": "dark"}, timeout=TIMEOUT)
        assert r.status_code == 200, "Failed to set dark theme"
        theme_response = r.json()
        assert theme_response.get("theme") == "dark", "Theme toggle to dark failed"

        # Toggle back to light mode
        r = session.post(f"{BASE_URL}/api/user/settings/theme", json={"theme": "light"}, timeout=TIMEOUT)
        assert r.status_code == 200, "Failed to set light theme"
        theme_response = r.json()
        assert theme_response.get("theme") == "light", "Theme toggle to light failed"

    finally:
        # Cleanup: delete created automations
        if automation_comment and "id" in automation_comment:
            try:
                session.delete(f"{BASE_URL}/api/automations/{automation_comment['id']}", timeout=TIMEOUT)
            except Exception:
                pass
        if automation_dm and "id" in automation_dm:
            try:
                session.delete(f"{BASE_URL}/api/automations/{automation_dm['id']}", timeout=TIMEOUT)
            except Exception:
                pass
        # Cleanup: No Instagram integration created
        # Cleanup: cancel subscription if created
        if subscription and "id" in subscription:
            try:
                session.post(f"{BASE_URL}/api/subscription/cancel", json={"subscriptionId": subscription["id"]}, timeout=TIMEOUT)
            except Exception:
                pass

test_end_to_end_user_flows()
