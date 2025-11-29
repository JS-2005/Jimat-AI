"use client";

import Link from "next/link";
import { LayoutDashboard, Zap, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLayout } from "@/contexts/LayoutContext";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Zap, label: "Predict", href: "/predict" },
];

export function Sidebar() {
  const { logout } = useAuth();
  const { isMobileMenuOpen, closeMobileMenu } = useLayout();

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      <aside className={`
        flex flex-col w-64 bg-white border-r border-gray-200 fixed left-0 top-16 z-40 transition-transform duration-300 ease-in-out
        h-[calc(100vh-4rem)]
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>


        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={closeMobileMenu}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="flex items-center gap-3 px-4 py-3 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-primary transition-colors group"
            >
              <item.icon className="w-5 h-5 group-hover:text-primary transition-colors" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">

          <button
            onClick={() => {
              logout();
              closeMobileMenu();
            }}
            className="flex items-center gap-3 px-4 py-3 text-red-500 rounded-lg hover:bg-red-50 cursor-pointer w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
