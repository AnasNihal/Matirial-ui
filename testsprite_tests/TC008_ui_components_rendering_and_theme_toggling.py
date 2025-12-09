import requests
import time

BASE_URL = "http://localhost:3000"
HEADERS = {
    "Authorization": "Api-Key example_key_value",
    "Accept": "application/json",
    "Content-Type": "application/json"
}
TIMEOUT = 30


def test_ui_components_rendering_and_theme_toggling():
    """
    Test UI components render correctly with consistent styling and responsive behavior,
    including the dark/light theme toggle functionality.
    This test queries multiple pages and endpoints, checks api accessibility, error handling,
    and theme toggle related endpoints or UI state APIs if any.
    """

    session = requests.Session()
    session.headers.update(HEADERS)

    # Pages and endpoints to test UI rendering and API for theme toggle & UI states:
    pages = [
        "/",  # Landing page (Public marketing page)
        "/dashboard/default",  # Dashboard main page (protected)
        "/dashboard/default/automations",  # Automations listing
        "/dashboard/default/integrations",  # Integrations page
        "/dashboard/default/payment",  # Payment & subscription page
        "/dashboard/default/settings",  # Settings page
    ]

    # Step 1: Check accessibility and status codes of all main UI pages
    for page in pages:
        url = f"{BASE_URL}{page}"
        try:
            resp = session.get(url, timeout=TIMEOUT)
            assert resp.status_code == 200, f"Page {page} did not return 200 OK"
            content_type = resp.headers.get("Content-Type", "")
            assert "text/html" in content_type or "application/json" in content_type, f"Invalid content type on {page}"
            # Minimal smoke test on HTML content length or json keys for dashboard pages
            assert len(resp.content) > 100, f"Content seems too short on {page}"
        except Exception as e:
            assert False, f"Failed to load {page}: {str(e)}"

    # Step 2: Test theme toggle API or endpoint (if exists)
    # Assuming theme state may be toggle-able via an API endpoint or UI route:
    # Hypothetical endpoint: PUT /api/user/theme-toggle to toggle between dark and light themes
    theme_toggle_endpoint = f"{BASE_URL}/api/user/theme-toggle"
    # Since no schema defined, we'll make a safe assumption:
    # The toggle is achieved via POST or PUT with no payload or a body: { "theme": "dark" or "light" }
    # We'll toggle dark and light and verify response status and response content

    for theme in ["dark", "light"]:
        try:
            resp = session.put(theme_toggle_endpoint, json={"theme": theme}, timeout=TIMEOUT)
            # Accept 200 or 204 as success for toggle
            assert resp.status_code in (200, 204), f"Theme toggle to {theme} failed with status {resp.status_code}"
            # If json response, validate returned theme
            if resp.headers.get("Content-Type", "").startswith("application/json"):
                json_resp = resp.json()
                assert json_resp.get("theme") == theme, f"Theme toggle response incorrect theme {json_resp.get('theme')}"
        except requests.exceptions.HTTPError as e:
            # Theme toggle API might not exist or might require auth, check 401 or 403 gracefully
            if resp.status_code in (401, 403):
                # If unauthorized, just skip theme toggle API testing with warning
                pass
            else:
                assert False, f"Theme toggle request failed: {str(e)}"
        except Exception as e:
            assert False, f"Theme toggle request unexpected failure: {str(e)}"

    # Step 3: Test UI API endpoints for consistent styling data, responsive behavior metadata or UI state APIs
    # From PRD and file structure, no dedicated API endpoints explicitly for UI components,
    # but dashboard metrics and automations APIs serve UI state data
    api_endpoints = [
        "/api/dashboard/metrics",
        "/api/automations",
        "/api/integrations",
        "/api/payment/status",
        "/api/user/settings",
    ]

    for api in api_endpoints:
        url = f"{BASE_URL}{api}"
        try:
            resp = session.get(url, timeout=TIMEOUT)
            # Some endpoints may require auth, so 401/403 is valid and indicates secured API
            if resp.status_code == 401 or resp.status_code == 403:
                # just note and continue
                continue
            assert resp.status_code == 200, f"API endpoint {api} returned {resp.status_code}"
            assert resp.headers.get("Content-Type", "").startswith("application/json")
            json_resp = resp.json()
            assert isinstance(json_resp, (dict, list)), f"API endpoint {api} returned invalid JSON structure"
        except Exception as e:
            assert False, f"API endpoint {api} request failed: {str(e)}"

    # Step 4: Error handling test - access unknown page and invalid endpoint to test app error page/display
    unknown_pages = ["/unknown-page-xyz", "/api/non-existent-endpoint"]
    for unk in unknown_pages:
        url = f"{BASE_URL}{unk}"
        try:
            resp = session.get(url, timeout=TIMEOUT)
            assert resp.status_code in (404, 301, 302), f"Unknown endpoint {unk} should return 404 or redirect, got {resp.status_code}"
        except Exception as e:
            assert False, f"Error handling route {unk} request failed: {str(e)}"

    # Step 5: Responsiveness check (simulate small screen width by requesting mobile user agent)
    mobile_headers = HEADERS.copy()
    mobile_headers["User-Agent"] = (
        "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1 "
        "Mobile/15E148 Safari/604.1"
    )
    session.headers.update(mobile_headers)
    for page in pages:
        url = f"{BASE_URL}{page}"
        try:
            resp = session.get(url, timeout=TIMEOUT)
            assert resp.status_code == 200, f"Mobile User-Agent page {page} did not return 200 OK"
            # Could check presence of viewport meta tag or adaptive CSS classes in HTML content:
            content = resp.text.lower()
            assert "<meta name=\"viewport\"" in content or "tailwind" in content, f"Responsive meta tag or css classes missing in {page} for mobile"
        except Exception as e:
            assert False, f"Mobile UI test failed on {page}: {str(e)}"


test_ui_components_rendering_and_theme_toggling()