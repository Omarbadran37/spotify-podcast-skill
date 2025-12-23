"""
Spotify API Client

Provides a simple interface to the Spotify Web API with automatic
token management and error handling.
"""

import requests
from typing import Dict, Optional, Any
from spotify_auth import SpotifyAuth


class SpotifyClient:
    """
    Spotify API client with automatic token management.

    Handles authenticated requests to the Spotify Web API with
    automatic token refresh and comprehensive error handling.
    """

    BASE_URL = "https://api.spotify.com/v1"

    def __init__(self, auth: SpotifyAuth):
        """
        Initialize Spotify API client.

        Args:
            auth: SpotifyAuth instance for token management
        """
        self.auth = auth

    def _request(self, method: str, endpoint: str, params: Optional[Dict] = None) -> Any:
        """
        Make an authenticated request to the Spotify API.

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint (e.g., '/me/episodes')
            params: Query parameters

        Returns:
            Response JSON data

        Raises:
            Exception: On API errors with descriptive messages
        """
        # Get fresh token (auto-refreshes if needed)
        token = self.auth.get_access_token()

        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

        url = f"{self.BASE_URL}{endpoint}"

        try:
            response = requests.request(
                method,
                url,
                headers=headers,
                params=params,
                timeout=10
            )

            # Handle HTTP errors
            if response.status_code == 401:
                raise Exception(
                    "Unauthorized: Invalid or expired Spotify access token. "
                    "Run 'python authenticate.py' to re-authenticate."
                )
            elif response.status_code == 403:
                raise Exception(
                    "Forbidden: Insufficient permissions. "
                    "Run 'python authenticate.py' to authenticate with correct scopes."
                )
            elif response.status_code == 404:
                error_msg = response.json().get('error', {}).get('message', 'Resource not found')
                raise Exception(f"Not found: {error_msg}")
            elif response.status_code == 429:
                raise Exception("Rate limited: Too many requests. Please wait before retrying.")
            elif response.status_code >= 500:
                raise Exception("Spotify API error: Server error. Please try again later.")

            response.raise_for_status()
            return response.json()

        except requests.exceptions.Timeout:
            raise Exception("Request timeout: Spotify API took too long to respond")
        except requests.exceptions.RequestException as e:
            if hasattr(e, 'response') and e.response is not None:
                error_data = e.response.json() if e.response.content else {}
                error_msg = error_data.get('error', {}).get('message', str(e))
                raise Exception(f"Spotify API error: {error_msg}")
            raise Exception(f"Request failed: {e}")

    def get_saved_episodes(
        self,
        limit: int = 20,
        offset: int = 0,
        market: Optional[str] = None
    ) -> Dict:
        """
        Get user's saved episodes.

        Args:
            limit: Maximum number of episodes to return (1-50)
            offset: Index of the first episode to return
            market: ISO 3166-1 alpha-2 country code (e.g., 'US')

        Returns:
            Paginated response with saved episodes

        API Endpoint: GET /me/episodes
        Required Scope: user-library-read
        """
        params = {
            'limit': limit,
            'offset': offset
        }

        if market:
            params['market'] = market

        return self._request('GET', '/me/episodes', params)

    def get_episode_details(
        self,
        episode_id: str,
        market: Optional[str] = None
    ) -> Dict:
        """
        Get detailed information about an episode.

        Args:
            episode_id: The Spotify ID for the episode
            market: ISO 3166-1 alpha-2 country code (e.g., 'US')

        Returns:
            Episode object with full metadata

        API Endpoint: GET /episodes/{id}
        """
        params = {}
        if market:
            params['market'] = market

        return self._request('GET', f'/episodes/{episode_id}', params if params else None)

    def get_show_details(self, show_id: str) -> Dict:
        """
        Get detailed information about a show/podcast.

        Args:
            show_id: The Spotify ID for the show

        Returns:
            Show object with full metadata

        API Endpoint: GET /shows/{id}
        """
        return self._request('GET', f'/shows/{show_id}')

    def search(
        self,
        query: str,
        types: str,
        limit: int = 20,
        offset: int = 0,
        market: Optional[str] = None
    ) -> Dict:
        """
        Search for items in the Spotify catalog.

        Args:
            query: Search query keywords
            types: Comma-separated list of item types (e.g., 'episode,show')
            limit: Maximum number of results (1-50)
            offset: Index of first result
            market: ISO 3166-1 alpha-2 country code (e.g., 'US')

        Returns:
            Search results

        API Endpoint: GET /search
        """
        params = {
            'q': query,
            'type': types,
            'limit': limit,
            'offset': offset
        }

        if market:
            params['market'] = market

        return self._request('GET', '/search', params)
