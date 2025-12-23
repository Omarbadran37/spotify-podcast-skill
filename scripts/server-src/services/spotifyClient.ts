import axios, { AxiosInstance, AxiosError } from "axios";
import {
  PaginatedResponse,
  SavedEpisodeObject,
  SpotifyEpisode,
  SpotifyShow,
} from "../types.js";
import { SpotifyAuth } from "../auth/spotifyAuth.js";

type TokenProvider = string | SpotifyAuth;

export class SpotifyClient {
  private client: AxiosInstance;
  private tokenProvider: TokenProvider;

  constructor(tokenProvider: TokenProvider) {
    this.tokenProvider = tokenProvider;

    this.client = axios.create({
      baseURL: "https://api.spotify.com/v1",
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    // Add request interceptor to inject fresh token
    this.client.interceptors.request.use(async (config) => {
      const token = await this.getToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  /**
   * Get the current access token (refreshes if needed when using SpotifyAuth)
   */
  private async getToken(): Promise<string> {
    if (typeof this.tokenProvider === "string") {
      return this.tokenProvider;
    }
    return this.tokenProvider.getAccessToken();
  }

  async getSavedEpisodes(
    limit: number = 20,
    offset: number = 0,
    market?: string
  ): Promise<PaginatedResponse<SavedEpisodeObject>> {
    try {
      const params: Record<string, unknown> = {
        limit,
        offset,
      };

      if (market) {
        params.market = market;
      }

      const response = await this.client.get<
        PaginatedResponse<SavedEpisodeObject>
      >("/me/episodes", { params });

      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to fetch saved episodes");
    }
  }

  async getEpisodeDetail(
    episodeId: string,
    market?: string
  ): Promise<SpotifyEpisode> {
    try {
      const params: Record<string, unknown> = {};

      if (market) {
        params.market = market;
      }

      const response = await this.client.get<SpotifyEpisode>(
        `/episodes/${episodeId}`,
        { params }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to fetch episode ${episodeId}`);
    }
  }

  async getShowDetails(showId: string): Promise<SpotifyShow> {
    try {
      const response = await this.client.get<SpotifyShow>(
        `/shows/${showId}`
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to fetch show ${showId}`);
    }
  }

  async search(
    query: string,
    types: string,
    limit: number = 20,
    offset: number = 0,
    market?: string
  ): Promise<unknown> {
    try {
      const params: Record<string, unknown> = {
        q: query,
        type: types,
        limit,
        offset,
      };

      if (market) {
        params.market = market;
      }

      const response = await this.client.get<unknown>(
        "/search",
        { params }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error, "Failed to search catalog");
    }
  }

  private handleError(
    error: unknown,
    defaultMessage: string
  ): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;

      if (axiosError.response?.status === 401) {
        throw new Error(
          "Unauthorized: Invalid or expired Spotify access token. Run 'npm run auth' to re-authenticate."
        );
      }

      if (axiosError.response?.status === 403) {
        throw new Error(
          "Forbidden: Insufficient permissions. Run 'npm run auth' to authenticate with correct scopes."
        );
      }

      if (axiosError.response?.status === 404) {
        throw new Error(`Not found: ${axiosError.response.data?.error?.message || "Resource not found"}`);
      }

      if (axiosError.response?.status === 429) {
        throw new Error(
          "Rate limited: Too many requests. Please wait before retrying."
        );
      }

      if (axiosError.response?.status === 500) {
        throw new Error(
          "Spotify API error: Server error. Please try again later."
        );
      }

      if (axiosError.message === "timeout of 10000ms exceeded") {
        throw new Error("Request timeout: Spotify API took too long to respond");
      }

      throw new Error(
        `${defaultMessage}: ${axiosError.response?.data?.error?.message || axiosError.message}`
      );
    }

    throw new Error(`${defaultMessage}: ${String(error)}`);
  }
}
