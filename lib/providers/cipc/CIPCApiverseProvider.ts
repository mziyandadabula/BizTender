import { CIPCProvider, CIPCNameSearchResponse, CIPCCompanyRecord } from "./CIPCProvider";
import { logApiUsage } from "../logApiUsage";

/**
 * Adapter for the official CIPC APIVerse API.
 *
 * NOT ACTIVE until CIPC_CLIENT_ID / CIPC_CLIENT_SECRET / CIPC_API_BASE_URL /
 * CIPC_TOKEN_URL are set — getCIPCProvider() falls back to MockCIPCProvider otherwise.
 *
 * IMPORTANT: this file intentionally does NOT assume specific endpoint paths,
 * rate limits, or pricing beyond the OAuth2 client-credentials flow, because
 * none of that is confirmed. Fill in the exact endpoint paths from CIPC's
 * developer portal / signed agreement before enabling this in production.
 */
export class CIPCApiverseProvider implements CIPCProvider {
  private tokenCache: { token: string; expiresAt: number } | null = null;

  private async getAccessToken(): Promise<string> {
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      return this.tokenCache.token;
    }
    const start = Date.now();
    const res = await fetch(process.env.CIPC_TOKEN_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.CIPC_CLIENT_ID!,
        client_secret: process.env.CIPC_CLIENT_SECRET!,
      }),
    });
    await logApiUsage({
      provider: "cipc",
      operation: "oauth_token",
      statusCode: res.status,
      success: res.ok,
      durationMs: Date.now() - start,
    });
    if (!res.ok) throw new Error("CIPC token request failed");
    const data = await res.json();
    this.tokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 30) * 1000 };
    return data.access_token;
  }

  async searchCompanyName(query: string): Promise<CIPCNameSearchResponse> {
    // TODO: replace with the confirmed CIPC name-search endpoint once available.
    throw new Error(
      "CIPCApiverseProvider.searchCompanyName is not implemented — CIPC endpoint paths are not yet confirmed. " +
        "Configure CIPC_COMPANIES_API_URL with the exact documented path before enabling this adapter."
    );
  }

  async getCompanyByEnterpriseNumber(enterpriseNumber: string): Promise<CIPCCompanyRecord | null> {
    throw new Error("CIPCApiverseProvider.getCompanyByEnterpriseNumber is not implemented yet.");
  }

  async getCompanyByName(name: string): Promise<CIPCCompanyRecord | null> {
    throw new Error("CIPCApiverseProvider.getCompanyByName is not implemented yet.");
  }
}
