"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, CalendarDays, Settings } from "lucide-react";

const TABS = [
    { href: "/home", icon: House },
    { href: "/calendar", icon: CalendarDays },
    { href: "/settings", icon: Settings },
];

export function BottomNavigation() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 inset-x-0 z-40">
            <div className="max-w-md mx-auto bg-white border-t border-[#D6D6D6] pb-[env(safe-area-inset-bottom)]">
                <div className="flex items-center justify-between px-10 h-14">
                    {TABS.map(({ href, icon: Icon }) => {
                        const active = pathname === href || pathname.startsWith(`${href}/`);

                        return (
                            <Link
                                key={href}
                                href={href}
                                className="flex items-center justify-center h-7 w-7"
                                aria-label={href}
                            >
                                <Icon
                                    className="h-7 w-7"
                                    color={active ? "#FF7F50" : "#898989"}
                                    strokeWidth={2}
                                />
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
