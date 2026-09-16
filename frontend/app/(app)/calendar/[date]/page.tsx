"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import type { CalendarShowData, WorkSession } from "@/lib/types";

function formatTime(iso: string | null): string {
    if (!iso) {
        return "—";
    }
    return new Date(iso).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

function toLocalInputValue(iso: string | null, fallbackDate: string, fallbackTime: string): string {
    if (!iso) {
        return `${fallbackDate}T${fallbackTime}`;
    }
    const date = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CalendarDayPage({ params }: PageProps<"/calendar/[date]">) {
    const { date } = use(params);
    const router = useRouter();
    const [data, setData] = useState<CalendarShowData | null>(null);
    const [shiftForm, setShiftForm] = useState<{ start: string; end: string } | null>(null);
    const [shiftErrors, setShiftErrors] = useState<Record<string, string[]>>({});

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

    function openShiftForm(shift?: WorkSession) {
        setShiftErrors({});
        setShiftForm({
            start: toLocalInputValue(shift?.scheduled_start_at ?? null, date, "09:00"),
            end: toLocalInputValue(shift?.scheduled_end_at ?? null, date, "17:00"),
        });
    }

    async function handleShiftSubmit(event: FormEvent<HTMLFormElement>, existing?: WorkSession) {
        event.preventDefault();
        if (!shiftForm) {
            return;
        }
        setShiftErrors({});

        const body = { scheduled_start_at: shiftForm.start, scheduled_end_at: shiftForm.end };

        try {
            if (existing) {
                await apiFetch(`/api/shifts/${existing.id}`, { method: "PATCH", body });
            } else {
                await apiFetch("/api/shifts", { method: "POST", body });
            }
            setShiftForm(null);
            await load();
        } catch (error) {
            if (error instanceof ApiError && error.errors) {
                setShiftErrors(error.errors);
            }
        }
    }

    if (!data) {
        return null;
    }

    const [year, month] = date.split("-");
    const pendingShift = data.sessions.find((s) => !s.actual_start_at);
    const workedSessions = data.sessions.filter((s) => s.actual_start_at);

    return (
        <div className="py-8">
            <header className="bg-white shadow px-4 py-4">
                <h2 className="font-semibold text-xl text-gray-800">{date} の勤務明細</h2>
            </header>

            <div className="px-4 pt-8 space-y-6">
                <Link href={`/calendar?year=${year}&month=${Number(month)}`} className="text-indigo-600 hover:underline text-sm">
                    « カレンダーに戻る
                </Link>

                {workedSessions.length === 0 && !pendingShift && (
                    <div className="bg-white shadow rounded-lg p-6 text-gray-600">この日の勤務記録はありません。</div>
                )}

                {workedSessions.map((session) => (
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

                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">シフト予定</h3>

                    {pendingShift ? (
                        <div className="flex items-center justify-between">
                            <p className="text-gray-900">
                                {formatTime(pendingShift.scheduled_start_at)}〜{formatTime(pendingShift.scheduled_end_at)}
                            </p>
                            <button
                                onClick={() => openShiftForm(pendingShift)}
                                className="text-sm text-indigo-600 hover:underline"
                            >
                                編集
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => openShiftForm()}
                            className="text-sm text-indigo-600 hover:underline"
                        >
                            + シフトを追加
                        </button>
                    )}

                    {shiftForm && (
                        <form onSubmit={(e) => handleShiftSubmit(e, pendingShift)} className="mt-4 space-y-4">
                            <div>
                                <label className="block font-medium text-sm text-gray-700">出勤予定時刻</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={shiftForm.start}
                                    onChange={(e) => setShiftForm({ ...shiftForm, start: e.target.value })}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                />
                                {shiftErrors.scheduled_start_at && (
                                    <p className="mt-1 text-sm text-red-600">{shiftErrors.scheduled_start_at[0]}</p>
                                )}
                            </div>
                            <div>
                                <label className="block font-medium text-sm text-gray-700">退勤予定時刻</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={shiftForm.end}
                                    onChange={(e) => setShiftForm({ ...shiftForm, end: e.target.value })}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                />
                                {shiftErrors.scheduled_end_at && (
                                    <p className="mt-1 text-sm text-red-600">{shiftErrors.scheduled_end_at[0]}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    type="submit"
                                    className="inline-flex items-center px-4 py-2 bg-gray-800 text-white text-xs font-semibold uppercase tracking-widest rounded-md"
                                >
                                    保存
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShiftForm(null)}
                                    className="text-sm text-gray-500 hover:underline"
                                >
                                    キャンセル
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
