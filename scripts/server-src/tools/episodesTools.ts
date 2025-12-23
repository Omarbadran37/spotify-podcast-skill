import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  GetSavedEpisodesInputSchema,
  SearchSavedEpisodesInputSchema,
  GetEpisodeDetailInputSchema,
  GetShowDetailsInputSchema,
  SearchCatalogInputSchema,
  ResponseFormat,
} from "../schemas.js";
import { SpotifyClient } from "../services/spotifyClient.js";
import type {
  EpisodeInfo,
  SavedEpisodeObject,
} from "../types.js";

export function registerEpisodeTools(
  server: McpServer,
  spotifyClient: SpotifyClient
): void {
  // Get User's Saved Episodes
  server.tool(
    "spotify_get_saved_episodes",
    `Retrieve a paginated list of episodes saved in the current user's library.

Args:
  - limit (number): Maximum episodes to return, 1-50 (default: 20)
  - offset (number): Index of first episode for pagination (default: 0)
  - market (string): ISO 3166-1 alpha-2 country code (optional)
  - response_format ('json' | 'markdown'): Output format (default: 'markdown')

Returns: Paginated episodes with metadata including titles, show names, release dates.

Error Handling:
  - Returns "Unauthorized" error if token lacks 'user-library-read' scope`,
    GetSavedEpisodesInputSchema.shape,
    async (params) => {
      const limit = (params.limit as number | undefined) ?? 20;
      const offset = (params.offset as number | undefined) ?? 0;
      const market = params.market as string | undefined;
      const responseFormat = (params.response_format as string | undefined) ?? ResponseFormat.MARKDOWN;

      const response = await spotifyClient.getSavedEpisodes(limit, offset, market);

      if (responseFormat === ResponseFormat.JSON) {
        const episodes = formatEpisodesForJson(response.items);
        const output = {
          total: response.total,
          count: response.items.length,
          offset: response.offset,
          limit: response.limit,
          episodes,
          has_more: response.next !== null,
          next_offset: response.next ? response.offset + response.items.length : null,
        };

        return {
          content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
        };
      }

      const markdown = formatEpisodesForMarkdown(
        response.items,
        response.offset,
        response.total,
        response.next !== null
      );

      return {
        content: [{ type: "text" as const, text: markdown }],
      };
    }
  );

  // Search Saved Episodes
  server.tool(
    "spotify_search_saved_episodes",
    `Search through the user's saved episodes by episode name or show name.

Args:
  - query (string): Search term to match against episode or show names
  - limit (number): Maximum results to return, 1-50 (default: 20)
  - response_format ('json' | 'markdown'): Output format (default: 'markdown')

Returns: Array of matching episodes with metadata.

Error Handling:
  - Returns empty results if no matches found`,
    SearchSavedEpisodesInputSchema.shape,
    async (params) => {
      const query = params.query as string;
      const limit = (params.limit as number | undefined) ?? 20;
      const responseFormat = (params.response_format as string | undefined) ?? ResponseFormat.MARKDOWN;

      // Fetch all episodes (with pagination if needed)
      let allEpisodes: SavedEpisodeObject[] = [];
      let fetchOffset = 0;
      let hasMore = true;

      while (hasMore && allEpisodes.length < 500) {
        const response = await spotifyClient.getSavedEpisodes(50, fetchOffset);
        allEpisodes = allEpisodes.concat(response.items);
        hasMore = response.next !== null;
        fetchOffset += 50;
      }

      // Filter by search query
      const queryLower = query.toLowerCase();
      const filtered = allEpisodes.filter((item) => {
        const episodeName = item.episode.name?.toLowerCase() || "";
        const showName = item.episode.show.name?.toLowerCase() || "";
        return episodeName.includes(queryLower) || showName.includes(queryLower);
      });

      const results = filtered.slice(0, limit);

      if (responseFormat === ResponseFormat.JSON) {
        const episodes = formatEpisodesForJson(results);
        const output = {
          query,
          total_found: filtered.length,
          returned: results.length,
          episodes,
        };

        return {
          content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
        };
      }

      if (results.length === 0) {
        return {
          content: [{ type: "text" as const, text: `# Search Results\n\nNo episodes found matching "${query}"` }],
        };
      }

      const markdown = `# Search Results for "${query}"\n\nFound ${filtered.length} episode(s), showing ${results.length}:\n\n${results
        .map(
          (item, i) =>
            `${i + 1}. **${item.episode.name || "Unknown"}**\n` +
            `   Show: ${item.episode.show.name}\n` +
            `   Released: ${formatDate(item.episode.release_date)}\n` +
            `   Added: ${formatDate(item.added_at)}\n` +
            `   Duration: ${formatDuration(item.episode.duration_ms)}`
        )
        .join("\n\n")}`;

      return {
        content: [{ type: "text" as const, text: markdown }],
      };
    }
  );

  // Get Episode Details
  server.tool(
    "spotify_get_episode_details",
    `Fetch detailed information about a specific episode.

Args:
  - episode_id (string): Spotify episode ID to fetch details for
  - response_format ('json' | 'markdown'): Output format (default: 'markdown')

Returns: Complete episode metadata including description, duration, language.

Error Handling:
  - Returns "Not found" error if episode ID doesn't exist`,
    GetEpisodeDetailInputSchema.shape,
    async (params) => {
      const episodeId = params.episode_id as string;
      const responseFormat = (params.response_format as string | undefined) ?? ResponseFormat.MARKDOWN;

      const episode = await spotifyClient.getEpisodeDetail(episodeId);

      if (responseFormat === ResponseFormat.JSON) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify(episode, null, 2) }],
        };
      }

      const markdown = `# ${episode.name || "Unknown Episode"}

**Show:** ${episode.show.name}

**Released:** ${formatDate(episode.release_date)}

**Duration:** ${formatDuration(episode.duration_ms)}

**Language:** ${episode.language || "Unknown"}

**Playable:** ${episode.is_playable ? "Yes" : "No"}

**Explicit:** ${episode.explicit ? "Yes" : "No"}

## Description

${episode.description || "No description available"}

**External Link:** [Open in Spotify](${episode.external_urls.spotify})`;

      return {
        content: [{ type: "text" as const, text: markdown }],
      };
    }
  );

  // Get Show Details
  server.tool(
    "spotify_get_show_details",
    `Fetch detailed information about a specific show/podcast.

Args:
  - show_id (string): Spotify show ID to fetch details for
  - response_format ('json' | 'markdown'): Output format (default: 'markdown')

Returns: Complete show metadata including publisher, total episodes.

Error Handling:
  - Returns "Not found" error if show ID doesn't exist`,
    GetShowDetailsInputSchema.shape,
    async (params) => {
      const showId = params.show_id as string;
      const responseFormat = (params.response_format as string | undefined) ?? ResponseFormat.MARKDOWN;

      const show = await spotifyClient.getShowDetails(showId);

      if (responseFormat === ResponseFormat.JSON) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify(show, null, 2) }],
        };
      }

      const markdown = `# ${show.name || "Unknown Show"}

**Publisher:** ${show.publisher || "Unknown"}

**Total Episodes:** ${show.total_episodes || "Unknown"}

**Explicit:** ${show.explicit ? "Yes" : "No"}

## Description

${show.description || "No description available"}

**External Link:** [Open in Spotify](${show.external_urls.spotify})`;

      return {
        content: [{ type: "text" as const, text: markdown }],
      };
    }
  );

  // Search Spotify Catalog
  server.tool(
    "spotify_search_catalog",
    `Search across Spotify's entire catalog for tracks, artists, albums, playlists, shows, episodes, or audiobooks.

Args:
  - query (string): Search query. Supports filters like "artist:Name", "album:Title", "year:2023"
  - type (string): Comma-separated content types: "track", "artist", "album", "playlist", "show", "episode", "audiobook"
  - limit (number): Results per type, 1-50 (default: 20)
  - offset (number): Pagination offset (default: 0)
  - market (string): ISO 3166-1 alpha-2 country code (optional)
  - response_format ('json' | 'markdown'): Output format (default: 'markdown')

Examples:
  - "Search for AI podcasts" -> query="AI", type="show,episode"
  - "Find Taylor Swift songs" -> query="artist:Taylor Swift", type="track"

Error Handling:
  - Returns empty results if no matches found`,
    SearchCatalogInputSchema.shape,
    async (params) => {
      const query = params.query as string;
      const type = params.type as string;
      const limit = (params.limit as number | undefined) ?? 20;
      const offset = (params.offset as number | undefined) ?? 0;
      const market = params.market as string | undefined;
      const responseFormat = (params.response_format as string | undefined) ?? ResponseFormat.MARKDOWN;

      const response = await spotifyClient.search(query, type, limit, offset, market);

      if (responseFormat === ResponseFormat.JSON) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify(response, null, 2) }],
        };
      }

      const searchResponse = response as Record<string, unknown>;
      const markdown = formatSearchResults(searchResponse, offset);

      return {
        content: [{ type: "text" as const, text: markdown }],
      };
    }
  );
}

function formatEpisodesForJson(items: SavedEpisodeObject[]): EpisodeInfo[] {
  return items.map((item) => ({
    id: item.episode.id || "unknown",
    name: item.episode.name || "Unknown Episode",
    show: item.episode.show.name || "Unknown Show",
    release_date: item.episode.release_date || "Unknown",
    duration_ms: item.episode.duration_ms || 0,
    added_at: item.added_at,
    is_playable: item.episode.is_playable ?? true,
  }));
}

function formatEpisodesForMarkdown(
  items: SavedEpisodeObject[],
  offset: number,
  total: number,
  hasMore: boolean
): string {
  const episodeLines = items
    .map(
      (item, i) =>
        `${offset + i + 1}. **${item.episode.name || "Unknown"}**\n` +
        `   Show: ${item.episode.show.name}\n` +
        `   Released: ${formatDate(item.episode.release_date)}\n` +
        `   Added: ${formatDate(item.added_at)}\n` +
        `   Duration: ${formatDuration(item.episode.duration_ms)}`
    )
    .join("\n\n");

  const pagination = hasMore
    ? `\n\n*Showing episodes ${offset + 1}-${offset + items.length} of ${total} (more available)*`
    : `\n\n*Showing episodes ${offset + 1}-${offset + items.length} of ${total}*`;

  return `# Your Saved Episodes\n\n${episodeLines}${pagination}`;
}

function formatDate(dateString?: string): string {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDuration(ms?: number | null): string {
  if (!ms) return "Unknown";
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${parseInt(seconds) < 10 ? "0" : ""}${seconds}`;
}

interface SearchResultSection {
  items?: unknown[];
  total?: number;
}

function formatSearchResults(
  searchResponse: Record<string, unknown>,
  offset: number
): string {
  const sections: string[] = [];

  // Format tracks
  const tracks = searchResponse.tracks as SearchResultSection | undefined;
  if (tracks?.items && tracks.items.length > 0) {
    sections.push(
      `## Tracks (${tracks.total} total, showing ${tracks.items.length})\n\n${tracks.items
        .map((track, i) => {
          const t = track as Record<string, unknown>;
          const artists = t.artists as Array<{ name?: string }> | undefined;
          const album = t.album as { name?: string } | undefined;
          return `${offset + i + 1}. **${t.name}**\n` +
            `   Artist: ${artists?.map((a) => a.name).join(", ") || "Unknown"}\n` +
            `   Album: ${album?.name || "Unknown"}\n` +
            `   Duration: ${formatDuration(t.duration_ms as number)}\n` +
            `   Explicit: ${t.explicit ? "Yes" : "No"}`;
        })
        .join("\n\n")}`
    );
  }

  // Format artists
  const artists = searchResponse.artists as SearchResultSection | undefined;
  if (artists?.items && artists.items.length > 0) {
    sections.push(
      `## Artists (${artists.total} total, showing ${artists.items.length})\n\n${artists.items
        .map((artist, i) => {
          const a = artist as Record<string, unknown>;
          const genres = a.genres as string[] | undefined;
          return `${offset + i + 1}. **${a.name}**\n` +
            `   Popularity: ${a.popularity}%\n` +
            `   Genres: ${genres?.slice(0, 3).join(", ") || "Not specified"}`;
        })
        .join("\n\n")}`
    );
  }

  // Format albums
  const albums = searchResponse.albums as SearchResultSection | undefined;
  if (albums?.items && albums.items.length > 0) {
    sections.push(
      `## Albums (${albums.total} total, showing ${albums.items.length})\n\n${albums.items
        .map((album, i) => {
          const al = album as Record<string, unknown>;
          const albumArtists = al.artists as Array<{ name?: string }> | undefined;
          return `${offset + i + 1}. **${al.name}**\n` +
            `   Artist: ${albumArtists?.map((a) => a.name).join(", ") || "Unknown"}\n` +
            `   Released: ${formatDate(al.release_date as string)}\n` +
            `   Tracks: ${al.total_tracks}`;
        })
        .join("\n\n")}`
    );
  }

  // Format playlists
  const playlists = searchResponse.playlists as SearchResultSection | undefined;
  if (playlists?.items && playlists.items.length > 0) {
    sections.push(
      `## Playlists (${playlists.total} total, showing ${playlists.items.length})\n\n${playlists.items
        .map((playlist, i) => {
          const p = playlist as Record<string, unknown>;
          const owner = p.owner as { display_name?: string } | undefined;
          const playlistTracks = p.tracks as { total?: number } | undefined;
          return `${offset + i + 1}. **${p.name}**\n` +
            `   Owner: ${owner?.display_name || "Unknown"}\n` +
            `   Tracks: ${playlistTracks?.total || "Unknown"}\n` +
            `   Public: ${p.public ? "Yes" : "No"}`;
        })
        .join("\n\n")}`
    );
  }

  // Format shows
  const shows = searchResponse.shows as SearchResultSection | undefined;
  if (shows?.items && shows.items.length > 0) {
    sections.push(
      `## Shows (${shows.total} total, showing ${shows.items.length})\n\n${shows.items
        .map((show, i) => {
          const s = show as Record<string, unknown>;
          return `${offset + i + 1}. **${s.name}**\n` +
            `   Publisher: ${s.publisher || "Unknown"}\n` +
            `   Episodes: ${s.total_episodes}\n` +
            `   Explicit: ${s.explicit ? "Yes" : "No"}`;
        })
        .join("\n\n")}`
    );
  }

  // Format episodes
  const episodes = searchResponse.episodes as SearchResultSection | undefined;
  if (episodes?.items && episodes.items.length > 0) {
    sections.push(
      `## Episodes (${episodes.total} total, showing ${episodes.items.length})\n\n${episodes.items
        .map((episode, i) => {
          const e = episode as Record<string, unknown>;
          const episodeShow = e.show as { name?: string } | undefined;
          return `${offset + i + 1}. **${e.name}**\n` +
            `   Show: ${episodeShow?.name || "Unknown"}\n` +
            `   Released: ${formatDate(e.release_date as string)}\n` +
            `   Duration: ${formatDuration(e.duration_ms as number)}\n` +
            `   Explicit: ${e.explicit ? "Yes" : "No"}`;
        })
        .join("\n\n")}`
    );
  }

  // Format audiobooks
  const audiobooks = searchResponse.audiobooks as SearchResultSection | undefined;
  if (audiobooks?.items && audiobooks.items.length > 0) {
    sections.push(
      `## Audiobooks (${audiobooks.total} total, showing ${audiobooks.items.length})\n\n${audiobooks.items
        .map((book, i) => {
          const b = book as Record<string, unknown>;
          const authors = b.authors as Array<{ name?: string }> | undefined;
          return `${offset + i + 1}. **${b.name}**\n` +
            `   Author: ${authors?.map((a) => a.name).join(", ") || "Unknown"}\n` +
            `   Chapters: ${b.total_chapters}\n` +
            `   Explicit: ${b.explicit ? "Yes" : "No"}`;
        })
        .join("\n\n")}`
    );
  }

  if (sections.length === 0) {
    return "# Search Results\n\nNo results found matching your search query.";
  }

  return `# Search Results\n\n${sections.join("\n\n")}`;
}
