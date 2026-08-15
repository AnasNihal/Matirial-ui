import requests
import uuid
import time

BASE_URL = "http://localhost:3000"
API_KEY = "test-api-key-value"  # Replace with valid API key before running
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}
TIMEOUT = 30

def test_automation_creation_and_trigger_execution():
    # Helper functions
    def create_automation(payload):
        r = requests.post(f"{BASE_URL}/api/automations", headers=HEADERS, json=payload, timeout=TIMEOUT)
        r.raise_for_status()
        return r.json()  # expect {id: ..., ...}

    def get_automation(automation_id):
        r = requests.get(f"{BASE_URL}/api/automations/{automation_id}", headers=HEADERS, timeout=TIMEOUT)
        r.raise_for_status()
        return r.json()

    def update_automation(automation_id, payload):
        r = requests.put(f"{BASE_URL}/api/automations/{automation_id}", headers=HEADERS, json=payload, timeout=TIMEOUT)
        r.raise_for_status()
        return r.json()

    def delete_automation(automation_id):
        r = requests.delete(f"{BASE_URL}/api/automations/{automation_id}", headers=HEADERS, timeout=TIMEOUT)
        return r.status_code in (200,204)

    def trigger_webhook(event_payload):
        r = requests.post(f"{BASE_URL}/api/webhook/instagram", headers=HEADERS, json=event_payload, timeout=TIMEOUT)
        return r

    # Unique keywords for testing
    comment_keyword = f"commenttest-{uuid.uuid4().hex[:8]}"
    dm_keyword = f"dmtest-{uuid.uuid4().hex[:8]}"

    # Step 1: Create Comment Automation with MESSAGE listener
    comment_automation_payload = {
        "name": "Test Comment Automation MESSAGE",
        "trigger": {
            "type": "comment",
            "keywords": [comment_keyword],
            "instagram_posts": ["all"]  # assuming "all" is valid for targeting all posts
        },
        "listener": {
            "type": "MESSAGE",
            "response": {
                "message": f"Auto-reply message to comment containing {comment_keyword}"
            }
        },
        "active": True
    }

    # Step 2: Create DM Automation with SMARTAI listener
    dm_automation_payload = {
        "name": "Test DM Automation SMARTAI",
        "trigger": {
            "type": "dm",
            "keywords": [dm_keyword]
        },
        "listener": {
            "type": "SMARTAI",
            "config": {
                "model": "gpt-4",
                "prompt": "Provide a smart AI reply based on received DM content."
            }
        },
        "active": True
    }

    comment_automation = None
    dm_automation = None

    try:
        # Create both automations
        comment_automation = create_automation(comment_automation_payload)
        assert "id" in comment_automation, "Comment automation creation failed, no ID returned."

        dm_automation = create_automation(dm_automation_payload)
        assert "id" in dm_automation, "DM automation creation failed, no ID returned."

        # Validate both automations were created correctly by fetching them
        fetched_comment = get_automation(comment_automation["id"])
        assert fetched_comment["trigger"]["type"] == "comment"
        assert comment_keyword in fetched_comment["trigger"]["keywords"]
        assert fetched_comment["listener"]["type"] == "MESSAGE"
        assert fetched_comment["active"] is True

        fetched_dm = get_automation(dm_automation["id"])
        assert fetched_dm["trigger"]["type"] == "dm"
        assert dm_keyword in fetched_dm["trigger"]["keywords"]
        assert fetched_dm["listener"]["type"] == "SMARTAI"
        assert fetched_dm["active"] is True

        # Step 3: Simulate Instagram webhook event for comment matching the comment automation
        comment_event_payload = {
            "object": "instagram",
            "entry": [{
                "id": "page-id",
                "time": int(time.time()),
                "changes": [{
                    "field": "comments",
                    "value": {
                        "comment_id": "comment1",
                        "text": f"This is a test comment with keyword {comment_keyword}",
                        "from": {"id": "user1", "username": "tester_comment"},
                        "post_id": "post1"
                    }
                }]
            }]
        }
        response_comment = trigger_webhook(comment_event_payload)
        assert response_comment.status_code == 200, f"Webhook comment event response invalid: {response_comment.status_code}"
        assert response_comment.json().get("status") == "processed", "Comment webhook not processed as expected."

        # Step 4: Simulate Instagram webhook event for DM matching the DM automation
        dm_event_payload = {
            "object": "instagram",
            "entry": [{
                "id": "page-id",
                "time": int(time.time()),
                "changes": [{
                    "field": "direct_messages",
                    "value": {
                        "dm_id": "dm1",
                        "message": f"Hello, testing DM with keyword {dm_keyword}",
                        "from": {"id": "user2", "username": "tester_dm"},
                        "to": {"id": "page-id"}
                    }
                }]
            }]
        }
        response_dm = trigger_webhook(dm_event_payload)
        assert response_dm.status_code == 200, f"Webhook DM event response invalid: {response_dm.status_code}"
        assert response_dm.json().get("status") == "processed", "DM webhook not processed as expected."

        # Step 5: Negative test - send webhook with no matching keywords - should not trigger responses
        unmatched_comment_payload = {
            "object": "instagram",
            "entry": [{
                "id": "page-id",
                "time": int(time.time()),
                "changes": [{
                    "field": "comments",
                    "value": {
                        "comment_id": "comment2",
                        "text": "This comment does not contain any automation keywords",
                        "from": {"id": "user3", "username": "tester_no_trigger"},
                        "post_id": "post2"
                    }
                }]
            }]
        }
        response_no_trigger = trigger_webhook(unmatched_comment_payload)
        assert response_no_trigger.status_code == 200
        assert response_no_trigger.json().get("status") == "ignored"

        # Step 6: Edge case - empty keyword list in automation (update DM automation to empty keywords)
        updated_payload = dm_automation.copy()
        updated_payload["trigger"]["keywords"] = []
        updated_update_response = update_automation(dm_automation["id"], updated_payload)
        assert updated_update_response["trigger"]["keywords"] == []

        # Trigger webhook with DM again with previous keyword, should not process now
        response_dm_after_update = trigger_webhook(dm_event_payload)
        assert response_dm_after_update.status_code == 200
        assert response_dm_after_update.json().get("status") == "ignored"

        # Step 7: Error case - try to create invalid automation with missing trigger type
        invalid_automation_payload = {
            "name": "Invalid Automation Missing Trigger",
            "trigger": {},
            "listener": {
                "type": "MESSAGE",
                "response": {"message": "Hi"}
            },
            "active": True
        }
        r_invalid = requests.post(f"{BASE_URL}/api/automations", headers=HEADERS, json=invalid_automation_payload, timeout=TIMEOUT)
        assert r_invalid.status_code == 400, "Invalid automation creation should return 400 Bad Request."

        # Step 8: Crash prevention - send malformed webhook payload
        malformed_payload = {"invalid": "data"}
        r_malformed = requests.post(f"{BASE_URL}/api/webhook/instagram", headers=HEADERS, json=malformed_payload, timeout=TIMEOUT)
        assert r_malformed.status_code == 400 or r_malformed.status_code == 422, "Malformed webhook should return client error status."

    finally:
        # Cleanup created automations
        if comment_automation and "id" in comment_automation:
            try:
                delete_automation(comment_automation["id"])
            except Exception:
                pass
        if dm_automation and "id" in dm_automation:
            try:
                delete_automation(dm_automation["id"])
            except Exception:
                pass

test_automation_creation_and_trigger_execution()
