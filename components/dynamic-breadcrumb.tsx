"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeMap: Record<string, string> = {
  dashboard: "Dashboard",
  chat: "Chat",
  game: "Game",
  vocabulary: "Vocabulary",
  // add more as needed
};

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const items = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = routeMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === segments.length - 1;
    return { href, label, isLast };
  });

  // Always include a home item
  const home = { href: "/", label: "Ella Ai", isLast: items.length === 0 };
  const allItems = [home, ...items];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {allItems.map((item, index) => (
          // Render the item
          <BreadcrumbItem key={`item-${index}`} className={index === 0 ? "hidden md:block" : ""}>
            {item.isLast ? (
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
            )}
          </BreadcrumbItem>
        ))}
        {allItems.map((_, index) => {
          // Render separators **between** items (not after the last one)
          if (index < allItems.length - 1) {
            return (
              <BreadcrumbSeparator
                key={`sep-${index}`}
                className="hidden md:block"
              />
            );
          }
          return null;
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}