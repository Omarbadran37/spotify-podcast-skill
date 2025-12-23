/**
 * Spotify OAuth Authentication Service
 *
 * Handles the Authorization Code flow for Spotify API authentication.
 * Stores tokens locally and handles automatic refresh.
 */

import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import { URL } from "url";
import axios from "axios";
import * as crypto from "crypto";

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const REDIRECT_URI = "http://127.0.0.1:8888/callback";
const SCOPES = [
  "user-library-read",
  "user-read-private",
  "user-read-email",
].join(" ");

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
  scope: string;
}

export class SpotifyAuth {
  private clientId: string;
  private clientSecret: string;
  private tokenPath: string;
  private tokenData: TokenData | null = null;

  constructor(clientId: string, clientSecret: string, tokenPath?: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;

    // Store tokens in user's home directory
    const homeDir = process.env.HOME || process.env.USERPROFILE || ".";
    this.tokenPath = tokenPath || path.join(homeDir, ".spotify-mcp-tokens.json");

    // Try to load existing tokens
    this.loadTokens();
  }

  /**
   * Load tokens from disk
   */
  private loadTokens(): void {
    try {
      if (fs.existsSync(this.tokenPath)) {
        const data = fs.readFileSync(this.tokenPath, "utf-8");
        this.tokenData = JSON.parse(data);
      }
    } catch (error) {
      console.error("Failed to load tokens:", error);
      this.tokenData = null;
    }
  }

  /**
   * Save tokens to disk
   */
  private saveTokens(): void {
    try {
      fs.writeFileSync(this.tokenPath, JSON.stringify(this.tokenData, null, 2));
    } catch (error) {
      console.error("Failed to save tokens:", error);
    }
  }

  /**
   * Generate a random state string for CSRF protection
   */
  private generateState(): string {
    return crypto.randomBytes(16).toString("hex");
  }

  /**
   * Check if we have valid tokens
   */
  public hasValidTokens(): boolean {
    if (!this.tokenData) return false;

    // Check if token is expired (with 60 second buffer)
    const now = Date.now();
    return this.tokenData.expires_at > now + 60000;
  }

  /**
   * Get the current access token, refreshing if needed
   */
  public async getAccessToken(): Promise<string> {
    if (!this.tokenData) {
      throw new Error("Not authenticated. Run the auth flow first.");
    }

    // Check if token needs refresh
    const now = Date.now();
    if (this.tokenData.expires_at <= now + 60000) {
      await this.refreshAccessToken();
    }

    return this.tokenData.access_token;
  }

  /**
   * Refresh the access token using the refresh token
   */
  public async refreshAccessToken(): Promise<void> {
    if (!this.tokenData?.refresh_token) {
      throw new Error("No refresh token available. Run the auth flow first.");
    }

    try {
      const response = await axios.post(
        SPOTIFY_TOKEN_URL,
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: this.tokenData.refresh_token,
        }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")}`,
          },
        }
      );

      const data = response.data;

      this.tokenData = {
        access_token: data.access_token,
        refresh_token: data.refresh_token || this.tokenData.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
        token_type: data.token_type,
        scope: data.scope,
      };

      this.saveTokens();
      console.error("Token refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh token:", error);
      throw new Error("Failed to refresh access token. Please re-authenticate.");
    }
  }

  /**
   * Start the OAuth flow - opens browser and waits for callback
   */
  public async authenticate(): Promise<void> {
    const state = this.generateState();

    // Build authorization URL
    const authUrl = new URL(SPOTIFY_AUTH_URL);
    authUrl.searchParams.set("client_id", this.clientId);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("scope", SCOPES);

    console.error("\n=== Spotify Authentication ===\n");
    console.error("Please open this URL in your browser to authenticate:\n");
    console.error(authUrl.toString());
    console.error("\nWaiting for authentication...\n");

    // Start local server to receive callback
    const code = await this.waitForCallback(state);

    // Exchange code for tokens
    await this.exchangeCodeForTokens(code);

    console.error("\nAuthentication successful! Tokens saved.\n");
  }

  /**
   * Start a temporary server to receive the OAuth callback
   */
  private waitForCallback(expectedState: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        const url = new URL(req.url || "", `http://${req.headers.host}`);

        if (url.pathname === "/callback") {
          const code = url.searchParams.get("code");
          const state = url.searchParams.get("state");
          const error = url.searchParams.get("error");

          if (error) {
            res.writeHead(400, { "Content-Type": "text/html" });
            res.end(`
              <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                  <h1>Authentication Failed</h1>
                  <p>Error: ${error}</p>
                  <p>You can close this window.</p>
                </body>
              </html>
            `);
            server.close();
            reject(new Error(`Authentication failed: ${error}`));
            return;
          }

          if (state !== expectedState) {
            res.writeHead(400, { "Content-Type": "text/html" });
            res.end(`
              <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                  <h1>Authentication Failed</h1>
                  <p>State mismatch - possible CSRF attack</p>
                  <p>You can close this window.</p>
                </body>
              </html>
            `);
            server.close();
            reject(new Error("State mismatch"));
            return;
          }

          if (!code) {
            res.writeHead(400, { "Content-Type": "text/html" });
            res.end(`
              <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                  <h1>Authentication Failed</h1>
                  <p>No authorization code received</p>
                  <p>You can close this window.</p>
                </body>
              </html>
            `);
            server.close();
            reject(new Error("No authorization code"));
            return;
          }

          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(`
            <html>
              <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1>Authentication Successful!</h1>
                <p>You can close this window and return to the terminal.</p>
              </body>
            </html>
          `);

          server.close();
          resolve(code);
        }
      });

      server.listen(8888, "127.0.0.1", () => {
        console.error("Callback server listening on http://127.0.0.1:8888/callback");
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        server.close();
        reject(new Error("Authentication timed out"));
      }, 5 * 60 * 1000);
    });
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<void> {
    try {
      const response = await axios.post(
        SPOTIFY_TOKEN_URL,
        new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: REDIRECT_URI,
        }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")}`,
          },
        }
      );

      const data = response.data;

      this.tokenData = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
        token_type: data.token_type,
        scope: data.scope,
      };

      this.saveTokens();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Token exchange error:", error.response?.data);
      }
      throw new Error("Failed to exchange authorization code for tokens");
    }
  }

  /**
   * Clear stored tokens (logout)
   */
  public clearTokens(): void {
    this.tokenData = null;
    try {
      if (fs.existsSync(this.tokenPath)) {
        fs.unlinkSync(this.tokenPath);
      }
    } catch (error) {
      console.error("Failed to clear tokens:", error);
    }
  }
}
