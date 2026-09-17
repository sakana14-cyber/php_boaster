"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BottomNavigation } from "@/components/BottomNavigation";

export default function AppLayout({ children }: { children: ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace("/login");
        }
    }, [isLoading, user, router]);

    if (isLoading || !user) {
        return null;
    }

    return (
        <div className="min-h-screen max-w-md mx-auto bg-white pb-20 shadow-xl">
            {children}
            <BottomNavigation />
        </div>
    );
}
