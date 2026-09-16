"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { CalendarIndexData, CalendarShowData } from "@/lib/types";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

type RecentShift = { start_time: string; end_time: string };

function formatTime(iso: string | null): string {
    if (!iso) {
        return "—";
    }
    return new Date(iso).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

export default function CalendarPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const now = new Date();
    const year = Number(searchParams.get("year") ?? now.getFullYear());
    const month = Number(searchParams.get("month") ?? now.getMonth() + 1);

    const [data, setData] = useState<CalendarIndexData | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [dayDetail, setDayDetail] = useState<CalendarShowData | null>(null);
    const [showAddPanel, setShowAddPanel] = useState(false);
    const [showManualForm, setShowManualForm] = useState(false);
    const [recentShifts, setRecentShifts] = useState<RecentShift[]>([]);
    const [manualForm, setManualForm] = useState({ start: "09:00", end: "17:00" });
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    useEffect(() => {
        apiFetch<CalendarIndexData>(`/api/calendar?year=${year}&month=${month}`).then(setData);
    }, [year, month]);

    useEffect(() => {
        apiFetch<{ shifts: RecentShift[] }>("/api/shifts/recent").then((res) => setRecentShifts(res.shifts));
    }, []);

    const loadDayDetail = useCallback(async (date: string) => {
        const result = await apiFetch<CalendarShowData>(`/api/calendar/${date}`);
        setDayDetail(result);
    }, []);

    useEffect(() => {
        if (!selectedDate) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- 選択解除時に明細を空にする
            setDayDetail(null);
            return;
        }
        loadDayDetail(selectedDate);
        setShowAddPanel(false);
        setShowManualForm(false);
        setErrors({});
    }, [selectedDate, loadDayDetail]);

    async function refreshAll() {
        const [monthData] = await Promise.all([
            apiFetch<CalendarIndexData>(`/api/calendar?year=${year}&month=${month}`),
            selectedDate ? loadDayDetail(selectedDate) : Promise.resolve(),
        ]);
        setData(monthData);
    }

    async function handleAddFromHistory(shift: RecentShift) {
        if (!selectedDate) {
            return;
        }
        await apiFetch("/api/shifts", {
            method: "POST",
            body: {
                scheduled_start_at: `${selectedDate}T${shift.start_time}`,
                scheduled_end_at: `${selectedDate}T${shift.end_time}`,
            },
        });
        setShowAddPanel(false);
        await refreshAll();
    }

    async function handleManualSubmit() {
        if (!selectedDate) {
            return;
        }
        setErrors({});
        try {
            await apiFetch("/api/shifts", {
                method: "POST",
                body: {
                    scheduled_start_at: `${selectedDate}T${manualForm.start}`,
                    scheduled_end_at: `${selectedDate}T${manualForm.end}`,
                },
            });
            setShowAddPanel(false);
            setShowManualForm(false);
            await refreshAll();
        } catch {
            setErrors({ scheduled_end_at: ["開始・終了時刻を確認してください"] });
        }
    }

    async function handleDeleteSession(id: number) {
        if (!confirm("この記録を削除しますか?")) {
            return;
        }
        await apiFetch(`/api/work-sessions/${id}`, { method: "DELETE" });
        await refreshAll();
    }

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

    const selectedDateLabel = selectedDate
        ? (() => {
              const d = new Date(`${selectedDate}T00:00:00`);
              return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${WEEKDAY_LABELS[d.getDay()]})`;
          })()
        : null;

    return (
        <div className="py-8">
            <header className="bg-white shadow px-4 py-4">
                <h2 className="font-semibold text-xl text-gray-800">カレンダー</h2>
            </header>

            <div className="px-4 pt-8 space-y-4">
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
                            const hasShift = data.shift_days.includes(dateString);
                            const isSelected = dateString === selectedDate;

                            return (
                                <button
                                    key={dateString}
                                    onClick={() => setSelectedDate(dateString)}
                                    className={`relative aspect-square border rounded-md p-1 flex flex-col items-center justify-center hover:bg-gray-50 ${
                                        isSelected
                                            ? "border-indigo-500 ring-1 ring-indigo-500"
                                            : total
                                              ? "border-indigo-300 bg-indigo-50"
                                              : "border-gray-100"
                                    }`}
                                >
                                    {hasShift && (
                                        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-orange-400" />
                                    )}
                                    <span className="text-sm text-gray-700">{day}</span>
                                    {total && (
                                        <span className="text-[10px] text-indigo-600 font-semibold">
                                            {total.earned_amount.toLocaleString("ja-JP")}円
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {selectedDate && (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-500 bg-gray-100 rounded-md px-3 py-2">{selectedDateLabel}</p>

                        {dayDetail?.sessions.map((session) => (
                            <div key={session.id} className="bg-white shadow rounded-lg p-4">
                                {session.actual_start_at ? (
                                    <dl className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <dt className="text-gray-500">出勤</dt>
                                            <dd className="text-gray-900">{formatTime(session.actual_start_at)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-gray-500">退勤</dt>
                                            <dd className="text-gray-900">
                                                {session.actual_end_at ? formatTime(session.actual_end_at) : "勤務中"}
                                            </dd>
                                        </div>
                                        <div className="col-span-2">
                                            <dt className="text-gray-500">給与</dt>
                                            <dd className="text-gray-900 font-semibold">
                                                {session.earned_amount !== null
                                                    ? `${session.earned_amount.toLocaleString("ja-JP")}円`
                                                    : "未確定"}
                                            </dd>
                                        </div>
                                    </dl>
                                ) : (
                                    <p className="text-sm text-gray-900">
                                        シフト予定 {formatTime(session.scheduled_start_at)}〜
                                        {formatTime(session.scheduled_end_at)}
                                    </p>
                                )}
                                <div className="mt-3 flex items-center gap-4">
                                    <button
                                        onClick={() => router.push(`/work-sessions/${session.id}/edit`)}
                                        className="text-xs text-indigo-600 hover:underline"
                                    >
                                        編集
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSession(session.id)}
                                        className="text-xs text-red-600 hover:underline"
                                    >
                                        削除
                                    </button>
                                </div>
                            </div>
                        ))}

                        {!showAddPanel && (
                            <button
                                onClick={() => setShowAddPanel(true)}
                                className="w-full border border-dashed border-green-500 text-green-600 text-sm font-medium rounded-lg py-3"
                            >
                                + シフトを追加
                            </button>
                        )}

                        {showAddPanel && (
                            <div className="bg-white shadow rounded-lg p-4 space-y-4">
                                <p className="text-sm font-medium text-gray-700">
                                    {selectedDateLabel} にシフト追加
                                </p>

                                {recentShifts.length > 0 && !showManualForm && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-500">履歴から追加</p>
                                        {recentShifts.map((shift, index) => (
                                            <button
                                                key={`${shift.start_time}-${shift.end_time}-${index}`}
                                                onClick={() => handleAddFromHistory(shift)}
                                                className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 text-sm hover:bg-gray-50"
                                            >
                                                <span>
                                                    {shift.start_time} - {shift.end_time}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {!showManualForm ? (
                                    <button
                                        onClick={() => setShowManualForm(true)}
                                        className="w-full bg-green-600 text-white text-sm font-semibold rounded-lg py-3"
                                    >
                                        新規にシフトを入力する
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">出勤予定時刻</label>
                                            <input
                                                type="time"
                                                value={manualForm.start}
                                                onChange={(e) =>
                                                    setManualForm({ ...manualForm, start: e.target.value })
                                                }
                                                className="block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">退勤予定時刻</label>
                                            <input
                                                type="time"
                                                value={manualForm.end}
                                                onChange={(e) =>
                                                    setManualForm({ ...manualForm, end: e.target.value })
                                                }
                                                className="block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                            />
                                        </div>
                                        {errors.scheduled_end_at && (
                                            <p className="text-xs text-red-600">{errors.scheduled_end_at[0]}</p>
                                        )}
                                        <button
                                            onClick={handleManualSubmit}
                                            className="w-full bg-green-600 text-white text-sm font-semibold rounded-lg py-3"
                                        >
                                            保存
                                        </button>
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        setShowAddPanel(false);
                                        setShowManualForm(false);
                                    }}
                                    className="w-full text-xs text-gray-500"
                                >
                                    キャンセル
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
