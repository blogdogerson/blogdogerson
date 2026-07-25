import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/portal/Header";
import { Footer } from "@/components/portal/Footer";
import { WaveBackground } from "@/components/portal/WaveBackground";
import { PopupOverlay } from "@/components/portal/PopupOverlay";

export const Route = createFileRoute("/_portal")({
  component: PortalLayout,
});

function PortalLayout() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <WaveBackground />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <PopupOverlay />
    </div>
  );
}
