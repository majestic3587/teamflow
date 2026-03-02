import {
  LpHeader,
  LpHero,
  LpProblem,
  LpFeatures,
  LpHowItWorks,
  LpRoles,
  LpPricing,
  LpCta,
  LpFooter,
} from "@/components/lp";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LpHeader />
      <LpHero />
      <LpProblem />
      <LpFeatures />
      <LpHowItWorks />
      <LpRoles />
      <LpPricing />
      <LpCta />
      <LpFooter />
    </div>
  );
}
