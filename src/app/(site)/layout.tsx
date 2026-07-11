import { NavBar } from "@/components/newspaper/NavBar";
import { RouteFlipTransition } from "@/components/newspaper/RouteFlipTransition";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh w-dvw flex-col overflow-hidden bg-polis-paper">
      <NavBar />
      <div className="min-h-0 flex-1" style={{ perspective: "1600px" }}>
        <RouteFlipTransition>{children}</RouteFlipTransition>
      </div>
    </div>
  );
}
