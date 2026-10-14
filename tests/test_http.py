import urllib.request
import json
import sys

def test_url(name, url, method='GET', payload=None):
    try:
        data = json.dumps(payload).encode('utf-8') if payload else None
        headers = {'Content-Type': 'application/json'} if payload else {}
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=10) as resp:
            status = resp.status
            content = resp.read()
            print(f"[PASS] {name}: HTTP {status} ({len(content)} bytes)")
            if 'api' in url:
                parsed = json.loads(content.decode('utf-8'))
                print(f"       Preview: {str(parsed)[:110]}...")
    except Exception as e:
        print(f"[FAIL] {name}: Failed - {e}")

test_url("Home Page HTML", "http://localhost:3000/")
test_url("Admin Page HTML", "http://localhost:3000/admin")
test_url("API Places (Search Canteen)", "http://localhost:3000/api/places?q=canteen")
test_url("API Paths Network", "http://localhost:3000/api/paths")
test_url("API Route (Gate to Canteen)", "http://localhost:3000/api/routes", method="POST", payload={"startPlaceId": "place-main-gate", "destPlaceId": "place-canteen"})
test_url("API Chat (Gravity AI)", "http://localhost:3000/api/chat", method="POST", payload={"query": "How do I reach Central Library from Main Gate?"})
test_url("API Submit Report", "http://localhost:3000/api/reports", method="POST", payload={"issueType": "OTHER", "description": "Automated end-to-end integration check."})
