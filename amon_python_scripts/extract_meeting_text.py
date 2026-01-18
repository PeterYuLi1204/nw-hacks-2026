#!/usr/bin/env python3
"""
Script to extract text from a single council meeting's PDF minutes.
"""

import os
import sys
import json
import requests
import tempfile
import pdfplumber
from bs4 import BeautifulSoup
from typing import Dict, Optional, Tuple, Union


def load_meeting_by_id_or_url(identifier: Union[int, str], json_file: str = "council_meetings.json") -> Optional[Dict]:
    """
    Load a meeting record by ID or URL from the JSON file.
    
    Args:
        identifier: Meeting ID (int) or meeting URL (str)
        json_file: Path to the JSON file with meeting records
    
    Returns:
        Meeting dict or None if not found
    """
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            meetings = json.load(f)
        
        # Search by ID
        if isinstance(identifier, int):
            for meeting in meetings:
                if meeting.get("id") == identifier:
                    return meeting
        
        # Search by URL
        elif isinstance(identifier, str):
            for meeting in meetings:
                if meeting.get("meetingUrl") == identifier:
                    return meeting
        
        return None
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def extract_meeting_text(meeting: Dict, output_dir: str = "previous_meetings_extracted") -> Tuple[bool, str, Optional[str]]:
    """
    Extract text from a single meeting's PDF minutes.
    
    Args:
        meeting: Meeting record dict with id, meetingUrl, etc.
        output_dir: Directory to save extracted text files
    
    Returns:
        Tuple of (success: bool, message: str, text_filename: Optional[str])
    """
    meeting_id = meeting.get("id")
    meeting_url = meeting.get("meetingUrl", "")
    
    # Validate inputs
    if meeting_id is None:
        return False, "Missing meeting ID", None
    
    if not meeting_url:
        return False, f"Meeting {meeting_id}: Empty or missing meetingUrl", None
    
    try:
        # Step 1: Fetch the meeting page HTML
        response = requests.get(meeting_url, timeout=30)
        
        if response.status_code == 404:
            return False, f"Meeting {meeting_id}: Page not found (404)", None
        
        if response.status_code != 200:
            return False, f"Meeting {meeting_id}: HTTP {response.status_code}", None
        
        # Step 2: Parse HTML and find "read the minutes" link
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find link with text "read the minutes" (case-insensitive)
        minutes_link = None
        for link in soup.find_all('a', href=True):
            link_text = link.get_text(strip=True).lower()
            if "read the minutes" in link_text:
                minutes_link = link['href']
                break
        
        if not minutes_link:
            return False, f"Meeting {meeting_id}: No 'read the minutes' link found", None
        
        # Step 3: Construct full PDF URL
        if minutes_link.startswith('http'):
            pdf_url = minutes_link
        elif minutes_link.startswith('/'):
            pdf_url = f"https://council.vancouver.ca{minutes_link}"
        else:
            # Relative URL - construct from meeting URL base
            base_url = meeting_url.rsplit('/', 1)[0]
            pdf_url = f"{base_url}/{minutes_link}"
        
        # Step 4: Download PDF
        pdf_response = requests.get(pdf_url, timeout=60)
        
        if pdf_response.status_code != 200:
            return False, f"Meeting {meeting_id}: PDF download failed (HTTP {pdf_response.status_code})", None
        
        # Step 5: Extract text from PDF using pdfplumber
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_pdf:
            tmp_pdf.write(pdf_response.content)
            tmp_pdf_path = tmp_pdf.name
        
        try:
            extracted_text = []
            with pdfplumber.open(tmp_pdf_path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        extracted_text.append(text)
            
            if not extracted_text:
                return False, f"Meeting {meeting_id}: No text extracted from PDF", None
            
            full_text = "\n\n".join(extracted_text)
            
            # Step 6: Save to text file
            os.makedirs(output_dir, exist_ok=True)
            text_filename = os.path.join(output_dir, f"{meeting_id}.txt")
            
            with open(text_filename, 'w', encoding='utf-8') as f:
                f.write(full_text)
            
            return True, f"Meeting {meeting_id}: Successfully extracted {len(extracted_text)} pages", text_filename
            
        finally:
            # Clean up temp PDF file
            if os.path.exists(tmp_pdf_path):
                os.unlink(tmp_pdf_path)
    
    except requests.exceptions.Timeout:
        return False, f"Meeting {meeting_id}: Request timeout", None
    except requests.exceptions.RequestException as e:
        return False, f"Meeting {meeting_id}: Request error - {str(e)}", None
    except Exception as e:
        return False, f"Meeting {meeting_id}: Unexpected error - {str(e)}", None


def main():
    """Main function for standalone execution."""
    if len(sys.argv) < 2:
        print("Usage: python extract_meeting_text.py <id_or_url>")
        print("Examples:")
        print("  python extract_meeting_text.py 0")
        print("  python extract_meeting_text.py https://council.vancouver.ca/20260115/phea20260115ag.htm")
        sys.exit(1)
    
    identifier = sys.argv[1]
    
    # Try to parse as integer ID first
    try:
        identifier = int(identifier)
    except ValueError:
        # Keep as string (URL)
        pass
    
    # Load meeting from JSON
    meeting = load_meeting_by_id_or_url(identifier)
    
    if not meeting:
        print(f"Error: Meeting not found with identifier '{identifier}'")
        print("Make sure council_meetings.json exists and contains the meeting.")
        sys.exit(1)
    
    print(f"Found meeting: ID={meeting['id']}, Type={meeting['meetingType']}")
    
    # Extract text
    success, message, text_filename = extract_meeting_text(meeting)
    
    # Print result
    print(message)
    if success:
        print(f"Saved to: {text_filename}")
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
