import App from "../../App";
import { privateMetadata } from "../../../seo/metadata";
import { legacyRouteTitle } from "../../../seo/route-pages";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  return privateMetadata("en", legacyRouteTitle("en", (await params).slug));
}
export const dynamicParams = false;
export function generateStaticParams() {
  return [
    "training",
    "dashboard",
    "history",
    "challenges",
    "routines",
    "achievements",
    "settings",
    "help",
    "arena",
    "results",
    "onboarding",
    ...[
      "flick-burst",
      "micro-precision",
      "moving-clicks",
      "smooth-tracking",
      "reaction-tap",
      "sphere-flick",
      "precision-range",
      "strafe-tracking",
      "reactive-tracking",
      "target-switching",
    ].map((id) => "setup/" + id),
  ].map((p) => ({ slug: p.split("/") }));
}
export default function Page() {
  return <App />;
}
