"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatElapsedTime, predictSalary } from "@/lib/salary";
import type { DashboardData, SpecialWage, WorkSession } from "@/lib/types";

export default function DashboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [specialWages, setSpecialWages] = useState<SpecialWage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [elapsed, setElapsed] = useState("00:00:00");
    const [predicted, setPredicted] = useState(0);
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

    useEffect(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        const session = data?.active_session;
        if (!session?.actual_start_at || !user) {
            return;
        }

        const startedAt = new Date(session.actual_start_at);

        function tick() {
            const now = new Date();
            const seconds = Math.max(0, (now.getTime() - startedAt.getTime()) / 1000);
            setElapsed(formatElapsedTime(seconds));
            if (user) {
                setPredicted(predictSalary(startedAt, now, user, specialWages));
            }
        }

        tick();
        timerRef.current = setInterval(tick, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [data?.active_session, specialWages, user]);

    async function handleClockIn() {
        setSubmitting(true);
        setError(null);
        try {
            await apiFetch("/api/work-sessions", { method: "POST" });
            await loadDashboard();
        } catch (e) {
            setError(e instanceof ApiError ? e.errors?.work_session?.[0] ?? e.message : "エラーが発生しました");
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
            setError(e instanceof ApiError ? e.errors?.work_session?.[0] ?? e.message : "エラーが発生しました");
        } finally {
            setSubmitting(false);
        }
    }

    if (!data) {
        return null;
    }

    const activeSession = data.active_session;

    return (
        <div className="py-8">
            <header className="bg-white shadow px-4 py-4">
                <h2 className="font-semibold text-xl text-gray-800">ホーム</h2>
            </header>

            <div className="px-4 pt-8 space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>
                )}

                <div className="bg-white overflow-hidden shadow-sm rounded-lg p-6 text-center">
                    {activeSession ? (
                        <>
                            <p className="text-sm text-gray-500">勤務中</p>
                            <p className="text-4xl font-bold text-gray-900 mt-2">{elapsed}</p>

                            <p className="text-sm text-gray-500 mt-6">現在の予測給与</p>
                            <p className="text-3xl font-bold text-indigo-600 mt-1">
                                {predicted.toLocaleString("ja-JP")}円
                            </p>

                            <button
                                onClick={() => handleClockOut(activeSession)}
                                disabled={submitting}
                                className="mt-8 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg disabled:opacity-60"
                            >
                                退勤する
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-gray-500">今日の給与</p>
                            <p className="text-4xl font-bold text-gray-900 mt-2">
                                {data.today_earned_amount.toLocaleString("ja-JP")}円
                            </p>

                            <button
                                onClick={handleClockIn}
                                disabled={submitting}
                                className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg disabled:opacity-60"
                            >
                                出勤する
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
