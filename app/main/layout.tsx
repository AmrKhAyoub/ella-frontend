import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { BackgroundTrackingInitializer } from "@/components/LocationInitializer";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb"; // your new component

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <DynamicBreadcrumb />
          </div>
          <div className="px-4">
            <ThemeToggle />
          </div>
        </header>

        <BackgroundTrackingInitializer />

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
          <Toaster position="bottom-right" richColors />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}