// app/layout.tsx
import { TooltipProvider } from "@/components/ui/tooltip"; 
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "next-themes";


// Import your new setup component
import { CapacitorSetup } from "@/components/CapacitorSetup"; 

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ella Ai",
  description: "Learn english language in the best way",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
    suppressHydrationWarning
      lang="en"
      className={cn(
        "h-full antialiased",
        geistSans.variable,
        geistMono.variable,
        inter.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full" suppressHydrationWarning>
        {/* Mount the client-side Capacitor logic here */}
        <CapacitorSetup /> 
        
        {/* The TooltipProvider wraps the whole app, but the Sidebar is gone! */}
        <TooltipProvider>
           <ThemeProvider attribute="class"
          defaultTheme="light"        
          enableSystem={false}       
          enableColorScheme={false}>
          {children}
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}