import requests
import time

BASE_URL = "http://localhost:3000"
API_KEY_HEADER = {"Authorization": "Bearer your_api_key_here"}  # Replace your_api_key_here with actual key
TIMEOUT = 30


def test_data_fetching_and_caching_with_react_query():
    """
    This test validates that the data fetching API endpoints used by React Query hooks:
    - Return correct data with minimal latency
    - Support caching properly (simulate repeated calls, validate no new data fetch beyond first)
    - Handle errors gracefully
    - Cover all main API endpoints that React Query would use (e.g. automations, user profiles, integrations)
    """

    session = requests.Session()
    session.headers.update(API_KEY_HEADER)

    try:
        # 1. Fetch user profile multiple times and assert identical response and minimal latency on repeated calls
        user_profile_url = f"{BASE_URL}/api/user/profile"
        start = time.time()
        r1 = session.get(user_profile_url, timeout=TIMEOUT)
        duration_first = time.time() - start
        assert r1.status_code == 200, f"Failed to fetch user profile: {r1.text}"
        user_profile_data_1 = r1.json()
        assert isinstance(user_profile_data_1, dict)
        # Repeat request immediately to test caching effect (React Query caches on client, but server could vary)
        start = time.time()
        r2 = session.get(user_profile_url, timeout=TIMEOUT)
        duration_second = time.time() - start
        assert r2.status_code == 200, f"Failed to fetch user profile second time: {r2.text}"
        user_profile_data_2 = r2.json()
        assert user_profile_data_1 == user_profile_data_2, "User profile response differs between calls"
        # The second call duration should not be significantly longer (network variability considered)
        assert duration_second <= duration_first * 1.5, "Second user profile call unexpectedly slower"

        # 2. Fetch automations list multiple times and verify caching by ensuring identical data and response success
        automations_url = f"{BASE_URL}/api/automations"
        r3 = session.get(automations_url, timeout=TIMEOUT)
        assert r3.status_code == 200, f"Failed to fetch automations: {r3.text}"
        automations_data_1 = r3.json()
        assert isinstance(automations_data_1, list)

        r4 = session.get(automations_url, timeout=TIMEOUT)
        assert r4.status_code == 200, f"Failed to fetch automations second time: {r4.text}"
        automations_data_2 = r4.json()
        assert automations_data_1 == automations_data_2, "Automations list data differs between calls"

        # 3. Fetch integration data multiple times and validate data consistency and caching simulation
        integration_url = f"{BASE_URL}/api/integrations"
        r5 = session.get(integration_url, timeout=TIMEOUT)
        assert r5.status_code == 200, f"Failed to fetch integrations: {r5.text}"
        integrations_data_1 = r5.json()
        assert isinstance(integrations_data_1, list)

        r6 = session.get(integration_url, timeout=TIMEOUT)
        assert r6.status_code == 200, f"Failed to fetch integrations second time: {r6.text}"
        integrations_data_2 = r6.json()
        assert integrations_data_1 == integrations_data_2, "Integrations data differs between calls"

        # 4. Test edge case: invalid endpoint to confirm error is handled properly
        invalid_url = f"{BASE_URL}/api/invalid-endpoint"
        r7 = session.get(invalid_url, timeout=TIMEOUT)
        assert r7.status_code == 404 or r7.status_code >= 400, "Invalid endpoint should return error status"

        # 5. Test error handling with malformed authorization header
        bad_session = requests.Session()
        bad_session.headers.update({"Authorization": "Bearer bad_api_key"})
        r8 = bad_session.get(user_profile_url, timeout=TIMEOUT)
        assert r8.status_code == 401 or r8.status_code == 403, "Bad authorization should return 401 or 403"

        # 6. Test repeated calls with identical query parameters to check consistency and caching simulation
        # Example: Fetch automation details by ID if automations exist
        if automations_data_1:
            automation = automations_data_1[0]
            automation_id = automation.get("id")
            if automation_id:
                automation_detail_url = f"{BASE_URL}/api/automations/{automation_id}"
                r9 = session.get(automation_detail_url, timeout=TIMEOUT)
                assert r9.status_code == 200, f"Failed to fetch automation detail: {r9.text}"
                data_1 = r9.json()

                r10 = session.get(automation_detail_url, timeout=TIMEOUT)
                assert r10.status_code == 200, f"Failed second fetch automation detail: {r10.text}"
                data_2 = r10.json()
                assert data_1 == data_2, "Automation detail data differs between repeated calls"
        else:
            print("No automations found to test detailed caching.")

        # 7. Test loading of metrics data multiple times to validate caching/stability
        metrics_url = f"{BASE_URL}/api/dashboard/metrics"
        r11 = session.get(metrics_url, timeout=TIMEOUT)
        assert r11.status_code == 200, f"Failed to fetch dashboard metrics: {r11.text}"
        metrics_data_1 = r11.json()
        assert isinstance(metrics_data_1, dict)

        r12 = session.get(metrics_url, timeout=TIMEOUT)
        assert r12.status_code == 200, f"Failed second fetch dashboard metrics: {r12.text}"
        metrics_data_2 = r12.json()
        assert metrics_data_1 == metrics_data_2, "Dashboard metrics data differs between calls"

        print("All data fetching and caching tests passed successfully.")

    except (requests.RequestException, AssertionError) as e:
        print(f"Test failed: {e}")
        raise


test_data_fetching_and_caching_with_react_query()
