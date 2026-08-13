export interface CIPCNameSearchResult {
  name: string;
  enterpriseNumber?: string;
  status?: string;
  similarity: "exact" | "high" | "medium" | "low";
}

export interface CIPCNameSearchResponse {
  query: string;
  results: CIPCNameSearchResult[];
  overallSignal: "green" | "orange" | "red";
  source: "mock" | "cipc_apiverse";
  retrievedAt: string;
}

export interface CIPCCompanyRecord {
  enterpriseNumber: string;
  name: string;
  status: string;
  registrationDate?: string;
  companyType?: string;
  registeredOffice?: string;
  directors?: { fullName: string; appointedDate?: string }[];
  source: "mock" | "cipc_apiverse";
  retrievedAt: string;
}

/**
 * Every CIPC-touching code path in the app goes through this interface.
 * Never call an external CIPC endpoint directly from a route handler or component.
 *
 * Swap MockCIPCProvider -> CIPCApiverseProvider once CIPC_CLIENT_ID / CIPC_CLIENT_SECRET
 * are set in the environment. See getCIPCProvider() in index.ts.
 */
export interface CIPCProvider {
  searchCompanyName(query: string): Promise<CIPCNameSearchResponse>;
  getCompanyByEnterpriseNumber(enterpriseNumber: string): Promise<CIPCCompanyRecord | null>;
  getCompanyByName(name: string): Promise<CIPCCompanyRecord | null>;
}
