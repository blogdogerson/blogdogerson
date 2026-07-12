import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/portal/Header";
import { Footer } from "@/components/portal/Footer";

export const Route = createFileRoute("/_portal")({
  component: PortalLayout,
});

function PortalLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
