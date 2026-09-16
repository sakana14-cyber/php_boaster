"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { CalendarIndexData } from "@/lib/types";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function CalendarPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const now = new Date();
    const year = Number(searchParams.get("year") ?? now.getFullYear());
    const month = Number(searchParams.get("month") ?? now.getMonth() + 1);

    const [data, setData] = useState<CalendarIndexData | null>(null);

    useEffect(() => {
        apiFetch<CalendarIndexData>(`/api/calendar?year=${year}&month=${month}`).then(setData);
    }, [year, month]);

    if (!data) {
        return null;
    }

    const firstOfMonth = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstWeekday = firstOfMonth.getDay();

    const prev = new Date(year, month - 2, 1);
    const next = new Date(year, month, 1);

    const workedHours = Math.floor(data.monthly_worked_seconds / 3600);
    const workedMinutes = Math.floor((data.monthly_worked_seconds % 3600) / 60);

    const cells: (number | null)[] = [
        ...Array.from({ length: firstWeekday }, () => null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    return (
        <div className="py-8">
            <header className="bg-white shadow px-4 py-4">
                <h2 className="font-semibold text-xl text-gray-800">カレンダー</h2>
            </header>

            <div className="px-4 pt-8 space-y-6">
                <div className="bg-white shadow rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() =>
                                router.push(`/calendar?year=${prev.getFullYear()}&month=${prev.getMonth() + 1}`)
                            }
                            className="text-indigo-600 hover:underline"
                        >
                            « 前月
                        </button>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {year}年{month}月
                        </h3>
                        <button
                            onClick={() =>
                                router.push(`/calendar?year=${next.getFullYear()}&month=${next.getMonth() + 1}`)
                            }
                            className="text-indigo-600 hover:underline"
                        >
                            翌月 »
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                        <div>
                            <p className="text-sm text-gray-500">月間給与</p>
                            <p className="text-xl font-bold text-gray-900">
                                {data.monthly_earned_amount.toLocaleString("ja-JP")}円
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">月間勤務時間</p>
                            <p className="text-xl font-bold text-gray-900">
                                {workedHours}時間{workedMinutes}分
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">月間勤務日数</p>
                            <p className="text-xl font-bold text-gray-900">{data.monthly_worked_days}日</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-1">
                        {WEEKDAY_LABELS.map((label) => (
                            <div key={label}>{label}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {cells.map((day, index) => {
                            if (day === null) {
                                return <div key={`blank-${index}`} />;
                            }

                            const dateString = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                            const total = data.daily_totals[dateString];

                            return (
                                <Link
                                    key={dateString}
                                    href={`/calendar/${dateString}`}
                                    className={`aspect-square border rounded-md p-1 flex flex-col items-center justify-center hover:bg-gray-50 ${
                                        total ? "border-indigo-300 bg-indigo-50" : "border-gray-100"
                                    }`}
                                >
                                    <span className="text-sm text-gray-700">{day}</span>
                                    {total && (
                                        <span className="text-[10px] text-indigo-600 font-semibold">
                                            {total.earned_amount.toLocaleString("ja-JP")}円
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
