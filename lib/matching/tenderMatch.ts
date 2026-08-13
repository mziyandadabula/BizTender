export interface MatchableCompany {
  industry?: string | null;
  categories?: string[] | null;
  province?: string | null;
  employeeCount?: number | null;
  registrationDate?: string | null; // ISO date
}

export interface MatchableTender {
  category?: string | null;
  sector?: string | null;
  province?: string | null;
  title?: string | null;
  description?: string | null;
}

export interface MatchReason {
  positive: boolean;
  label: string;
}

export interface MatchResult {
  score: number; // 0-100
  reasons: MatchReason[];
}

/**
 * Deliberately simple, explainable scoring — every point traces to a stated reason
 * so we never present a black-box "92% match" the user can't interrogate.
 * Always surfaced in the UI as "Estimated Match", never certainty of eligibility.
 */
export function scoreTenderMatch(company: MatchableCompany, tender: MatchableTender): MatchResult {
  const reasons: MatchReason[] = [];
  let score = 40; // baseline: unmatched fields don't count against you, they just don't add

  const industryText = `${tender.category ?? ""} ${tender.sector ?? ""} ${tender.title ?? ""} ${tender.description ?? ""}`.toLowerCase();

  if (company.industry && industryText.includes(company.industry.toLowerCase())) {
    score += 25;
    reasons.push({ positive: true, label: `Industry match: ${company.industry}` });
  }

  const matchedCategories = (company.categories ?? []).filter((cat) => industryText.includes(cat.toLowerCase()));
  if (matchedCategories.length) {
    score += 10;
    reasons.push({ positive: true, label: `Service category match: ${matchedCategories.join(", ")}` });
  }

  if (company.province && tender.province && company.province.toLowerCase() === tender.province.toLowerCase()) {
    score += 15;
    reasons.push({ positive: true, label: `Province match: ${tender.province}` });
  } else if (tender.province) {
    reasons.push({ positive: false, label: `Tender is in ${tender.province}, outside your registered province` });
  }

  if (company.registrationDate) {
    const ageMonths =
      (Date.now() - new Date(company.registrationDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (ageMonths >= 12) {
      score += 5;
      reasons.push({ positive: true, label: "Company older than 12 months" });
    } else {
      reasons.push({ positive: false, label: "Company under 12 months old — some tenders require longer trading history" });
    }
  }

  if (!matchedCategories.length && !(company.industry && industryText.includes(company.industry.toLowerCase()))) {
    reasons.push({ positive: false, label: "No clear industry/category match found in tender text" });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, reasons };
}
