#!/usr/bin/env python3
"""
Script to scrape Vancouver City Council meeting records from the API.
"""

import requests
import json
from typing import Dict, List, Optional

# API Configuration
API_BASE_URL = "https://api.vancouver.ca/App/CouncilMeetings/CouncilMeetings.API/api"
API_KEY = "19B5C94F2AA4BFEADA1806F16481A5E6B303A94A10668BF04C0058C8E98286CE"
ENDPOINT = f"{API_BASE_URL}/CouncilMeetings"

# Common API key header formats to try
API_KEY_HEADERS = [
    {"X-API-Key": API_KEY},
    {"Api-Key": API_KEY},
    {"API-Key": API_KEY},
    {"X-API-KEY": API_KEY},
    {"Authorization": f"Bearer {API_KEY}"},
    {"Authorization": API_KEY},
    {"apikey": API_KEY},
]


def test_api_key_format() -> Optional[Dict]:
    """
    Test different API key header formats to find the correct one.
    Returns the working headers dict if found, None otherwise.
    """
    params = {"type": "previous"}
    
    print("Testing API key formats...")
    
    for headers in API_KEY_HEADERS:
        try:
            print(f"Trying header: {list(headers.keys())[0]}")
            response = requests.get(ENDPOINT, params=params, headers=headers, timeout=10)
            
            if response.status_code == 200:
                print(f"✓ Success! Working header: {list(headers.keys())[0]}")
                return headers
            elif response.status_code == 401:
                print(f"  ✗ Unauthorized (401)")
            elif response.status_code == 403:
                print(f"  ✗ Forbidden (403)")
            else:
                print(f"  ✗ Status code: {response.status_code}")
                print(f"    Response: {response.text[:200]}")
                
        except requests.exceptions.RequestException as e:
            print(f"  ✗ Error: {e}")
    
    # Try as query parameter
    print("\nTrying API key as query parameter...")
    try:
        params_with_key = {**params, "apiKey": API_KEY}
        response = requests.get(ENDPOINT, params=params_with_key, timeout=10)
        
        if response.status_code == 200:
            print("✓ Success! API key works as query parameter 'apiKey'")
            return None  # Return None to indicate query param should be used
        else:
            print(f"  ✗ Status code: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"  ✗ Error: {e}")
    
    return None


def fetch_meetings(
    meeting_type: str = "previous",
    headers: Optional[Dict] = None,
    use_query_param: bool = False
) -> Optional[List[Dict]]:
    """
    Fetch all meetings from the API and transform to desired format.
    
    Note: This API endpoint returns ALL meetings in a single request,
    so no pagination is needed.
    
    Args:
        meeting_type: Type of meetings ('previous', 'upcoming', 'all')
        headers: HTTP headers dict (if API key is in header)
        use_query_param: Whether to send API key as query parameter
    
    Returns:
        List of transformed meeting records, or None if request failed
    """
    params = {"type": meeting_type}
    
    # If API key should be in query params, add it
    if use_query_param:
        params["apiKey"] = API_KEY
    
    try:
        response = requests.get(ENDPOINT, params=params, headers=headers, timeout=30)
        if response.status_code == 200:
            data = response.json()
            raw_meetings = None
            
            # API returns a list directly
            if isinstance(data, list):
                raw_meetings = data
            # Handle if it's wrapped in an object
            elif isinstance(data, dict):
                if "data" in data:
                    raw_meetings = data["data"]
                elif "items" in data:
                    raw_meetings = data["items"]
                elif "results" in data:
                    raw_meetings = data["results"]
                elif "meetings" in data:
                    raw_meetings = data["meetings"]
            
            # Transform the meetings to desired format
            if raw_meetings:
                transformed_meetings = []
                for idx, meeting in enumerate(raw_meetings):
                    # Build full URL
                    meeting_url = meeting.get("relatedURL", "")
                    if meeting_url:
                        meeting_url = f"https://council.vancouver.ca{meeting_url}"
                    
                    transformed_meeting = {
                        "id": idx,
                        "meetingType": meeting.get("eventTitle", ""),
                        "status": meeting.get("locationStatus", ""),
                        "eventDate": meeting.get("eventDateStart", ""),
                        "meetingUrl": meeting_url
                    }
                    transformed_meetings.append(transformed_meeting)
                
                return transformed_meetings
        else:
            print(f"Error: Status code {response.status_code}")
            print(f"Response: {response.text[:200]}")
    except Exception as e:
        print(f"Error fetching meetings: {e}")
    
    return None


def scrape_all_meetings(
    meeting_type: str = "previous",
    output_file: str = "council_meetings.json",
    headers: Optional[Dict] = None,
    use_query_param: bool = False
) -> List[Dict]:
    """
    Scrape all meetings from the API.
    
    Note: The API returns all meetings in a single request, so no pagination is needed.
    
    Args:
        meeting_type: Type of meetings to scrape
        output_file: Output JSON file path
        headers: HTTP headers dict
        use_query_param: Whether API key is in query params
    
    Returns:
        List of all meeting records
    """
    print(f"\nFetching all {meeting_type} meetings...")
    print("=" * 50)
    
    meetings = fetch_meetings(
        meeting_type=meeting_type,
        headers=headers,
        use_query_param=use_query_param
    )
    
    if not meetings:
        print("❌ Failed to fetch meetings")
        return []
    
    print(f"✓ Successfully fetched {len(meetings)} meetings")
    
    # Save to file
    print(f"\nSaving to {output_file}...")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(meetings, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Done! Saved {len(meetings)} meetings to {output_file}")
    return meetings


def main():
    """Main function to run the scraper."""
    print("Vancouver City Council Meetings Scraper")
    print("=" * 50)
    
    # Step 1: Test API key format
    working_headers = test_api_key_format()
    use_query_param = working_headers is None
    
    if not working_headers and not use_query_param:
        print("\n❌ Could not find working API key format!")
        print("Please check the Network tab in browser DevTools to see how the API key is sent.")
        return
    
    # Step 2: Test a single request to see response structure
    print("\n" + "=" * 50)
    print("Testing request to inspect response structure...")
    test_data = fetch_meetings(
        meeting_type="previous",
        headers=working_headers,
        use_query_param=use_query_param
    )
    
    if test_data:
        print(f"\n✓ Success! Received {len(test_data)} meetings")
        print("\nSample response structure (first meeting):")
        if len(test_data) > 0:
            print(json.dumps(test_data[0], indent=2))
        print("\n" + "=" * 50)
        
        # Ask user if they want to proceed
        response = input("\nProceed with saving all meetings? (y/n): ")
        if response.lower() == "y":
            scrape_all_meetings(
                meeting_type="previous",
                headers=working_headers,
                use_query_param=use_query_param
            )
    else:
        print("❌ Failed to fetch data. Please check the API endpoint and key.")


if __name__ == "__main__":
    main()
