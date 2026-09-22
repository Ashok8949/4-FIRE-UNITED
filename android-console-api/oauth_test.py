import json
import os
import requests

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = [
    "https://www.googleapis.com/auth/androiddeveloperconsole"
]

CLIENT_FILE = "client_secret.json"


def main():
    print("=" * 60)
    print("4FU Android Developer Console API - OAuth Test")
    print("=" * 60)

    if not os.path.exists(CLIENT_FILE):
        print("\nERROR: client_secret.json nahi mila.")
        return

    print("\nGoogle OAuth login start ho raha hai...")
    print("Browser khulega. Apna wahi Google account select karna")
    print("jisme 4 Fire United Android Developer Console account hai.\n")

    flow = InstalledAppFlow.from_client_secrets_file(
        CLIENT_FILE,
        SCOPES
    )

    credentials = flow.run_local_server(
        host="localhost",
        port=8090,
        access_type="offline",
        prompt="consent"
    )

    print("\nOAuth SUCCESS.")
    print("Access token mil gaya.\n")

    headers = {
        "Authorization": f"Bearer {credentials.token}",
        "Accept": "application/json"
    }

    # Android Developer Console API
    url = "https://androiddeveloperconsole.googleapis.com/v1/developerAccounts"

    print("Developer accounts check ho rahe hain...")

    response = requests.get(
        url,
        headers=headers,
        timeout=30
    )

    print("\nHTTP STATUS:", response.status_code)

    try:
        data = response.json()
        print("\nAPI RESPONSE:")
        print(json.dumps(data, indent=2))
    except Exception:
        print("\nRAW RESPONSE:")
        print(response.text)

    # Save token locally for later API calls
    token_data = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "scopes": list(credentials.scopes or SCOPES)
    }

    with open("oauth_token.json", "w", encoding="utf-8") as f:
        json.dump(token_data, f, indent=2)

    print("\n" + "=" * 60)
    print("oauth_token.json create ho gaya.")
    print("Is file ko kisi ke saath share MAT karna.")
    print("=" * 60)


if __name__ == "__main__":
    main()