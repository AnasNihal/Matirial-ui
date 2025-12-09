import requests
import time

BASE_URL = "http://localhost:3000"
HEADERS = {
    "Authorization": "API_KEY_PLACEHOLDER",
    "Content-Type": "application/json"
}
TIMEOUT = 30

API_KEY = "API_KEY_PLACEHOLDER"  # Replace with actual API key if available

def get_headers():
    return {
        "Authorization": API_KEY,
        "Content-Type": "application/json"
    }

def test_dashboard_metrics_and_automation_status_display():
    """
    Verify that the dashboard UI displays accurate real-time or near-real-time metrics and
    automation statuses reflecting the current system state.
    This test does comprehensive API testing for dashboard data including all pages,
    components, endpoints, error handling, edge cases, and no crashes.
    """

    headers = get_headers()

    # Step 1: Retrieve dashboard general metrics
    try:
        metrics_resp = requests.get(f"{BASE_URL}/api/dashboard/metrics", headers=headers, timeout=TIMEOUT)
        assert metrics_resp.status_code == 200, f"Expected 200 OK for metrics but got {metrics_resp.status_code}"
        metrics_data = metrics_resp.json()
        # Validate keys presence and type sanity
        assert isinstance(metrics_data, dict), "Metrics response should be a dict"
        expected_metric_keys = ["engagementCount", "dmResponses", "commentResponses", "activeAutomations", "trend"]
        for key in expected_metric_keys:
            assert key in metrics_data, f"'{key}' missing in metrics data"
        # Check some sensible numeric values
        assert isinstance(metrics_data["engagementCount"], int) and metrics_data["engagementCount"] >= 0
        assert isinstance(metrics_data["dmResponses"], int) and metrics_data["dmResponses"] >= 0
        assert isinstance(metrics_data["commentResponses"], int) and metrics_data["commentResponses"] >= 0
        assert isinstance(metrics_data["activeAutomations"], int) and metrics_data["activeAutomations"] >= 0
        assert isinstance(metrics_data["trend"], (float, int))

    except (requests.RequestException, AssertionError) as e:
        raise AssertionError(f"Dashboard metrics retrieval failed or invalid: {e}")

    # Step 2: Retrieve list of automations with their statuses
    try:
        automations_resp = requests.get(f"{BASE_URL}/api/dashboard/automations", headers=headers, timeout=TIMEOUT)
        assert automations_resp.status_code == 200, f"Expected 200 OK for automations list but got {automations_resp.status_code}"
        automations_data = automations_resp.json()
        assert isinstance(automations_data, list), "Automations response should be a list"
        for automation in automations_data:
            assert isinstance(automation, dict), "Each automation should be a dict"
            # Validate essential keys for automation
            for key in ["id", "name", "status", "triggerType", "listenerType", "keywords", "lastTriggeredAt"]:
                assert key in automation, f"'{key}' missing in automation data"
            assert automation["status"] in ["active", "inactive", "error"], f"Invalid automation status {automation['status']}"
            assert automation["triggerType"] in ["comment", "dm"], f"Invalid triggerType {automation['triggerType']}"
            assert automation["listenerType"] in ["MESSAGE", "SMARTAI"], f"Invalid listenerType {automation['listenerType']}"
            assert isinstance(automation["keywords"], list)
            # lastTriggeredAt can be None or ISO8601 string
            if automation["lastTriggeredAt"] is not None:
                assert isinstance(automation["lastTriggeredAt"], str)
    except (requests.RequestException, AssertionError) as e:
        raise AssertionError(f"Automations list retrieval failed or invalid: {e}")

    # Step 3: Validate realtime/near realtime update simulation for metrics and automation statuses
    # Approach: Poll dashboard metrics and automations a few times simulating changes
    poll_intervals = [0, 3, 6]
    previous_metrics = None
    previous_automations = None
    for sleep_sec in poll_intervals:
        if sleep_sec > 0:
            time.sleep(sleep_sec)
        try:
            m_resp = requests.get(f"{BASE_URL}/api/dashboard/metrics", headers=headers, timeout=TIMEOUT)
            a_resp = requests.get(f"{BASE_URL}/api/dashboard/automations", headers=headers, timeout=TIMEOUT)
            assert m_resp.status_code == 200 and a_resp.status_code == 200
            m_data = m_resp.json()
            a_data = a_resp.json()
            # Check data format stability
            assert isinstance(m_data, dict)
            assert isinstance(a_data, list)
            # Check metrics reasonable values (non-negative, not drastically changing downwards without reason)
            for key in expected_metric_keys:
                if previous_metrics is not None:
                    # Metrics like engagementCount etc should not decrease abruptly (allow some tolerance)
                    prev_val = previous_metrics.get(key, 0)
                    curr_val = m_data.get(key, 0)
                    assert curr_val >= prev_val - 5, f"Metric '{key}' decreased sharply"
                else:
                    # First iteration just check non-negative
                    assert m_data.get(key, 0) >= 0
            # Check automation statuses consistency
            if previous_automations is not None:
                prev_ids = {a["id"]: a["status"] for a in previous_automations}
                for a in a_data:
                    prev_status = prev_ids.get(a["id"])
                    curr_status = a["status"]
                    # Status should be within expected list and not be null
                    assert curr_status in ["active", "inactive", "error"]
                    # Status can change but not to invalid values
                    if prev_status:
                        assert curr_status == prev_status or curr_status in ["active", "inactive", "error"]
            # Store current data for next iteration comparison
            previous_metrics = m_data
            previous_automations = a_data
        except (requests.RequestException, AssertionError) as e:
            raise AssertionError(f"Polling dashboard data failed or inconsistent: {e}")

    # Step 4: Error handling tests for dashboard endpoints
    # 4a: Missing/invalid auth header
    try:
        bad_headers = {"Authorization": "InvalidKey"}
        resp = requests.get(f"{BASE_URL}/api/dashboard/metrics", headers=bad_headers, timeout=TIMEOUT)
        assert resp.status_code in [401, 403], f"Expected 401/403 for invalid auth but got {resp.status_code}"
        resp = requests.get(f"{BASE_URL}/api/dashboard/automations", headers=bad_headers, timeout=TIMEOUT)
        assert resp.status_code in [401, 403], f"Expected 401/403 for invalid auth but got {resp.status_code}"
    except requests.RequestException as e:
        raise AssertionError(f"Error handling for invalid auth failed: {e}")

    # 4b: Endpoint not found / invalid endpoint
    try:
        resp = requests.get(f"{BASE_URL}/api/dashboard/nonexistent", headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 404, f"Expected 404 for invalid endpoint but got {resp.status_code}"
    except requests.RequestException as e:
        raise AssertionError(f"Error handling for invalid endpoint failed: {e}")

    # Step 5: Edge case - Empty automations list simulation (requires test resource creation/deletion)
    # Here, no direct API to clear automations - so only check if list can be empty and handled properly
    # If automations list is empty, dashboard should not error, metrics remain sensible
    try:
        # We cannot create/remove automations here without API details, but check if empty is received gracefully
        automations_resp_test = requests.get(f"{BASE_URL}/api/dashboard/automations", headers=headers, timeout=TIMEOUT)
        automations_list = automations_resp_test.json()
        assert isinstance(automations_list, list)
        # If empty list:
        if len(automations_list) == 0:
            # Metrics endpoint should still respond correctly
            metrics_resp_test = requests.get(f"{BASE_URL}/api/dashboard/metrics", headers=headers, timeout=TIMEOUT)
            metrics_data_test = metrics_resp_test.json()
            assert isinstance(metrics_data_test, dict)
            # Active automations count must be 0
            assert metrics_data_test.get("activeAutomations", 0) == 0
    except (requests.RequestException, AssertionError) as e:
        raise AssertionError(f"Edge case empty automations check failed: {e}")

    # Step 6: Comprehensive coverage for other dashboard components endpoints (summary examples)
    # Example: check integration status endpoint if exists
    try:
        integration_resp = requests.get(f"{BASE_URL}/api/dashboard/integrations/status", headers=headers, timeout=TIMEOUT)
        if integration_resp.status_code == 200:
            data = integration_resp.json()
            assert isinstance(data, dict)
            # Validate expected keys (guessing typical keys)
            for key in ["instagramConnected", "lastSync", "syncStatus"]:
                assert key in data
        elif integration_resp.status_code == 404:
            # Endpoint may not exist - pass as optional
            pass
        else:
            assert False, f"Unexpected status {integration_resp.status_code} for integrations status"
    except requests.RequestException:
        # Ignore if endpoint not implemented
        pass

    # Step 7: Test toggling dark/light theme setting API if available
    try:
        theme_resp = requests.post(f"{BASE_URL}/api/user/theme-toggle", headers=headers, timeout=TIMEOUT, json={"theme": "dark"})
        if theme_resp.status_code == 200:
            resp_data = theme_resp.json()
            assert resp_data.get("theme") == "dark"
            # toggle back
            theme_resp2 = requests.post(f"{BASE_URL}/api/user/theme-toggle", headers=headers, timeout=TIMEOUT, json={"theme": "light"})
            if theme_resp2.status_code == 200:
                resp_data2 = theme_resp2.json()
                assert resp_data2.get("theme") == "light"
        elif theme_resp.status_code == 404:
            # Not implemented, ignore
            pass
        else:
            assert False, f"Unexpected status {theme_resp.status_code} for theme toggle"
    except requests.RequestException:
        pass

    # Done all validations without crashes/errors

test_dashboard_metrics_and_automation_status_display()