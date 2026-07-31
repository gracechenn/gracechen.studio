import { Nav } from "@/components/Nav";
import { HomeStage } from "@/components/home/HomeStage";

export default function RulerPage() {
  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <Nav />
      <HomeStage />
    </main>
  );
}
