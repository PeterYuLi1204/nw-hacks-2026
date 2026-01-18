#!/usr/bin/env python3
"""
Orchestration script to extract text from all council meeting PDFs in parallel.
"""

import json
import os
import time
from datetime import datetime
from multiprocessing import Pool, cpu_count
from typing import Dict, List, Tuple, Optional
from extract_meeting_text import extract_meeting_text
from scrape_council_meetings import scrape_all_meetings, test_api_key_format


def process_meeting_wrapper(args: Tuple[Dict, str]) -> Dict:
    """
    Wrapper function for multiprocessing.
    
    Args:
        args: Tuple of (meeting dict, output_dir)
    
    Returns:
        Dict with meeting info and extraction result
    """
    meeting, output_dir = args
    success, message, text_filename = extract_meeting_text(meeting, output_dir)
    
    return {
        "meeting": meeting,
        "success": success,
        "message": message,
        "text_filename": text_filename
    }


def filter_meetings_by_date(
    meetings: List[Dict],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> List[Dict]:
    """
    Filter meetings by date range.
    
    Args:
        meetings: List of meeting records
        start_date: Start date in YYYY-MM-DD format (inclusive)
        end_date: End date in YYYY-MM-DD format (inclusive)
    
    Returns:
        Filtered list of meetings
    """
    if not start_date and not end_date:
        return meetings
    
    filtered = []
    for meeting in meetings:
        event_date_str = meeting.get("eventDate", "")
        if not event_date_str:
            continue
        
        try:
            # Parse ISO format date (e.g., "2026-01-15T18:00:00")
            event_date = datetime.fromisoformat(event_date_str.replace('Z', '+00:00'))
            event_date_only = event_date.date()
            
            # Check start date
            if start_date:
                start = datetime.strptime(start_date, "%Y-%m-%d").date()
                if event_date_only < start:
                    continue
            
            # Check end date
            if end_date:
                end = datetime.strptime(end_date, "%Y-%m-%d").date()
                if event_date_only > end:
                    continue
            
            filtered.append(meeting)
        except (ValueError, AttributeError):
            # Skip meetings with invalid dates
            continue
    
    return filtered


def orchestrate_extraction(
    input_json: str = "council_meetings.json",
    output_json: str = "council_meetings_with_text.json",
    failed_json: str = "failed_meetings.json",
    output_dir: str = "previous_meetings_extracted",
    num_workers: int = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Orchestrate parallel extraction of all meeting PDFs.
    Always runs scraper first to fetch latest meeting data.
    
    Args:
        input_json: Input JSON file with meeting records
        output_json: Output JSON file with text_filename field added
        failed_json: Output JSON file with failed extractions
        output_dir: Directory to save extracted text files
        num_workers: Number of parallel workers (default: CPU count)
        start_date: Start date filter in YYYY-MM-DD format (inclusive)
        end_date: End date filter in YYYY-MM-DD format (inclusive)
    """
    print("=" * 70)
    print("Council Meeting Minutes Extraction Orchestrator")
    print("=" * 70)
    
    # Step 0: Always run scraper to fetch meetings
    print(f"\n[0/7] Running scraper to fetch meetings...")
    print("-" * 70)
    
    # Test API key format
    working_headers = test_api_key_format()
    use_query_param = working_headers is None
    
    if not working_headers and not use_query_param:
        print("\n❌ Could not find working API key format!")
        return
    
    # Scrape meetings
    meetings = scrape_all_meetings(
        meeting_type="previous",
        output_file=input_json,
        headers=working_headers,
        use_query_param=use_query_param
    )
    
    if not meetings:
        print("❌ Failed to scrape meetings")
        return
    
    print("-" * 70)
    print(f"✓ Scraper complete. Proceeding with extraction...")
    
    # Step 1: Load input JSON
    print(f"\n[1/7] Loading meetings from {input_json}...")
    try:
        with open(input_json, 'r', encoding='utf-8') as f:
            meetings = json.load(f)
        print(f"✓ Loaded {len(meetings)} meetings")
    except FileNotFoundError:
        print(f"❌ Error: File '{input_json}' not found")
        print("Run with --scrape flag to fetch meetings first, or run scrape_council_meetings.py")
        return
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON in '{input_json}' - {e}")
        return
    
    # Filter by date if specified
    if start_date or end_date:
        print(f"\n[1.5/7] Filtering meetings by date range...")
        if start_date:
            print(f"  Start date: {start_date}")
        if end_date:
            print(f"  End date: {end_date}")
        
        original_count = len(meetings)
        meetings = filter_meetings_by_date(meetings, start_date, end_date)
        print(f"✓ Filtered to {len(meetings)} meetings (from {original_count})")
    
    # Step 2: Create output directory
    print(f"\n[2/7] Creating output directory '{output_dir}'...")
    os.makedirs(output_dir, exist_ok=True)
    print("✓ Directory ready")
    
    # Step 3: Set up parallel processing
    if num_workers is None:
        num_workers = cpu_count()
    print(f"\n[3/7] Setting up parallel processing with {num_workers} workers...")
    print("✓ Workers ready")
    
    # Step 4: Process all meetings in parallel
    print(f"\n[4/7] Processing {len(meetings)} meetings in parallel...")
    print("This may take a while. Progress will be shown periodically.")
    print("-" * 70)
    
    start_time = time.time()
    
    # Prepare arguments for multiprocessing
    args_list = [(meeting, output_dir) for meeting in meetings]
    
    # Process with progress updates
    results = []
    with Pool(processes=num_workers) as pool:
        # Use imap_unordered for better progress tracking
        for i, result in enumerate(pool.imap_unordered(process_meeting_wrapper, args_list), 1):
            results.append(result)
            
            # Print progress every 50 meetings
            if i % 50 == 0 or i == len(meetings):
                elapsed = time.time() - start_time
                rate = i / elapsed if elapsed > 0 else 0
                eta = (len(meetings) - i) / rate if rate > 0 else 0
                
                success_count = sum(1 for r in results if r["success"])
                fail_count = i - success_count
                
                print(f"Progress: {i}/{len(meetings)} ({i*100//len(meetings)}%) | "
                      f"Success: {success_count} | Failed: {fail_count} | "
                      f"Rate: {rate:.1f}/s | ETA: {eta/60:.1f}m")
    
    elapsed_time = time.time() - start_time
    print("-" * 70)
    print(f"✓ Processing complete in {elapsed_time/60:.1f} minutes")
    
    # Step 5: Separate successful and failed extractions
    print(f"\n[5/7] Analyzing results...")
    successful_meetings = []
    failed_meetings = []
    
    for result in results:
        meeting = result["meeting"].copy()
        
        if result["success"]:
            meeting["text_filename"] = result["text_filename"]
            successful_meetings.append(meeting)
        else:
            meeting["error_message"] = result["message"]
            failed_meetings.append(meeting)
    
    print(f"✓ Successful extractions: {len(successful_meetings)}")
    print(f"✓ Failed extractions: {len(failed_meetings)}")
    
    # Step 6: Save output files
    print(f"\n[6/7] Saving output files...")
    
    # Save successful meetings with text_filename
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(successful_meetings, f, indent=2, ensure_ascii=False)
    print(f"✓ Saved {len(successful_meetings)} successful meetings to {output_json}")
    
    # Save failed meetings
    if failed_meetings:
        with open(failed_json, 'w', encoding='utf-8') as f:
            json.dump(failed_meetings, f, indent=2, ensure_ascii=False)
        print(f"✓ Saved {len(failed_meetings)} failed meetings to {failed_json}")
    else:
        print("✓ No failed meetings to save")
    
    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Total meetings processed: {len(meetings)}")
    print(f"Successful extractions: {len(successful_meetings)} ({len(successful_meetings)*100//len(meetings)}%)")
    print(f"Failed extractions: {len(failed_meetings)} ({len(failed_meetings)*100//len(meetings)}%)")
    print(f"Text files saved in: {output_dir}/")
    print(f"Output JSON: {output_json}")
    if failed_meetings:
        print(f"Failed meetings log: {failed_json}")
    print("=" * 70)


def main():
    """Main function."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Scrape and extract text from all council meeting PDFs in parallel",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run complete pipeline (scrape + extract all meetings)
  python orchestrate_extraction.py

  # Extract only meetings from 2025
  python orchestrate_extraction.py --start-date 2025-01-01 --end-date 2025-12-31

  # Extract recent meetings (last 6 months)
  python orchestrate_extraction.py --start-date 2025-07-01

  # Extract with custom output directory
  python orchestrate_extraction.py --output-dir my_meetings --workers 4
        """
    )
    parser.add_argument(
        "--input",
        default="council_meetings.json",
        help="Input JSON file with meeting records (default: council_meetings.json)"
    )
    parser.add_argument(
        "--output",
        default="council_meetings_with_text.json",
        help="Output JSON file with text_filename field (default: council_meetings_with_text.json)"
    )
    parser.add_argument(
        "--failed",
        default="failed_meetings.json",
        help="Output JSON file for failed extractions (default: failed_meetings.json)"
    )
    parser.add_argument(
        "--output-dir",
        default="previous_meetings_extracted",
        help="Directory to save extracted text files (default: previous_meetings_extracted)"
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=None,
        help="Number of parallel workers (default: CPU count)"
    )
    parser.add_argument(
        "--start-date",
        type=str,
        default=None,
        help="Start date filter in YYYY-MM-DD format (inclusive)"
    )
    parser.add_argument(
        "--end-date",
        type=str,
        default=None,
        help="End date filter in YYYY-MM-DD format (inclusive)"
    )
    
    args = parser.parse_args()
    
    # Validate date formats if provided
    if args.start_date:
        try:
            datetime.strptime(args.start_date, "%Y-%m-%d")
        except ValueError:
            print(f"Error: Invalid start date format '{args.start_date}'. Use YYYY-MM-DD")
            return
    
    if args.end_date:
        try:
            datetime.strptime(args.end_date, "%Y-%m-%d")
        except ValueError:
            print(f"Error: Invalid end date format '{args.end_date}'. Use YYYY-MM-DD")
            return
    
    orchestrate_extraction(
        input_json=args.input,
        output_json=args.output,
        failed_json=args.failed,
        output_dir=args.output_dir,
        num_workers=args.workers,
        start_date=args.start_date,
        end_date=args.end_date
    )


if __name__ == "__main__":
    main()
