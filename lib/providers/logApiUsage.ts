import { getServiceRoleClient } from "../supabase/serviceRole";

export interface ApiUsageLogEntry {
  provider: "cipc" | "payfast" | "ai" | "etenders";
  operation: string;
  statusCode?: number;
  success: boolean;
  durationMs?: number;
  cached?: boolean;
  meta?: Record<string, unknown>;
}

/**
 * Every provider adapter calls this after each external request.
 * Powers the admin "API health" screen (CIPC calls today, error rate, avg latency, etc.)
 */
export async function logApiUsage(entry: ApiUsageLogEntry) {
  try {
    const supabase = getServiceRoleClient();
    await supabase.from("api_usage_logs").insert({
      provider: entry.provider,
      operation: entry.operation,
      status_code: entry.statusCode ?? null,
      success: entry.success,
      duration_ms: entry.durationMs ?? null,
      cached: entry.cached ?? false,
      meta: entry.meta ?? {},
    });
  } catch (err) {
    // Never let logging failures break the calling feature.
    console.error("logApiUsage failed", err);
  }
}
