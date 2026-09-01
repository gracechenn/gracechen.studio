import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { HomeAltStage } from "@/components/home-alt/HomeAltStage";
import { homeAltSlides } from "@/data/homeAlt";

export const metadata: Metadata = { title: "Home (alt)" };

export default function HomeAltPage() {
  return (
    <PageShell hideFooter>
      <HomeAltStage slides={homeAltSlides} />
    </PageShell>
  );
}
