"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { predictSalary } from "@/lib/salary";
import type { CalendarIndexData, CalendarShowData, SpecialWage, WorkSession } from "@/lib/types";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

type RecentShift = { start_time: string; end_time: string };

function formatTime(iso: string | null): string {
    if (!iso) {
        return "—";
    }
    return new Date(iso).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

function toTimeInputValue(iso: string): string {
    const date = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isScheduledOnly(session: WorkSession): boolean {
    return !session.actual_start_at;
}

function canEditSession(session: WorkSession): boolean {
    return isScheduledOnly(session) || session.actual_end_at !== null;
}

function sessionBadgeLabel(session: WorkSession, now: Date): "予定" | "出勤" {
    if (!session.actual_start_at) {
        return "予定";
    }
    if (session.scheduled_end_at && now < new Date(session.scheduled_end_at)) {
        return "予定";
    }
    return "出勤";
}

export default function CalendarPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const now = new Date();
    const year = Number(searchParams.get("year") ?? now.getFullYear());
    const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
    const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const [data, setData] = useState<CalendarIndexData | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [dayDetail, setDayDetail] = useState<CalendarShowData | null>(null);
    const [showAddPanel, setShowAddPanel] = useState(false);
    const [showManualForm, setShowManualForm] = useState(false);
    const [recentShifts, setRecentShifts] = useState<RecentShift[]>([]);
    const [specialWages, setSpecialWages] = useState<SpecialWage[]>([]);
    const [manualForm, setManualForm] = useState({ start: "09:00", end: "17:00" });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [editingSession, setEditingSession] = useState<WorkSession | null>(null);
    const [editForm, setEditForm] = useState({ start: "", end: "" });
    const [editErrors, setEditErrors] = useState<Record<string, string[]>>({});

    useEffect(() => {
        apiFetch<CalendarIndexData>(`/api/calendar?year=${year}&month=${month}`).then(setData);
    }, [year, month]);

    useEffect(() => {
        apiFetch<{ shifts: RecentShift[] }>("/api/shifts/recent").then((res) => setRecentShifts(res.shifts));
    }, []);

    useEffect(() => {
        apiFetch<{ special_wages: SpecialWage[] }>("/api/settings").then((res) => setSpecialWages(res.special_wages));
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

    function openEdit(session: WorkSession) {
        const startIso = isScheduledOnly(session) ? session.scheduled_start_at : session.actual_start_at;
        const endIso = isScheduledOnly(session) ? session.scheduled_end_at : session.actual_end_at;
        setEditForm({
            start: startIso ? toTimeInputValue(startIso) : "",
            end: endIso ? toTimeInputValue(endIso) : "",
        });
        setEditErrors({});
        setEditingSession(session);
    }

    async function handleEditSubmit() {
        if (!editingSession || !selectedDate) {
            return;
        }
        setEditErrors({});

        try {
            if (isScheduledOnly(editingSession)) {
                await apiFetch(`/api/shifts/${editingSession.id}`, {
                    method: "PATCH",
                    body: {
                        scheduled_start_at: `${selectedDate}T${editForm.start}`,
                        scheduled_end_at: `${selectedDate}T${editForm.end}`,
                    },
                });
            } else {
                await apiFetch(`/api/work-sessions/${editingSession.id}`, {
                    method: "PUT",
                    body: {
                        actual_start_at: `${selectedDate}T${editForm.start}`,
                        actual_end_at: `${selectedDate}T${editForm.end}`,
                    },
                });
            }
            setEditingSession(null);
            await refreshAll();
        } catch (error) {
            if (error instanceof ApiError && error.errors) {
                setEditErrors(error.errors);
            }
        }
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
        <div className="min-h-screen py-8">
            <div className="px-4 pt-8 space-y-4">
                <div className="bg-white shadow rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() =>
                                router.push(`/calendar?year=${prev.getFullYear()}&month=${prev.getMonth() + 1}`)
                            }
                            className="text-[#FF7F50] hover:underline"
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
                            className="text-[#FF7F50] hover:underline"
                        >
                            翌月 »
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                        <div>
                            <p className="text-sm text-gray-500">給与</p>
                            <p className="text-xl font-bold text-gray-900">
                                {data.monthly_earned_amount.toLocaleString("ja-JP")}円
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">勤務時間</p>
                            <p className="text-xl font-bold text-gray-900">
                                {workedHours}時間{workedMinutes}分
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">勤務日数</p>
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
                            const isToday = dateString === todayString;

                            return (
                                <button
                                    key={dateString}
                                    onClick={() => setSelectedDate(dateString)}
                                    className={`relative aspect-square border rounded-md p-1 flex flex-col items-center justify-center hover:bg-gray-50 ${
                                        isSelected
                                            ? "border-[#FF7F50] ring-1 ring-[#FF7F50]"
                                            : isToday
                                              ? "border-gray-100"
                                              : total
                                                ? "border-[#FFD5C2] bg-[#FFF1EC]"
                                                : "border-gray-100"
                                    }`}
                                >
                                    {hasShift && (
                                        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-orange-400" />
                                    )}
                                    <span
                                        className={`text-sm ${isToday ? "text-[#FF7F50] font-semibold" : "text-gray-700"}`}
                                    >
                                        {day}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {selectedDate && (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-500 bg-gray-100 rounded-md px-3 py-2">{selectedDateLabel}</p>

                        {dayDetail?.sessions.map((session) => {
                            const badgeLabel = sessionBadgeLabel(session, now);
                            const isScheduledBadge = badgeLabel === "予定";
                            const startTime = formatTime(
                                isScheduledBadge ? session.scheduled_start_at : session.actual_start_at,
                            );
                            const endTime = formatTime(
                                isScheduledBadge ? session.scheduled_end_at : session.actual_end_at,
                            );

                            let amount: number | null = isScheduledBadge ? null : session.earned_amount;
                            if (
                                isScheduledBadge &&
                                user &&
                                session.scheduled_start_at &&
                                session.scheduled_end_at
                            ) {
                                amount = predictSalary(
                                    new Date(session.scheduled_start_at),
                                    new Date(session.scheduled_end_at),
                                    user,
                                    specialWages,
                                );
                            }

                            return (
                                <div
                                    key={session.id}
                                    className="flex items-center justify-between rounded-lg border border-[#F7F7F7] bg-white px-2 py-1 shadow-sm"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <span className="h-9 w-px bg-[#FF7F50]" />
                                            <div className="flex flex-col text-xs leading-4 text-black">
                                                <span>{startTime}</span>
                                                <span>{endTime}</span>
                                            </div>
                                        </div>
                                        <span className="text-sm font-medium text-black">
                                            {amount !== null ? `${amount.toLocaleString("ja-JP")}円` : "—"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <span
                                            className={`inline-flex w-[30px] items-center justify-center rounded border px-0.5 py-0.5 text-xs ${
                                                isScheduledBadge
                                                    ? "border-[#898989] bg-[#EFEFEF] text-[#898989]"
                                                    : "border-[#FF7F50] bg-[#FFDACC] text-[#FF7F50]"
                                            }`}
                                        >
                                            {badgeLabel}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {canEditSession(session) && (
                                                <button
                                                    onClick={() => openEdit(session)}
                                                    aria-label="編集"
                                                    className="text-[#898989]"
                                                >
                                                    <Pencil size={20} strokeWidth={1.5} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteSession(session.id)}
                                                aria-label="削除"
                                                className="text-[#898989]"
                                            >
                                                <Trash2 size={20} strokeWidth={1.5} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {!showAddPanel && (
                            <button
                                onClick={() => setShowAddPanel(true)}
                                className="w-full border border-dashed border-[#FF7F50] text-[#FF7F50] text-sm font-medium rounded-lg py-3"
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
                                        className="w-full bg-[#FF7F50] text-white text-sm font-semibold rounded-lg py-3"
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
                                                className="block w-full border-gray-300 focus:border-[#FF7F50] focus:ring-[#FF7F50] rounded-md shadow-sm"
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
                                                className="block w-full border-gray-300 focus:border-[#FF7F50] focus:ring-[#FF7F50] rounded-md shadow-sm"
                                            />
                                        </div>
                                        {errors.scheduled_end_at && (
                                            <p className="text-xs text-red-600">{errors.scheduled_end_at[0]}</p>
                                        )}
                                        <button
                                            onClick={handleManualSubmit}
                                            className="w-full bg-[#FF7F50] text-white text-sm font-semibold rounded-lg py-3"
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

            {editingSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-sm space-y-4 rounded-lg bg-white p-4 shadow-lg">
                        <p className="text-sm font-medium text-gray-700">
                            {isScheduledOnly(editingSession) ? "シフト予定を編集" : "勤務記録を編集"}
                        </p>

                        <div>
                            <label className="block text-xs text-gray-500 mb-1">
                                {isScheduledOnly(editingSession) ? "出勤予定時刻" : "出勤時刻"}
                            </label>
                            <input
                                type="time"
                                value={editForm.start}
                                onChange={(e) => setEditForm({ ...editForm, start: e.target.value })}
                                className="block w-full px-3 py-2 border-gray-300 focus:border-[#FF7F50] focus:ring-[#FF7F50] rounded-md shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">
                                {isScheduledOnly(editingSession) ? "退勤予定時刻" : "退勤時刻"}
                            </label>
                            <input
                                type="time"
                                value={editForm.end}
                                onChange={(e) => setEditForm({ ...editForm, end: e.target.value })}
                                className="block w-full px-3 py-2 border-gray-300 focus:border-[#FF7F50] focus:ring-[#FF7F50] rounded-md shadow-sm"
                            />
                        </div>

                        {(editErrors.scheduled_start_at ??
                            editErrors.scheduled_end_at ??
                            editErrors.actual_start_at ??
                            editErrors.actual_end_at) && (
                            <p className="text-xs text-red-600">
                                {
                                    (editErrors.scheduled_start_at ??
                                        editErrors.scheduled_end_at ??
                                        editErrors.actual_start_at ??
                                        editErrors.actual_end_at)?.[0]
                                }
                            </p>
                        )}

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleEditSubmit}
                                className="flex-1 bg-[#FF7F50] text-white text-sm font-semibold rounded-lg py-3"
                            >
                                保存
                            </button>
                            <button
                                onClick={() => setEditingSession(null)}
                                className="flex-1 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg py-3"
                            >
                                キャンセル
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
