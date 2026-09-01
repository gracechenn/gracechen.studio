import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { ExhibitionsView } from "@/components/exhibitions/ExhibitionsView";

export const metadata: Metadata = { title: "Exhibitions" };

export default function ExhibitionsPage() {
  return (
    <PageShell hideFooter>
      <ExhibitionsView />
    </PageShell>
  );
}
