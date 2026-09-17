"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import type { WorkSession } from "@/lib/types";

function toLocalInputValue(iso: string | null): string {
    if (!iso) {
        return "";
    }
    const date = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function WorkSessionEditPage({ params }: PageProps<"/work-sessions/[id]/edit">) {
    const { id } = use(params);
    const router = useRouter();
    const [actualStartAt, setActualStartAt] = useState("");
    const [actualEndAt, setActualEndAt] = useState("");
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        apiFetch<{ work_session: WorkSession }>(`/api/work-sessions/${id}`).then((data) => {
            setActualStartAt(toLocalInputValue(data.work_session.actual_start_at));
            setActualEndAt(toLocalInputValue(data.work_session.actual_end_at));
            setLoaded(true);
        });
    }, [id]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrors({});

        try {
            const data = await apiFetch<{ work_session: WorkSession }>(`/api/work-sessions/${id}`, {
                method: "PUT",
                body: { actual_start_at: actualStartAt, actual_end_at: actualEndAt },
            });
            const date = data.work_session.actual_start_at
                ? new Date(data.work_session.actual_start_at)
                : null;
            router.push(date ? `/calendar?year=${date.getFullYear()}&month=${date.getMonth() + 1}` : "/calendar");
        } catch (error) {
            if (error instanceof ApiError && error.errors) {
                setErrors(error.errors);
            }
        }
    }

    if (!loaded) {
        return null;
    }

    return (
        <div className="min-h-screen py-8">
            <header className="bg-white shadow px-4 py-4">
                <h2 className="font-semibold text-xl text-gray-800">勤務記録の編集</h2>
            </header>

            <div className="px-4 pt-8">
                <div className="bg-white shadow rounded-lg p-4">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block font-medium text-sm text-gray-700">出勤時刻</label>
                            <input
                                type="datetime-local"
                                required
                                value={actualStartAt}
                                onChange={(e) => setActualStartAt(e.target.value)}
                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                            />
                            {errors.actual_start_at && (
                                <p className="mt-2 text-sm text-red-600">{errors.actual_start_at[0]}</p>
                            )}
                        </div>

                        <div>
                            <label className="block font-medium text-sm text-gray-700">退勤時刻</label>
                            <input
                                type="datetime-local"
                                required
                                value={actualEndAt}
                                onChange={(e) => setActualEndAt(e.target.value)}
                                className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                            />
                            {errors.actual_end_at && (
                                <p className="mt-2 text-sm text-red-600">{errors.actual_end_at[0]}</p>
                            )}
                        </div>

                        <p className="text-sm text-gray-500">
                            保存すると、修正後の時刻を元に給与が自動的に再計算されます。
                        </p>

                        <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 bg-gray-800 text-white text-xs font-semibold uppercase tracking-widest rounded-md"
                        >
                            保存
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
