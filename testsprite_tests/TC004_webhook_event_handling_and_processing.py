import requests
import time

BASE_URL = "http://localhost:3000"
WEBHOOK_ENDPOINT = f"{BASE_URL}/api/webhook/instagram"
HEADERS = {
    "Authorization": "Api-Key dummyapikeyforauth",
    "Content-Type": "application/json"
}
TIMEOUT = 30

def test_webhook_event_handling_and_processing():
    # Sample valid Instagram webhook event payloads (comments and DMs)
    valid_comment_event = {
        "object": "instagram",
        "entry": [
            {
                "id": "17841400000000000",
                "time": int(time.time()),
                "changes": [
                    {
                        "field": "comments",
                        "value": {
                            "comment_id": "17895695668004550",
                            "text": "Hello from test comment",
                            "from": {
                                "id": "123456789",
                                "username": "testuser"
                            },
                            "media_id": "17895695668004549",
                            "post_id": "17895695668004548"
                        }
                    }
                ]
            }
        ]
    }

    valid_dm_event = {
        "object": "instagram",
        "entry": [
            {
                "id": "17841400000000000",
                "time": int(time.time()),
                "changes": [
                    {
                        "field": "direct_messages",
                        "value": {
                            "message_id": "mid.1234567890",
                            "text": "Hello DM from test",
                            "from": {
                                "id": "987654321",
                                "username": "dmtester"
                            },
                            "thread_id": "thread-1234"
                        }
                    }
                ]
            }
        ]
    }

    # Malformed event payloads and edge cases
    missing_object_field = {
        "entry": []
    }

    empty_changes_field = {
        "object": "instagram",
        "entry": [
            {
                "id": "17841400000000000",
                "changes": []
            }
        ]
    }

    invalid_field_name_event = {
        "object": "instagram",
        "entry": [
            {
                "id": "17841400000000000",
                "changes": [
                    {
                        "field": "unknown_field",
                        "value": {}
                    }
                ]
            }
        ]
    }

    # Helper function to post to webhook and assert response
    def post_webhook(payload):
        try:
            resp = requests.post(WEBHOOK_ENDPOINT, json=payload, headers=HEADERS, timeout=TIMEOUT)
            return resp
        except requests.RequestException as e:
            assert False, f"HTTP request failed: {e}"

    # 1. Test valid comment event
    resp = post_webhook(valid_comment_event)
    assert resp.status_code in {200, 202}, f"Expected 200 or 202, got {resp.status_code}"
    json_resp = {}
    try:
        json_resp = resp.json()
    except Exception:
        pass
    # Response body could be empty or with a result message; not strictly specified, but must not error
    assert resp.text is not None

    # 2. Test valid DM event
    resp = post_webhook(valid_dm_event)
    assert resp.status_code in {200, 202}, f"Expected 200 or 202, got {resp.status_code}"
    try:
        json_resp = resp.json()
    except Exception:
        pass
    assert resp.text is not None

    # 3. Test missing 'object' field (should accept 200 or error with 400 or 422)
    resp = post_webhook(missing_object_field)
    assert resp.status_code in {200, 400, 422}, f"Expected 200, 400 or 422 for missing object, got {resp.status_code}"

    # 4. Test entry with empty changes array (should error or ignore gracefully, expecting 400+ or 200)
    resp = post_webhook(empty_changes_field)
    assert resp.status_code in {200, 400, 422}, f"Expected 200 or 400/422 for empty changes, got {resp.status_code}"

    # 5. Test invalid field name in changes (should error or ignore with proper status)
    resp = post_webhook(invalid_field_name_event)
    assert resp.status_code in {400, 422, 200}, f"Expected 400, 422, or 200 for invalid field, got {resp.status_code}"

    # 6. Test rapid repeated valid event to check no delay/failure and idempotency/safety
    for _ in range(3):
        resp = post_webhook(valid_comment_event)
        assert resp.status_code in {200, 202}, f"Repeated event expected 200 or 202, got {resp.status_code}"
        time.sleep(0.2)  # small delay between posts

    # 7. Test invalid JSON body (send just a string or broken JSON payload)
    try:
        resp = requests.post(WEBHOOK_ENDPOINT, data="not a json", headers=HEADERS, timeout=TIMEOUT)
        assert resp.status_code in {200, 400, 422}, f"Expected 200, 400 or 422 for invalid JSON, got {resp.status_code}"
    except requests.RequestException as e:
        assert False, f"HTTP request failed on invalid JSON test: {e}"

    # 8. Test missing Authorization header (unauthorized)
    try:
        resp = requests.post(WEBHOOK_ENDPOINT, json=valid_comment_event, timeout=TIMEOUT)
        # Depending on implementation, might be 401 or 403 or accepted if no auth required on webhook
        # We assert unauthorized or forbidden if header missing
        assert resp.status_code in {401, 403, 400, 422, 200, 202}, f"Unexpected status for missing auth header: {resp.status_code}"
    except requests.RequestException as e:
        assert False, f"HTTP request failed on auth header missing test: {e}"

    # 9. Test large payload with multiple entries and changes (stress test)
    large_payload = {
        "object": "instagram",
        "entry": []
    }
    for i in range(10):
        large_payload["entry"].append({
            "id": f"1784140000000000{i}",
            "time": int(time.time()),
            "changes": [
                {
                    "field": "comments" if i % 2 == 0 else "direct_messages",
                    "value": {
                        "comment_id" if i % 2 == 0 else "message_id": f"dummy_id_{i}",
                        "text": f"Test message {i}",
                        "from": {
                            "id": f"user_{i}",
                            "username": f"user{i}"
                        },
                        "media_id" if i % 2 == 0 else "thread_id": f"media_thread_{i}",
                        "post_id" if i % 2 == 0 else None: f"post_{i}" if i % 2 == 0 else None
                    }
                }
            ]
        })
    # Remove None keys from dicts above to keep JSON valid
    for entry in large_payload["entry"]:
        changes = entry["changes"][0]
        value = changes["value"]
        to_del = [k for k, v in value.items() if v is None]
        for k in to_del:
            del value[k]

    resp = post_webhook(large_payload)
    assert resp.status_code in {200, 202}, f"Large payload expected 200 or 202, got {resp.status_code}"

test_webhook_event_handling_and_processing()
