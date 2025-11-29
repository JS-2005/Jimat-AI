"use client";

import Image from "next/image";
import { Menu } from "lucide-react";
import { useLayout } from "@/contexts/LayoutContext";





import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export function Navbar() {
    const { user } = useAuth();
    const { toggleMobileMenu } = useLayout();


    const currentDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
    });

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50 w-full">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMobileMenu}>
                    <Menu className="h-6 w-6" />
                </Button>
                <Image src="/JimatAI.svg" alt="Jimat AI Logo" width={32} height={32} />
                <h1 className="text-xl font-bold text-primary hidden sm:block">Jimat AI</h1>
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden md:block text-sm text-gray-500 font-medium">
                    {currentDate}
                </div>

                <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

                <Link href="/profile" className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-900">{user?.displayName || "Guest User"}</p>
                        <p className="text-xs text-gray-500">Guest</p>
                    </div>
                    <Avatar>
                        <AvatarImage src={user?.photoURL || ""} />
                        <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                </Link>
            </div>
        </header>
    );
}
