# Common Spotify Workflows

This guide describes common tasks users might ask Claude to perform with the Spotify MCP server.

## 1. Search Episodes by Topic

**User Request**: "Search my episodes for episodes about AI and machine learning"

**Workflow**:
1. Use `spotify_search_saved_episodes` tool with query "AI machine learning"
2. Return paginated results with episode titles, show names, and summaries
3. Optionally: filter by date, show, or relevance

**Tools Used**:
- `spotify_search_saved_episodes` - Search with query parameter

## 2. Get Recently Saved Episodes

**User Request**: "Show me my 10 most recently saved episodes"

**Workflow**:
1. Use `spotify_get_saved_episodes` with limit=10, offset=0
2. Return sorted by save date (most recent first)
3. Display episode name, show, duration, and save date

**Tools Used**:
- `spotify_get_saved_episodes` - Retrieve with pagination

## 3. Get Episode Metadata

**User Request**: "Get details about episode [episode_id]"

**Workflow**:
1. Use `spotify_get_episode_details` with episode ID
2. Return full metadata: title, description, duration, release date, audio preview URL
3. Display in markdown format for readability

**Tools Used**:
- `spotify_get_episode_details` - Fetch single episode
- `spotify_get_show_details` - Fetch parent show information

## 4. Generate Listening Summary Report

**User Request**: "Create a report of my podcast listening habits"

**Workflow**:
1. Fetch multiple pages of saved episodes using pagination
2. Analyze shows, topics, frequencies
3. Generate markdown report with:
   - Most frequent shows
   - Total episodes saved
   - Topic distribution
   - Average episode duration
4. Format as structured markdown

**Tools Used**:
- `spotify_get_saved_episodes` - Multiple calls with different offsets
- `spotify_get_show_details` - Get show metadata for analysis

## 5. Find Episodes from Specific Show

**User Request**: "Show me all my saved episodes from [show name]"

**Workflow**:
1. Use `spotify_search_saved_episodes` with show name as query
2. Filter results to only include episodes from that show
3. Sort by release date (newest first)
4. Display with summary metadata

**Tools Used**:
- `spotify_search_saved_episodes` - Search by show name

## 6. Export Episodes to Markdown

**User Request**: "Export my saved episodes list to a markdown file"

**Workflow**:
1. Fetch all saved episodes (use pagination to get all)
2. Format as markdown table with columns:
   - Episode Title
   - Show Name
   - Release Date
   - Duration
3. Save to file or display for copy/paste

**Tools Used**:
- `spotify_get_saved_episodes` - Multiple paginated calls
- `spotify_get_show_details` - Get show details if needed

## 7. Find Episode by Keyword

**User Request**: "Find episodes I saved about productivity"

**Workflow**:
1. Use `spotify_search_saved_episodes` with query "productivity"
2. Return all matching episodes
3. If too many results, offer to narrow search or paginate

**Tools Used**:
- `spotify_search_saved_episodes` - Keyword search

## Tool Reference

### spotify_get_saved_episodes
Get paginated list of saved episodes.
- **Parameters**: limit (1-50, default 20), offset (default 0), market (optional)
- **Returns**: Array of episode objects with metadata
- **Use when**: Need to browse or paginate through library

### spotify_search_saved_episodes
Search saved episodes by name/show.
- **Parameters**: query (required), limit (1-50, default 20), response_format (json/markdown)
- **Returns**: Filtered episodes matching query
- **Use when**: Looking for specific episodes or shows

### spotify_get_episode_details
Get full metadata for a single episode.
- **Parameters**: episode_id (required), response_format (json/markdown)
- **Returns**: Complete episode object with description, duration, release date
- **Use when**: Need detailed information about specific episode

### spotify_get_show_details
Get information about a podcast/show.
- **Parameters**: show_id (required), response_format (json/markdown)
- **Returns**: Show metadata including description, total episodes, publisher
- **Use when**: Need information about podcast itself

## Response Formats

All tools support two response formats:

### Markdown Format (default)
Human-readable format with:
- Formatted headings
- Bullet points and tables
- Descriptions and summaries
- Clean presentation

### JSON Format
Structured data format with:
- Complete API responses
- Programmatic access
- Nested objects for relationships
- Type information

## Rate Limiting & Pagination

- Spotify API rate limit: ~180,000 requests per 15 minutes per app
- Use pagination (limit + offset) for large result sets
- Each API call counts toward rate limit
- Server automatically handles token refresh

## Common Patterns

### Pattern: Get all saved episodes
```
1. Call spotify_get_saved_episodes with limit=50, offset=0
2. If results count == 50, call again with offset=50
3. Repeat until results < 50
4. Aggregate all results
```

### Pattern: Search with pagination
```
1. Call spotify_search_saved_episodes with query and limit=50, offset=0
2. Get count of results
3. If more results exist, show pagination options
4. Return first page
```

### Pattern: Analyze episode collection
```
1. Get all episodes using pagination pattern
2. Parse episode metadata (title, show, date, etc)
3. Aggregate statistics (counts, groupings, trends)
4. Present as summary report
```
