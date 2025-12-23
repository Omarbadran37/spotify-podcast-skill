import { z } from "zod";

export enum ResponseFormat {
  JSON = "json",
  MARKDOWN = "markdown"
}

export const ResponseFormatEnum = z.nativeEnum(ResponseFormat);

export const GetSavedEpisodesInputSchema = z.object({
  limit: z.number()
    .int()
    .min(1)
    .max(50)
    .default(20)
    .describe("Maximum number of episodes to return (1-50, default: 20)"),
  offset: z.number()
    .int()
    .min(0)
    .default(0)
    .describe("Index of first episode to return for pagination (default: 0)"),
  market: z.string()
    .optional()
    .describe("ISO 3166-1 alpha-2 country code for filtering available content (optional)"),
  response_format: ResponseFormatEnum
    .default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'json' for structured data or 'markdown' for human-readable (default: markdown)")
}).strict();

export type GetSavedEpisodesInput = z.infer<typeof GetSavedEpisodesInputSchema>;

export const SearchSavedEpisodesInputSchema = z.object({
  query: z.string()
    .min(1)
    .max(100)
    .describe("Search term to match against episode or show names"),
  limit: z.number()
    .int()
    .min(1)
    .max(50)
    .default(20)
    .describe("Maximum number of results to return (1-50, default: 20)"),
  response_format: ResponseFormatEnum
    .default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'json' for structured data or 'markdown' for human-readable (default: markdown)")
}).strict();

export type SearchSavedEpisodesInput = z.infer<typeof SearchSavedEpisodesInputSchema>;

export const GetEpisodeDetailInputSchema = z.object({
  episode_id: z.string()
    .describe("Spotify episode ID to fetch details for"),
  response_format: ResponseFormatEnum
    .default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'json' for structured data or 'markdown' for human-readable (default: markdown)")
}).strict();

export type GetEpisodeDetailInput = z.infer<typeof GetEpisodeDetailInputSchema>;

export const GetShowDetailsInputSchema = z.object({
  show_id: z.string()
    .describe("Spotify show ID to fetch details for"),
  response_format: ResponseFormatEnum
    .default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'json' for structured data or 'markdown' for human-readable (default: markdown)")
}).strict();

export type GetShowDetailsInput = z.infer<typeof GetShowDetailsInputSchema>;

export const SearchCatalogInputSchema = z.object({
  query: z.string()
    .min(1)
    .max(200)
    .describe("Search query (required). Supports field filters: album, artist, track, year, genre, isrc"),
  type: z.string()
    .describe("Comma-separated list of content types: 'track', 'artist', 'album', 'playlist', 'show', 'episode', 'audiobook'"),
  limit: z.number()
    .int()
    .min(1)
    .max(50)
    .default(20)
    .describe("Maximum results per type (1-50, default: 20)"),
  offset: z.number()
    .int()
    .min(0)
    .max(1000)
    .default(0)
    .describe("Index of first result for pagination (default: 0)"),
  market: z.string()
    .optional()
    .describe("ISO 3166-1 alpha-2 country code for market filtering (optional)"),
  response_format: ResponseFormatEnum
    .default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'json' for structured data or 'markdown' for human-readable (default: markdown)")
}).strict();

export type SearchCatalogInput = z.infer<typeof SearchCatalogInputSchema>;
