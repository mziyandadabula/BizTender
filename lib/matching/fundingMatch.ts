import { MatchReason, MatchResult } from "./tenderMatch";

export interface MatchableFunding {
  industry?: string | null;
  province?: string | null;
  minCompanyAgeMonths?: number | null;
  minTurnoverCents?: number | null;
}

export interface FundingApplicant {
  industry?: string | null;
  province?: string | null;
  companyAgeMonths?: number | null;
  annualTurnoverCents?: number | null;
}

/** Same explainable, non-guaranteeing approach as tender matching. */
export function scoreFundingMatch(company: FundingApplicant, funding: MatchableFunding): MatchResult {
  const reasons: MatchReason[] = [];
  let score = 40;

  if (funding.industry && company.industry && funding.industry.toLowerCase() === company.industry.toLowerCase()) {
    score += 25;
    reasons.push({ positive: true, label: `Industry eligible: ${funding.industry}` });
  } else if (funding.industry) {
    reasons.push({ positive: false, label: `Funder targets ${funding.industry}` });
  }

  if (funding.province && company.province && funding.province.toLowerCase() === company.province.toLowerCase()) {
    score += 15;
    reasons.push({ positive: true, label: `Province eligible: ${funding.province}` });
  }

  if (funding.minCompanyAgeMonths != null) {
    if ((company.companyAgeMonths ?? 0) >= funding.minCompanyAgeMonths) {
      score += 10;
      reasons.push({ positive: true, label: `Meets minimum trading history (${funding.minCompanyAgeMonths}+ months)` });
    } else {
      reasons.push({ positive: false, label: `Requires ${funding.minCompanyAgeMonths}+ months trading history` });
    }
  }

  if (funding.minTurnoverCents != null) {
    if ((company.annualTurnoverCents ?? 0) >= funding.minTurnoverCents) {
      score += 10;
      reasons.push({ positive: true, label: "Meets minimum turnover requirement" });
    } else {
      reasons.push({ positive: false, label: "Below stated minimum turnover — verify with funder, ranges are often flexible" });
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, reasons };
}
