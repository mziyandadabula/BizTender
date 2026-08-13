import { CIPCProvider } from "./CIPCProvider";
import { MockCIPCProvider } from "./MockCIPCProvider";
import { CIPCApiverseProvider } from "./CIPCApiverseProvider";

let cached: CIPCProvider | null = null;

/** The only place in the app that decides mock vs real CIPC. Everything else imports this. */
export function getCIPCProvider(): CIPCProvider {
  if (cached) return cached;
  const configured = !!(
    process.env.CIPC_CLIENT_ID &&
    process.env.CIPC_CLIENT_SECRET &&
    process.env.CIPC_API_BASE_URL &&
    process.env.CIPC_TOKEN_URL
  );
  cached = configured ? new CIPCApiverseProvider() : new MockCIPCProvider();
  return cached;
}

export * from "./CIPCProvider";
