import { CIPCProvider, CIPCNameSearchResponse, CIPCCompanyRecord } from "./CIPCProvider";
import { scoreSimilarity, overallSignal, SimilarityBand } from "./nameSimilarity";

/**
 * DEMO DATA — not sourced from CIPC. Used only when CIPC_CLIENT_ID/SECRET are unset.
 * Every record and response from this provider is stamped source: "mock" so the UI
 * can show "Demo data — CIPC not connected" instead of implying an official result.
 */
const FIXTURE_COMPANIES: CIPCCompanyRecord[] = [
  {
    enterpriseNumber: "2019/123456/07",
    name: "Fibrezone Networks (Pty) Ltd",
    status: "In Business",
    registrationDate: "2019-03-14",
    companyType: "Private Company",
    registeredOffice: "Durban, KwaZulu-Natal",
    directors: [{ fullName: "T. Ndlovu", appointedDate: "2019-03-14" }],
    source: "mock",
    retrievedAt: new Date().toISOString(),
  },
  {
    enterpriseNumber: "2021/654321/07",
    name: "Fibre Zone Network Solutions CC",
    status: "In Business",
    registrationDate: "2021-07-01",
    companyType: "Close Corporation",
    registeredOffice: "Johannesburg, Gauteng",
    source: "mock",
    retrievedAt: new Date().toISOString(),
  },
  {
    enterpriseNumber: "2020/998877/07",
    name: "ABC Trading (Pty) Ltd",
    status: "In Business",
    registrationDate: "2020-01-10",
    companyType: "Private Company",
    registeredOffice: "Cape Town, Western Cape",
    source: "mock",
    retrievedAt: new Date().toISOString(),
  },
];

export class MockCIPCProvider implements CIPCProvider {
  async searchCompanyName(query: string): Promise<CIPCNameSearchResponse> {
    const scored = FIXTURE_COMPANIES.map((c) => {
      const { band, score } = scoreSimilarity(query, c.name);
      return { name: c.name, enterpriseNumber: c.enterpriseNumber, status: c.status, similarity: band, score };
    }).filter((r) => r.similarity !== "none");

    const bands: SimilarityBand[] = scored.map((s) => s.similarity as SimilarityBand);

    return {
      query,
      results: scored.map(({ score, ...rest }) => rest),
      overallSignal: overallSignal(bands),
      source: "mock",
      retrievedAt: new Date().toISOString(),
    };
  }

  async getCompanyByEnterpriseNumber(enterpriseNumber: string): Promise<CIPCCompanyRecord | null> {
    return FIXTURE_COMPANIES.find((c) => c.enterpriseNumber === enterpriseNumber) ?? null;
  }

  async getCompanyByName(name: string): Promise<CIPCCompanyRecord | null> {
    const norm = name.toLowerCase().trim();
    return FIXTURE_COMPANIES.find((c) => c.name.toLowerCase().includes(norm)) ?? null;
  }
}
