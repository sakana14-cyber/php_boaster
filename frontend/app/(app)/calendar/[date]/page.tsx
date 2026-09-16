"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { CalendarShowData } from "@/lib/types";

export default function CalendarDayPage({ params }: PageProps<"/calendar/[date]">) {
    const { date } = use(params);
    const router = useRouter();
    const [data, setData] = useState<CalendarShowData | null>(null);

    const load = useCallback(async () => {
        const result = await apiFetch<CalendarShowData>(`/api/calendar/${date}`);
        setData(result);
    }, [date]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 初回マウント時に日別明細を取得する
        load();
    }, [load]);

    async function handleDelete(id: number) {
        if (!confirm("この勤務記録を削除しますか?")) {
            return;
        }
        await apiFetch(`/api/work-sessions/${id}`, { method: "DELETE" });
        await load();
    }

    if (!data) {
        return null;
    }

    const [year, month] = date.split("-");

    function formatTime(iso: string | null): string {
        if (!iso) {
            return "—";
        }
        return new Date(iso).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    }

    return (
        <div className="py-8">
            <header className="bg-white shadow px-4 py-4">
                <h2 className="font-semibold text-xl text-gray-800">{date} の勤務明細</h2>
            </header>

            <div className="px-4 pt-8 space-y-6">
                <Link href={`/calendar?year=${year}&month=${Number(month)}`} className="text-indigo-600 hover:underline text-sm">
                    « カレンダーに戻る
                </Link>

                {data.sessions.length === 0 && (
                    <div className="bg-white shadow rounded-lg p-6 text-gray-600">この日の勤務記録はありません。</div>
                )}

                {data.sessions.map((session) => (
                    <div key={session.id} className="bg-white shadow rounded-lg p-6">
                        <dl className="grid grid-cols-2 gap-4">
                            <div>
                                <dt className="text-sm text-gray-500">出勤時刻</dt>
                                <dd className="text-gray-900">{formatTime(session.actual_start_at)}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-500">退勤時刻</dt>
                                <dd className="text-gray-900">
                                    {session.actual_end_at ? formatTime(session.actual_end_at) : "勤務中"}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-500">給与</dt>
                                <dd className="text-gray-900 font-semibold">
                                    {session.earned_amount !== null
                                        ? `${session.earned_amount.toLocaleString("ja-JP")}円`
                                        : "未確定"}
                                </dd>
                            </div>
                        </dl>

                        <div className="mt-6 flex items-center gap-4">
                            <button
                                onClick={() => router.push(`/work-sessions/${session.id}/edit`)}
                                className="text-sm text-indigo-600 hover:underline"
                            >
                                編集
                            </button>
                            <button onClick={() => handleDelete(session.id)} className="text-sm text-red-600 hover:underline">
                                削除
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
