import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ChatWidget } from "@/components/ChatWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jimat AI",
  description: "A dashboard for household energy consumption",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50/50 min-h-screen`} suppressHydrationWarning={true}>
        <AuthProvider>
          <AuthGuard>
            <LayoutProvider>
              <DashboardProvider>
                <div className="min-h-screen">
                  <div className="print:hidden">
                    <Navbar />
                  </div>
                  <div className="flex pt-16 print:pt-0">
                    <div className="print:hidden">
                      <Sidebar />
                    </div>
                    <main className="flex-1 ml-0 md:ml-64 print:ml-0 w-full">
                      {children}
                    </main>
                    <div className="print:hidden">
                      <ChatWidget />
                    </div>
                  </div>
                </div>
              </DashboardProvider>
            </LayoutProvider>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
