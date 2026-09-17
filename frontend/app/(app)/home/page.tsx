"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatElapsedTime, predictSalary } from "@/lib/salary";
import type { DashboardData, SpecialWage, WorkSession } from "@/lib/types";

const RING_RADIUS = 170;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const FALLBACK_SHIFT_SECONDS = 8 * 60 * 60;

function isWithinShift(
    shift: Pick<WorkSession, "scheduled_start_at" | "scheduled_end_at"> | null,
    now: Date,
): boolean {
    if (!shift?.scheduled_start_at || !shift?.scheduled_end_at) {
        return false;
    }
    const start = new Date(shift.scheduled_start_at);
    const end = new Date(shift.scheduled_end_at);
    return now >= start && now < end;
}

function formatShiftRange(shift: Pick<WorkSession, "scheduled_start_at" | "scheduled_end_at">): string {
    const start = new Date(shift.scheduled_start_at!);
    const end = new Date(shift.scheduled_end_at!);
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateLabel = `${start.getMonth() + 1}/${start.getDate()}`;
    return `${dateLabel} ${pad(start.getHours())}:${pad(start.getMinutes())} ~ ${pad(end.getHours())}:${pad(end.getMinutes())}`;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [specialWages, setSpecialWages] = useState<SpecialWage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [now, setNow] = useState(new Date());

    const [isPaused, setIsPaused] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [predicted, setPredicted] = useState(0);

    const runStartRef = useRef<Date | null>(null);
    const elapsedOffsetRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const loadDashboard = useCallback(async () => {
        const dashboard = await apiFetch<DashboardData>("/api/dashboard");
        setData(dashboard);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 初回マウント時にホーム画面のデータを取得する
        loadDashboard();
        apiFetch<{ special_wages: SpecialWage[] }>("/api/settings").then((res) =>
            setSpecialWages(res.special_wages),
        );
    }, [loadDashboard]);

    // 出勤予定時刻に応じたステータス表示を切り替えるための時刻更新
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 30_000);
        return () => clearInterval(id);
    }, []);

    const activeSession = data?.active_session ?? null;

    // 出勤中セッションが変わったらタイマー状態を初期化する
    useEffect(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 出勤中セッションの切り替わりに合わせてタイマー状態を初期化する
        setIsPaused(false);
        elapsedOffsetRef.current = 0;

        if (!activeSession?.actual_start_at) {
            runStartRef.current = null;
            setElapsedSeconds(0);
            setPredicted(0);
            return;
        }

        runStartRef.current = new Date(activeSession.actual_start_at);
    }, [activeSession?.id, activeSession?.actual_start_at]);

    // タイマーの進行(一時停止中は止める)
    useEffect(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (!activeSession || !runStartRef.current || isPaused || !user) {
            return;
        }

        function tick() {
            const now = new Date();
            const runStart = runStartRef.current;
            if (!runStart) {
                return;
            }
            const seconds = elapsedOffsetRef.current + Math.max(0, (now.getTime() - runStart.getTime()) / 1000);
            setElapsedSeconds(seconds);
            if (user && activeSession?.actual_start_at) {
                setPredicted(predictSalary(new Date(activeSession.actual_start_at), now, user, specialWages));
            }
        }

        tick();
        timerRef.current = setInterval(tick, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [activeSession, isPaused, specialWages, user]);

    function togglePause() {
        if (!runStartRef.current) {
            return;
        }

        if (isPaused) {
            runStartRef.current = new Date();
            setIsPaused(false);
        } else {
            const now = new Date();
            elapsedOffsetRef.current += Math.max(0, (now.getTime() - runStartRef.current.getTime()) / 1000);
            setIsPaused(true);
        }
    }

    async function handleClockIn() {
        setSubmitting(true);
        setError(null);
        try {
            await apiFetch("/api/work-sessions", { method: "POST" });
            await loadDashboard();
        } catch (e) {
            setError(e instanceof ApiError ? (e.errors?.work_session?.[0] ?? e.message) : "エラーが発生しました");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleClockOut(session: WorkSession) {
        setSubmitting(true);
        setError(null);
        try {
            await apiFetch(`/api/work-sessions/${session.id}`, { method: "PATCH" });
            await loadDashboard();
        } catch (e) {
            setError(e instanceof ApiError ? (e.errors?.work_session?.[0] ?? e.message) : "エラーが発生しました");
        } finally {
            setSubmitting(false);
        }
    }

    if (!data) {
        return null;
    }

    const shiftSeconds = (() => {
        if (activeSession?.scheduled_start_at && activeSession?.scheduled_end_at) {
            const diff =
                (new Date(activeSession.scheduled_end_at).getTime() -
                    new Date(activeSession.scheduled_start_at).getTime()) /
                1000;
            return diff > 0 ? diff : FALLBACK_SHIFT_SECONDS;
        }
        return FALLBACK_SHIFT_SECONDS;
    })();

    const totalRatio = activeSession ? elapsedSeconds / shiftSeconds : 0;
    const hasLapped = totalRatio > 1;
    // 100%を超えたら周回分を差し引いた「今週目」の進捗だけを描画し、
    // 満周の土台リングに重ねてApple Watchのアクティビティリングのような重なりを表現する。
    const currentLapRatio = hasLapped ? totalRatio % 1 || 1 : Math.min(1, totalRatio);
    const dashOffset = RING_CIRCUMFERENCE * (1 - currentLapRatio);

    const amountText = activeSession ? predicted : 0;
    const timeText = activeSession ? formatElapsedTime(elapsedSeconds) : "00:00:00";

    const statusText = activeSession
        ? isWithinShift(activeSession, now)
            ? `出勤中 ${formatShiftRange(activeSession)}`
            : "出勤中"
        : data.todays_shift
          ? isWithinShift(data.todays_shift, now)
              ? `出勤時刻です ${formatShiftRange(data.todays_shift)}`
              : `次の出勤 ${formatShiftRange(data.todays_shift)}`
          : null;

    const showProgressRing = Boolean(activeSession) && isWithinShift(activeSession, now);

    return (
        <div className="min-h-screen bg-white py-12 flex flex-col items-center gap-6">
            <p className="text-sm text-[#898989] text-center px-4 min-h-5">{statusText}</p>

            {error && (
                <div className="mx-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
            )}

            <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="relative w-[380px] h-[380px] flex items-center justify-center">
                {showProgressRing ? (
                    <svg viewBox="0 0 380 380" className="absolute inset-0 -rotate-90">
                        <defs>
                            <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#DF4400" />
                                <stop offset="100%" stopColor="#FFD17F" />
                            </linearGradient>
                            <filter id="ring-overlap-shadow" x="-50%" y="-50%" width="200%" height="200%">
                                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#000000" floodOpacity="0.35" />
                            </filter>
                        </defs>

                        {hasLapped && (
                            <circle
                                cx="190"
                                cy="190"
                                r={RING_RADIUS}
                                fill="none"
                                stroke="url(#ring-gradient)"
                                strokeWidth="20"
                            />
                        )}

                        <circle
                            cx="190"
                            cy="190"
                            r={RING_RADIUS}
                            fill="none"
                            stroke="url(#ring-gradient)"
                            strokeWidth="20"
                            strokeLinecap="round"
                            strokeDasharray={RING_CIRCUMFERENCE}
                            strokeDashoffset={dashOffset}
                            filter={hasLapped ? "url(#ring-overlap-shadow)" : undefined}
                        />
                    </svg>
                ) : (
                    <svg viewBox="0 0 380 380" className="absolute inset-0">
                        <circle cx="190" cy="190" r={RING_RADIUS} fill="none" stroke="#ECECEC" strokeWidth="20" />
                    </svg>
                )}

                <div className="flex flex-col items-center gap-2">
                    <p className="text-[40px] font-medium text-[#898989] leading-tight">
                        ¥{amountText.toLocaleString("ja-JP")}
                    </p>
                    <p className="text-2xl text-[#898989]">{timeText}</p>
                </div>
            </div>

            <div className="w-[300px] flex items-center justify-between">
                {activeSession ? (
                    <>
                        <button
                            onClick={() => handleClockOut(activeSession)}
                            disabled={submitting}
                            className="h-14 w-14 rounded-full bg-[#EBEBEB] flex items-center justify-center text-sm font-medium text-[#898989] disabled:opacity-60"
                        >
                            終了
                        </button>
                        <button
                            onClick={togglePause}
                            className="h-14 w-14 rounded-full bg-[#EBEBEB] flex items-center justify-center text-[#898989]"
                        >
                            {isPaused ? (
                                <Play className="h-6 w-6" strokeWidth={2} />
                            ) : (
                                <Pause className="h-6 w-6" strokeWidth={2} />
                            )}
                        </button>
                    </>
                ) : (
                    <div className="w-full flex justify-end">
                        <button
                            onClick={handleClockIn}
                            disabled={submitting}
                            className="h-14 w-14 rounded-full bg-[#EBEBEB] flex items-center justify-center text-[#898989] disabled:opacity-60"
                        >
                            <Play className="h-6 w-6" strokeWidth={2} />
                        </button>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
}
