# Spotify API Reference

Reference documentation for Spotify Web API endpoints used by the Podcast Manager skill.

## Base URL

```
https://api.spotify.com/v1
```

## Authentication

All requests require Bearer token authentication:

```
Authorization: Bearer <access_token>
```

Tokens automatically injected by `SpotifyClient` class.

## Endpoints

### GET /me/episodes

Get user's saved podcast episodes.

**Endpoint**: `GET /me/episodes`
**Required Scope**: `user-library-read`

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 20 | Max items to return (1-50) |
| `offset` | integer | No | 0 | Index of first item to return |
| `market` | string | No | - | ISO 3166-1 alpha-2 country code |

#### Response

```json
{
  "href": "https://api.spotify.com/v1/me/episodes?offset=0&limit=20",
  "items": [
    {
      "added_at": "2025-12-23T13:35:01Z",
      "episode": {
        "id": "4XpIsPN9IsJLrf5XvebXJr",
        "name": "Episode Title",
        "description": "Episode description...",
        "duration_ms": 5438256,
        "release_date": "2025-12-23",
        "show": {
          "id": "0wjYlCNxLDgFUUjZMaP6Dx",
          "name": "Show Name",
          "publisher": "Publisher Name"
        },
        "uri": "spotify:episode:...",
        "external_urls": {
          "spotify": "https://open.spotify.com/episode/..."
        }
      }
    }
  ],
  "limit": 20,
  "next": "https://api.spotify.com/v1/me/episodes?offset=20&limit=20",
  "offset": 0,
  "previous": null,
  "total": 2135
}
```

#### Example Usage

```python
# Python
client.get_saved_episodes(limit=20, offset=0, market='US')
```

```bash
# CLI
python get_saved_episodes.py --limit 20 --offset 0 --market US
```

---

### GET /episodes/{id}

Get detailed information about a specific episode.

**Endpoint**: `GET /episodes/{id}`
**Required Scope**: None (public data)

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Spotify episode ID |
| `market` | string | No | ISO 3166-1 alpha-2 country code |

#### Response

```json
{
  "id": "4XpIsPN9IsJLrf5XvebXJr",
  "name": "Episode Title",
  "description": "Full episode description...",
  "html_description": "<p>Full episode description with HTML...</p>",
  "duration_ms": 5438256,
  "language": "en",
  "release_date": "2025-12-23",
  "release_date_precision": "day",
  "explicit": false,
  "type": "episode",
  "uri": "spotify:episode:4XpIsPN9IsJLrf5XvebXJr",
  "external_urls": {
    "spotify": "https://open.spotify.com/episode/4XpIsPN9IsJLrf5XvebXJr"
  },
  "show": {
    "id": "0wjYlCNxLDgFUUjZMaP6Dx",
    "name": "Show Name",
    "publisher": "Publisher Name",
    "description": "Show description...",
    "total_episodes": 150
  },
  "audio_preview_url": "https://p.scdn.co/mp3-preview/...",
  "images": [
    {
      "url": "https://i.scdn.co/image/...",
      "width": 640,
      "height": 640
    }
  ]
}
```

#### Example Usage

```python
# Python
client.get_episode_details(episode_id='4XpIsPN9IsJLrf5XvebXJr', market='US')
```

```bash
# CLI
python get_episode_details.py --episode-id 4XpIsPN9IsJLrf5XvebXJr
```

---

### GET /shows/{id}

Get detailed information about a show/podcast.

**Endpoint**: `GET /shows/{id}`
**Required Scope**: None (public data)

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Spotify show ID |
| `market` | string | No | ISO 3166-1 alpha-2 country code |

#### Response

```json
{
  "id": "0wjYlCNxLDgFUUjZMaP6Dx",
  "name": "Show Name",
  "description": "Show description...",
  "publisher": "Publisher Name",
  "languages": ["en"],
  "explicit": false,
  "media_type": "audio",
  "total_episodes": 150,
  "uri": "spotify:show:0wjYlCNxLDgFUUjZMaP6Dx",
  "external_urls": {
    "spotify": "https://open.spotify.com/show/0wjYlCNxLDgFUUjZMaP6Dx"
  },
  "images": [
    {
      "url": "https://i.scdn.co/image/...",
      "width": 640,
      "height": 640
    }
  ]
}
```

#### Example Usage

```python
# Python
client.get_show_details(show_id='0wjYlCNxLDgFUUjZMaP6Dx')
```

```bash
# CLI
python get_show_details.py --show-id 0wjYlCNxLDgFUUjZMaP6Dx
```

---

### GET /search

Search Spotify catalog (not used in current scripts but available).

**Endpoint**: `GET /search`

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query |
| `type` | string | Yes | Comma-separated types: episode, show |
| `limit` | integer | No | Max results (1-50, default 20) |
| `offset` | integer | No | Pagination offset (default 0) |
| `market` | string | No | ISO 3166-1 alpha-2 country code |

#### Example Usage

```python
client.search(query='AI podcast', types='episode,show', limit=20)
```

---

## Common Response Fields

### Episode Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Spotify episode ID |
| `name` | string | Episode title |
| `description` | string | Plain text description |
| `html_description` | string | HTML formatted description |
| `duration_ms` | integer | Duration in milliseconds |
| `language` | string | ISO 639 language code |
| `release_date` | string | Release date (YYYY-MM-DD) |
| `explicit` | boolean | Contains explicit content |
| `uri` | string | Spotify URI |
| `external_urls` | object | External URLs (e.g., Spotify web link) |
| `show` | object | Parent show object |

### Show Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Spotify show ID |
| `name` | string | Show/podcast name |
| `description` | string | Show description |
| `publisher` | string | Publisher/creator name |
| `languages` | array | ISO 639 language codes |
| `explicit` | boolean | Contains explicit content |
| `media_type` | string | Usually "audio" |
| `total_episodes` | integer | Total number of episodes |
| `uri` | string | Spotify URI |
| `external_urls` | object | External URLs |

## Pagination

All list endpoints support pagination:

### Parameters

- `limit`: Items per page (1-50)
- `offset`: Starting position (0-indexed)

### Response Fields

- `items`: Array of results
- `total`: Total number of items
- `limit`: Requested limit
- `offset`: Current offset
- `next`: URL for next page (null if last page)
- `previous`: URL for previous page (null if first page)

### Pagination Pattern

```python
all_items = []
offset = 0
limit = 50

while True:
    response = client.get_saved_episodes(limit=limit, offset=offset)
    all_items.extend(response['items'])

    if response['next'] is None:
        break

    offset += limit
```

## Rate Limits

**Global Rate Limit**: ~180,000 requests per 15 minutes per app

**Per-User Rate Limit**: Varies, typically generous

**Rate Limit Headers**:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `Retry-After`: Seconds to wait before retry

**429 Response**: Too Many Requests
- Wait and retry
- Use exponential backoff

## Error Responses

### 400 Bad Request

Invalid request parameters.

```json
{
  "error": {
    "status": 400,
    "message": "invalid id"
  }
}
```

### 401 Unauthorized

Invalid or expired access token.

```json
{
  "error": {
    "status": 401,
    "message": "The access token expired"
  }
}
```

**Solution**: Refresh token (automatic in scripts)

### 403 Forbidden

Insufficient permissions/scopes.

```json
{
  "error": {
    "status": 403,
    "message": "Insufficient client scope"
  }
}
```

**Solution**: Re-authenticate with correct scopes

### 404 Not Found

Resource doesn't exist.

```json
{
  "error": {
    "status": 404,
    "message": "Non existing id"
  }
}
```

### 429 Too Many Requests

Rate limit exceeded.

```json
{
  "error": {
    "status": 429,
    "message": "API rate limit exceeded"
  }
}
```

**Solution**: Wait and retry

### 500+ Server Errors

Spotify server error.

**Solution**: Retry with exponential backoff

## Market Codes

ISO 3166-1 alpha-2 country codes:

| Code | Country |
|------|---------|
| US | United States |
| GB | United Kingdom |
| CA | Canada |
| AU | Australia |
| DE | Germany |
| FR | France |
| ES | Spain |
| IT | Italy |
| BR | Brazil |
| MX | Mexico |
| JP | Japan |

Full list: https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2

## Best Practices

### 1. Use Pagination

For large datasets:
- Use `limit=50` (maximum)
- Fetch in batches
- Stop when `next` is null

### 2. Handle Errors

Always catch and handle:
- 401: Refresh token
- 403: Re-authenticate
- 404: Resource not found
- 429: Rate limit (wait and retry)

### 3. Cache When Appropriate

Episode/show details rarely change:
- Cache for 1-24 hours
- Reduces API calls
- Improves performance

### 4. Respect Rate Limits

- Don't hammer the API
- Use pagination efficiently
- Implement backoff on errors

### 5. Market Parameter

Use when:
- Content availability varies by region
- User in specific country
- Licensing restrictions apply

## Client Implementation

The `SpotifyClient` class handles:

- ✅ Authorization header injection
- ✅ Base URL prepending
- ✅ Error handling & messages
- ✅ Automatic token refresh
- ✅ Request timeout (10s)

```python
from spotify_client import SpotifyClient
from spotify_auth import SpotifyAuth

auth = SpotifyAuth(client_id, client_secret)
client = SpotifyClient(auth)

# All requests automatically authenticated
episodes = client.get_saved_episodes(limit=20)
```

## Additional Resources

- [Spotify Web API Reference](https://developer.spotify.com/documentation/web-api/reference/)
- [Spotify Console](https://developer.spotify.com/console/) - Test endpoints
- [Rate Limits](https://developer.spotify.com/documentation/web-api/concepts/rate-limits)
- [Authorization Guide](https://developer.spotify.com/documentation/web-api/concepts/authorization)
