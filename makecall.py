import requests

# Replace these with your actual values
API_KEY = "6de28f2c-f1cd-4cbc-a8a1-cd6a83224104"
ASSISTANT_ID = "b732231a-0409-411a-b577-3ad944a00afd"
PHONE_NUMBER_ID = "1e2bc018-fdc7-4996-b5d6-3a58f245c37b"



LISTING_PHONE = "+14804146609"         # the apartment’s phone number (E.164 format)
LISTING_NAME = "Sunnyview Apartments"  # optional context
LISTING_ADDRESS = "123 Main St, Philadelphia, PA"  # optional context
USER_QUESTIONS = [
    "Can I host loud parties?",
    "Did anyone famous live here in the past?",
    "What should I do about noise complaints?"
]

url = "https://api.vapi.ai/call"
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

variable_values = {
    # These names must match the {{variables}} you use in your assistant prompt
    "listing_name": LISTING_NAME,
    "listing_phone": LISTING_PHONE,
    "listing_address": LISTING_ADDRESS,
    "joined_questions": "\n".join(f"- {q}" for q in USER_QUESTIONS),
}

payload = {
    "assistantId": ASSISTANT_ID,
    "phoneNumberId": PHONE_NUMBER_ID,
    "customer": {"number": LISTING_PHONE},     # agent calls the listing
    "assistantOverrides": {
        # Dynamic variables that your assistant's prompt references
        "variableValues": variable_values,
    }
}

resp = requests.post(url, headers=headers, json=payload)
print("Status:", resp.status_code)
try:
    print(json.dumps(resp.json(), indent=2))
except Exception:
    print(resp.text)
