#!/usr/bin/env node
/**
 * Spotify MCP Server - Authentication CLI
 *
 * Run this script to authenticate with Spotify and save your tokens.
 * Usage: npx tsx src/auth-cli.ts
 *    or: npm run auth
 */

import "dotenv/config";
import { SpotifyAuth } from "./auth/spotifyAuth.js";

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("ERROR: Missing Spotify credentials in .env file");
  console.error("Please ensure SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are set.");
  process.exit(1);
}

// Type assertion after validation
const validClientId: string = clientId;
const validClientSecret: string = clientSecret;

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "login";

  const auth = new SpotifyAuth(validClientId, validClientSecret);

  switch (command) {
    case "login":
    case "auth":
      console.log("\nStarting Spotify authentication...\n");
      await auth.authenticate();
      console.log("Done! You can now run the MCP server.\n");
      break;

    case "logout":
    case "clear":
      auth.clearTokens();
      console.log("Tokens cleared. You will need to re-authenticate.\n");
      break;

    case "status":
      if (auth.hasValidTokens()) {
        console.log("Status: Authenticated\n");
        console.log("You have valid tokens stored.\n");
      } else {
        console.log("Status: Not authenticated\n");
        console.log("Run 'npm run auth' to authenticate.\n");
      }
      break;

    case "refresh":
      if (!auth.hasValidTokens()) {
        console.error("No tokens to refresh. Run 'npm run auth' first.\n");
        process.exit(1);
      }
      await auth.refreshAccessToken();
      console.log("Token refreshed successfully.\n");
      break;

    default:
      console.log(`
Spotify MCP Server - Authentication CLI

Usage: npm run auth [command]

Commands:
  login, auth   Authenticate with Spotify (default)
  logout, clear Clear stored tokens
  status        Check authentication status
  refresh       Refresh the access token

Examples:
  npm run auth          # Start authentication
  npm run auth status   # Check if authenticated
  npm run auth logout   # Clear tokens
`);
  }
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
