export interface ReadinessInputs {
  cipcRegistered: boolean;
  csdStatus: "green" | "amber" | "red" | "unknown";
  bbbeeStatus: "green" | "amber" | "red" | "unknown";
  hasCompanyProfile: boolean;
  industryRegistrationsPct: number; // 0-100, % of relevant registrations held
  documentsCompletePct: number; // 0-100
}

const WEIGHTS = {
  cipc: 20,
  csd: 20,
  bbbee: 15,
  profile: 15,
  industryRegistrations: 15,
  documents: 15,
};

const statusToPct = (s: "green" | "amber" | "red" | "unknown") =>
  s === "green" ? 100 : s === "amber" ? 60 : s === "red" ? 20 : 0;

export function tenderReadinessScore(inputs: ReadinessInputs) {
  const breakdown = {
    "Company registration": inputs.cipcRegistered ? 100 : 0,
    CSD: statusToPct(inputs.csdStatus),
    "B-BBEE": statusToPct(inputs.bbbeeStatus),
    "Company profile": inputs.hasCompanyProfile ? 100 : 0,
    "Industry registrations": Math.round(inputs.industryRegistrationsPct),
    "Tender documents": Math.round(inputs.documentsCompletePct),
  };

  const overall = Math.round(
    (breakdown["Company registration"] * WEIGHTS.cipc +
      breakdown["CSD"] * WEIGHTS.csd +
      breakdown["B-BBEE"] * WEIGHTS.bbbee +
      breakdown["Company profile"] * WEIGHTS.profile +
      breakdown["Industry registrations"] * WEIGHTS.industryRegistrations +
      breakdown["Tender documents"] * WEIGHTS.documents) /
      100
  );

  const improvements: string[] = [];
  if (breakdown["Company registration"] < 100) improvements.push("Complete CIPC company registration.");
  if (breakdown["CSD"] < 100) improvements.push("Update your Central Supplier Database (CSD) profile.");
  if (breakdown["B-BBEE"] < 100) improvements.push("Renew or upload your B-BBEE certificate/affidavit.");
  if (breakdown["Company profile"] < 100) improvements.push("Finish your company profile.");
  if (breakdown["Industry registrations"] < 80) improvements.push("Add relevant industry registrations (CIDB, NHBRC, etc.).");
  if (breakdown["Tender documents"] < 80) improvements.push("Upload the remaining documents to your vault.");

  return { overall, breakdown, improvements };
}
