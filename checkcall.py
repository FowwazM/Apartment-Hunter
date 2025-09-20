import requests
import json

# ===== Adjustable variables =====
API_KEY = "6de28f2c-f1cd-4cbc-a8a1-cd6a83224104"  # from your snippet
CALL_ID = "cdbaa6f6-8df7-4253-aec9-091c483afc4e"                      # e.g. "123e4567-e89b-12d3-a456-426614174000"
# =================================

url = f"https://api.vapi.ai/call/{CALL_ID}"
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

resp = requests.get(url, headers=headers)
print("Status:", resp.status_code)

try:
    data = resp.json()
    analysis = (data.get("analysis") or {})
    artifact = (data.get("artifact") or {})

    print("\n--- Analysis Summary ---")
    print(analysis.get("summary") or "No summary found")

    print("\n--- Transcript ---")
    print(artifact.get("transcript") or "No transcript found")

except Exception as e:
    print("Error parsing response:", e)
    print(resp.text)