/**
 * Seeds admin-configurable products, demo tenders, and demo funding opportunities.
 * Run with: npm run seed  (requires SUPABASE_SERVICE_ROLE_KEY in .env)
 */
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  console.log("Seeding products...");
  const products = [
    { slug: "business-starter", name: "Business Starter", type: "once_off", price_cents: 44900, description: "Company registration, name search and a basic tender-readiness assessment.", sort_order: 1,
      features: ["Company registration", "Name search", "CIPC registration", "Basic company profile", "Basic tender-readiness assessment"] },
    { slug: "tender-ready", name: "Tender Ready", type: "once_off", price_cents: 124900, description: "Everything to become tender-ready in 30 days.", sort_order: 2,
      features: ["Company registration", "CSD assistance", "B-BBEE guidance", "Company profile", "Tender checklist", "Document vault", "30-day premium access"] },
    { slug: "tender-pro", name: "Tender Pro", type: "once_off", price_cents: 249900, description: "Full tender preparation and pricing support.", sort_order: 3,
      features: ["Everything in Tender Ready", "Capability statement", "Tender documentation pack", "Tender pricing assistance", "Funding-readiness assessment", "90-day premium access"] },
    { slug: "starter-plan", name: "Starter", type: "subscription", price_cents: 9900, billing_interval: "month", description: "Saved tenders, alerts and document vault.", sort_order: 4,
      features: ["Saved tenders", "Tender alerts", "Compliance reminders", "Document vault", "Funding alerts"] },
    { slug: "professional-plan", name: "Professional", type: "subscription", price_cents: 19900, billing_interval: "month", description: "Tender matching and AI-assisted tools.", sort_order: 5,
      features: ["Tender matching", "AI tender analysis", "Tender workspaces", "Advanced calculators", "Funding matching"] },
  ];

  for (const p of products) {
    const { features, ...productRow } = p;
    const { data: existing } = await supabase.from("products").select("id").eq("slug", p.slug).maybeSingle();
    let productId = existing?.id;
    if (!productId) {
      const { data } = await supabase.from("products").insert(productRow).select().single();
      productId = data!.id;
    }
    await supabase.from("product_features").delete().eq("product_id", productId);
    await supabase.from("product_features").insert(features.map((label, i) => ({ product_id: productId, label, sort_order: i })));
  }

  console.log("Seeding demo tenders (source=mock)...");
  const tenders = [
    { tender_number: "EC-DOH-2026-0142", title: "Supply and Delivery of PPE to District Clinics", organisation: "Eastern Cape Department of Health", province: "Eastern Cape", category: "PPE Supply", sector: "Health", tender_type: "Goods", closing_date: futureDate(6), briefing_required: false, source: "mock" },
    { tender_number: "GP-COJ-2026-0987", title: "Appointment of a Panel for Building Maintenance Services", organisation: "City of Johannesburg", province: "Gauteng", category: "Construction", sector: "Municipal", tender_type: "Services", closing_date: futureDate(14), briefing_required: true, source: "mock" },
    { tender_number: "WC-PROV-2026-0233", title: "Provision of IT Support Services", organisation: "Western Cape Provincial Government", province: "Western Cape", category: "IT Services", sector: "ICT", tender_type: "Services", closing_date: futureDate(21), briefing_required: false, source: "mock" },
    { tender_number: "KZN-EDU-2026-0056", title: "Supply of Stationery to Schools", organisation: "KwaZulu-Natal Department of Education", province: "KwaZulu-Natal", category: "Stationery Supply", sector: "Education", tender_type: "Goods", closing_date: futureDate(9), briefing_required: false, source: "mock" },
  ];
  await supabase.from("tenders").upsert(tenders, { onConflict: "tender_number" });

  console.log("Seeding demo funding opportunities (status=draft — verify before publishing)...");
  const funding = [
    { name: "Township and Rural Enterprise Programme", provider: "sefa", description: "Working capital and asset finance for township and rural-based SMEs.", funding_type: "Loan", industry: null, province: null, status: "draft", official_website: "https://www.sefa.org.za" },
    { name: "Business Growth/Resilience Facility", provider: "IDC", description: "Growth funding for established SMEs across sectors.", funding_type: "DFI funding", status: "draft", official_website: "https://www.idc.co.za" },
  ];
  await supabase.from("funding_opportunities").upsert(funding, { onConflict: "name" });

  console.log("Done. Demo tenders/funding are marked source=mock / status=draft — verify and publish from the admin panel before relying on them.");
}

function futureDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
