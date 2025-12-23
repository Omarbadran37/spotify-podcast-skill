#!/usr/bin/env node
/**
 * Spotify MCP Server
 *
 * An MCP server for Spotify API integration with episode and show management.
 * Supports automatic token refresh via OAuth authentication.
 *
 * Setup:
 *   1. Run 'npm run auth' to authenticate with Spotify
 *   2. Start the server with 'npm start'
 */

import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SpotifyClient } from "./services/spotifyClient.js";
import { SpotifyAuth } from "./auth/spotifyAuth.js";
import { registerEpisodeTools } from "./tools/episodesTools.js";

// Initialize MCP Server
const server = new McpServer({
  name: "spotify-mcp-server",
  version: "1.0.0",
});

// Get credentials from environment
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const directAccessToken = process.env.SPOTIFY_ACCESS_TOKEN;

// Determine authentication method
let spotifyClient: SpotifyClient;

if (directAccessToken) {
  // Use direct access token if provided (legacy support)
  console.error("Using direct access token from environment");
  spotifyClient = new SpotifyClient(directAccessToken);
} else if (clientId && clientSecret) {
  // Use OAuth with automatic token refresh
  const auth = new SpotifyAuth(clientId, clientSecret);

  if (!auth.hasValidTokens()) {
    console.error(
      "ERROR: No valid tokens found. Please authenticate first.\n"
    );
    console.error("Run: npm run auth\n");
    console.error(
      "This will open a browser window to authenticate with Spotify.\n"
    );
    process.exit(1);
  }

  console.error("Using OAuth tokens with automatic refresh");
  spotifyClient = new SpotifyClient(auth);
} else {
  console.error("ERROR: Missing Spotify credentials.\n");
  console.error("Please ensure your .env file contains:\n");
  console.error("  SPOTIFY_CLIENT_ID=your_client_id");
  console.error("  SPOTIFY_CLIENT_SECRET=your_client_secret\n");
  console.error("Then run: npm run auth\n");
  process.exit(1);
}

// Register tools
registerEpisodeTools(server, spotifyClient);

// Main function
async function main(): Promise<void> {
  // Create stdio transport (standard for MCP servers)
  const transport = new StdioServerTransport();

  // Connect server to transport
  await server.connect(transport);

  console.error("Spotify MCP server running via stdio");
}

// Run the server
main().catch((error: unknown) => {
  console.error("Server error:", error);
  process.exit(1);
});
