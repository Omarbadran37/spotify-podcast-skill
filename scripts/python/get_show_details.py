#!/usr/bin/env python3
"""
Get Show Details

Retrieve detailed metadata for a specific Spotify show/podcast.

Usage:
    python get_show_details.py --show-id <ID> [--json]

Examples:
    python get_show_details.py --show-id 4rOoJ6Egrf8K2IrywzwOMk
    python get_show_details.py --show-id 4rOoJ6Egrf8K2IrywzwOMk --json

Environment Variables:
    SPOTIFY_CLIENT_ID       - Your Spotify app client ID
    SPOTIFY_CLIENT_SECRET   - Your Spotify app client secret
"""

import os
import sys
import json
import argparse
from spotify_auth import SpotifyAuth
from spotify_client import SpotifyClient


def get_credentials():
    """Get Spotify credentials from environment variables."""
    client_id = os.getenv('SPOTIFY_CLIENT_ID')
    client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')

    if not client_id or not client_secret:
        print("Error: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set", file=sys.stderr)
        sys.exit(1)

    return client_id, client_secret


def format_markdown(show: dict) -> str:
    """Format show details as markdown."""
    lines = [f"# {show['name']}\n"]

    lines.append(f"**Publisher**: {show['publisher']}")
    lines.append(f"**Total Episodes**: {show.get('total_episodes', 'N/A')}")
    lines.append(f"**Language**: {show.get('languages', ['N/A'])[0] if show.get('languages') else 'N/A'}")
    lines.append(f"**Explicit**: {'Yes' if show.get('explicit') else 'No'}")
    lines.append(f"**Media Type**: {show.get('media_type', 'audio')}")
    lines.append("")

    # Description
    if show.get('description'):
        lines.append("## Description\n")
        lines.append(show['description'])
        lines.append("")

    # Links
    lines.append("## Links\n")
    if show.get('external_urls', {}).get('spotify'):
        lines.append(f"Spotify: {show['external_urls']['spotify']}")
    lines.append(f"URI: {show['uri']}")
    lines.append(f"ID: {show['id']}")

    return "\n".join(lines)


def format_json_output(show: dict) -> dict:
    """Format show details for JSON output."""
    return {
        'id': show['id'],
        'name': show['name'],
        'publisher': show['publisher'],
        'total_episodes': show.get('total_episodes'),
        'languages': show.get('languages', []),
        'explicit': show.get('explicit', False),
        'media_type': show.get('media_type', 'audio'),
        'description': show.get('description', ''),
        'html_description': show.get('html_description', ''),
        'uri': show['uri'],
        'external_urls': show.get('external_urls', {})
    }


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Get detailed metadata for a Spotify show/podcast'
    )
    parser.add_argument(
        '--show-id',
        type=str,
        required=True,
        help='Spotify show ID'
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='Output JSON instead of markdown'
    )

    args = parser.parse_args()

    try:
        # Get credentials and initialize
        client_id, client_secret = get_credentials()
        auth = SpotifyAuth(client_id, client_secret)
        client = SpotifyClient(auth)

        # Fetch show details
        show = client.get_show_details(show_id=args.show_id)

        # Output
        if args.json:
            output = format_json_output(show)
            print(json.dumps(output, indent=2))
        else:
            output = format_markdown(show)
            print(output)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
