import { describe, it, expect } from "vitest";
import { scoreSimilarity, normaliseName } from "../lib/providers/cipc/nameSimilarity";
import { scoreTenderMatch } from "../lib/matching/tenderMatch";
import { vatCalculator, tenderPricingCalculator } from "../lib/calculators/calculators";
import { tenderReadinessScore } from "../lib/matching/tenderReadiness";

describe("nameSimilarity", () => {
  it("normalises Pty Ltd variants", () => {
    expect(normaliseName("Fibrezone Networks (Pty) Ltd")).toBe("fibrezone networks");
    expect(normaliseName("FIBREZONE NETWORKS PTY LTD")).toBe("fibrezone networks");
  });

  it("scores an exact match as exact", () => {
    expect(scoreSimilarity("Fibrezone Networks", "Fibrezone Networks Pty Ltd").band).toBe("exact");
  });

  it("scores a clearly different name as none/low", () => {
    const { band } = scoreSimilarity("Fibrezone Networks", "Totally Different Trading");
    expect(["low", "none"]).toContain(band);
  });
});

describe("tenderMatch", () => {
  it("boosts score for industry + province match", () => {
    const result = scoreTenderMatch(
      { industry: "IT Services", province: "Western Cape", categories: ["IT Services"] },
      { category: "IT Services", province: "Western Cape", title: "Provision of IT Support Services" }
    );
    expect(result.score).toBeGreaterThan(60);
    expect(result.reasons.some((r) => r.positive)).toBe(true);
  });

  it("never returns a score above 100 or below 0", () => {
    const result = scoreTenderMatch({}, {});
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe("calculators", () => {
  it("VAT exclusive adds 15%", () => {
    const r = vatCalculator(1000, "exclusive");
    expect(r.vat).toBe(150);
    expect(r.total).toBe(1150);
  });

  it("VAT inclusive backs out 15%", () => {
    const r = vatCalculator(1150, "inclusive");
    expect(r.subtotal).toBeCloseTo(1000, 0);
  });

  it("tender pricing calculator hits target margin", () => {
    const out = tenderPricingCalculator({
      materials: 1000, labour: 500, transport: 100, equipment: 0, subcontractors: 0,
      overheadsPct: 10, contingencyPct: 5, profitMarginPct: 20, discountPct: 0, vatInclusive: true,
    });
    expect(out.grossMarginPct).toBeCloseTo(20, 0);
    expect(out.finalPrice).toBeGreaterThan(out.costSubtotal);
  });
});

describe("tenderReadinessScore", () => {
  it("scores a fully-compliant company near 100", () => {
    const { overall } = tenderReadinessScore({
      cipcRegistered: true, csdStatus: "green", bbbeeStatus: "green",
      hasCompanyProfile: true, industryRegistrationsPct: 100, documentsCompletePct: 100,
    });
    expect(overall).toBe(100);
  });

  it("lists improvements for an incomplete company", () => {
    const { improvements } = tenderReadinessScore({
      cipcRegistered: true, csdStatus: "unknown", bbbeeStatus: "red",
      hasCompanyProfile: false, industryRegistrationsPct: 40, documentsCompletePct: 50,
    });
    expect(improvements.length).toBeGreaterThan(0);
  });
});
