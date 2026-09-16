"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { SpecialWage, User } from "@/lib/types";

export default function SettingsPage() {
    const { user, setUser, logout } = useAuth();
    const router = useRouter();
    const [specialWages, setSpecialWages] = useState<SpecialWage[]>([]);
    const emptyForm = {
        hourly_wage_default: "",
        hourly_wage_weekend_holiday: "",
        rounding_unit_shift: "",
        rounding_unit_edge: "",
    };
    const [form, setForm] = useState(emptyForm);
    const [savedForm, setSavedForm] = useState(emptyForm);
    const [isEditing, setIsEditing] = useState(false);
    const [wageForm, setWageForm] = useState({ title: "", start_time: "", end_time: "", hourly_wage: "" });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [wageErrors, setWageErrors] = useState<Record<string, string[]>>({});
    const [status, setStatus] = useState<string | null>(null);

    const load = useCallback(async () => {
        const data = await apiFetch<{ user: User; special_wages: SpecialWage[] }>("/api/settings");
        const loaded = {
            hourly_wage_default: String(data.user.hourly_wage_default),
            hourly_wage_weekend_holiday: String(data.user.hourly_wage_weekend_holiday),
            rounding_unit_shift: String(data.user.rounding_unit_shift),
            rounding_unit_edge: String(data.user.rounding_unit_edge),
        };
        setForm(loaded);
        setSavedForm(loaded);
        setSpecialWages(data.special_wages);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 初回マウント時に設定データを取得する
        load();
    }, [load]);

    function handleStartEdit() {
        setStatus(null);
        setErrors({});
        setIsEditing(true);
    }

    function handleCancelEdit() {
        setForm(savedForm);
        setErrors({});
        setStatus(null);
        setIsEditing(false);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrors({});
        setStatus(null);

        try {
            const body = {
                hourly_wage_default: Number(form.hourly_wage_default) || 0,
                hourly_wage_weekend_holiday: Number(form.hourly_wage_weekend_holiday) || 0,
                rounding_unit_shift: Number(form.rounding_unit_shift) || 0,
                rounding_unit_edge: Number(form.rounding_unit_edge) || 0,
            };
            const data = await apiFetch<{ user: User }>("/api/settings", { method: "PATCH", body });
            setUser(data.user);
            const saved = {
                hourly_wage_default: String(body.hourly_wage_default),
                hourly_wage_weekend_holiday: String(body.hourly_wage_weekend_holiday),
                rounding_unit_shift: String(body.rounding_unit_shift),
                rounding_unit_edge: String(body.rounding_unit_edge),
            };
            setForm(saved);
            setSavedForm(saved);
            setIsEditing(false);
            setStatus("保存しました。");
        } catch (error) {
            if (error instanceof ApiError && error.errors) {
                setErrors(error.errors);
            }
        }
    }

    async function handleAddSpecialWage(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setWageErrors({});

        try {
            await apiFetch("/api/special-wages", {
                method: "POST",
                body: { ...wageForm, hourly_wage: Number(wageForm.hourly_wage) || 0 },
            });
            setWageForm({ title: "", start_time: "", end_time: "", hourly_wage: "" });
            await load();
        } catch (error) {
            if (error instanceof ApiError && error.errors) {
                setWageErrors(error.errors);
            }
        }
    }

    async function handleDeleteSpecialWage(id: number) {
        if (!confirm("この特別給を削除しますか?")) {
            return;
        }
        await apiFetch(`/api/special-wages/${id}`, { method: "DELETE" });
        await load();
    }

    async function handleLogout() {
        await logout();
        router.push("/login");
    }

    return (
        <div className="py-8">
            <div className="px-4 pt-8 space-y-6">
                <div className="p-4 bg-white shadow rounded-lg">
                    <h2 className="text-lg font-medium text-gray-900">アカウント</h2>

                    <div className="mt-4 flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900">{user?.name}</p>
                            <p className="text-sm text-gray-600">{user?.email}</p>
                        </div>
                    </div>

                    <button onClick={handleLogout} className="mt-4 text-sm text-red-600 hover:underline">
                        ログアウト
                    </button>
                </div>

                <div className="p-4 bg-white shadow rounded-lg">
                    <h2 className="text-lg font-medium text-gray-900">時給・丸め設定</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        変更後の設定は今後の勤務にのみ適用され、確定済みの過去の給与には影響しません。
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                        <Field
                            label="時給(基本給)・円"
                            value={form.hourly_wage_default}
                            onChange={(v) => setForm({ ...form, hourly_wage_default: v })}
                            error={errors.hourly_wage_default?.[0]}
                            disabled={!isEditing}
                        />
                        <Field
                            label="時給(土日祝)・円"
                            value={form.hourly_wage_weekend_holiday}
                            onChange={(v) => setForm({ ...form, hourly_wage_weekend_holiday: v })}
                            error={errors.hourly_wage_weekend_holiday?.[0]}
                            disabled={!isEditing}
                        />
                        <Field
                            label="勤務中の切り捨て単位・分"
                            value={form.rounding_unit_shift}
                            onChange={(v) => setForm({ ...form, rounding_unit_shift: v })}
                            error={errors.rounding_unit_shift?.[0]}
                            disabled={!isEditing}
                        />
                        <Field
                            label="出退勤打刻前後の切り捨て単位・分"
                            value={form.rounding_unit_edge}
                            onChange={(v) => setForm({ ...form, rounding_unit_edge: v })}
                            error={errors.rounding_unit_edge?.[0]}
                            disabled={!isEditing}
                        />

                        <div className="flex items-center gap-4">
                            {isEditing ? (
                                <>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center px-4 py-2 bg-[#FF7F50] text-white text-xs font-semibold uppercase tracking-widest rounded-md"
                                    >
                                        保存
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 text-xs font-semibold uppercase tracking-widest rounded-md"
                                    >
                                        キャンセル
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleStartEdit}
                                    className="inline-flex items-center px-4 py-2 bg-[#FF7F50] text-white text-xs font-semibold uppercase tracking-widest rounded-md"
                                >
                                    編集
                                </button>
                            )}
                            {status && <p className="text-sm text-gray-600">{status}</p>}
                        </div>
                    </form>
                </div>

                <div className="p-4 bg-white shadow rounded-lg">
                    <h2 className="text-lg font-medium text-gray-900">特別給</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        深夜給など、時間帯を指定して基本給・土日祝給より優先される時給を登録できます。
                    </p>

                    <ul className="mt-6 divide-y divide-gray-100">
                        {specialWages.length === 0 && (
                            <li className="py-3 text-sm text-gray-600">登録されている特別給はありません。</li>
                        )}
                        {specialWages.map((wage) => (
                            <li key={wage.id} className="py-3 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">{wage.title}</p>
                                    <p className="text-sm text-gray-600">
                                        {wage.start_time}〜{wage.end_time}・{wage.hourly_wage.toLocaleString("ja-JP")}円
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDeleteSpecialWage(wage.id)}
                                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-xs font-semibold uppercase tracking-widest rounded-md"
                                >
                                    削除
                                </button>
                            </li>
                        ))}
                    </ul>

                    <form onSubmit={handleAddSpecialWage} className="mt-6 space-y-6">
                        <div>
                            <label className="block font-medium text-sm text-gray-700">名称</label>
                            <input
                                type="text"
                                required
                                placeholder="例: 深夜給"
                                value={wageForm.title}
                                onChange={(e) => setWageForm({ ...wageForm, title: e.target.value })}
                                className="mt-1 block w-full px-3 py-2 border-gray-300 focus:border-[#FF7F50] focus:ring-[#FF7F50] rounded-md shadow-sm"
                            />
                            {wageErrors.title && <p className="mt-2 text-sm text-red-600">{wageErrors.title[0]}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block font-medium text-sm text-gray-700">開始時刻</label>
                                <input
                                    type="time"
                                    required
                                    value={wageForm.start_time}
                                    onChange={(e) => setWageForm({ ...wageForm, start_time: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 border-gray-300 focus:border-[#FF7F50] focus:ring-[#FF7F50] rounded-md shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="block font-medium text-sm text-gray-700">終了時刻</label>
                                <input
                                    type="time"
                                    required
                                    value={wageForm.end_time}
                                    onChange={(e) => setWageForm({ ...wageForm, end_time: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 border-gray-300 focus:border-[#FF7F50] focus:ring-[#FF7F50] rounded-md shadow-sm"
                                />
                            </div>
                        </div>

                        <Field
                            label="時給・円"
                            value={wageForm.hourly_wage}
                            onChange={(v) => setWageForm({ ...wageForm, hourly_wage: v })}
                            error={wageErrors.hourly_wage?.[0]}
                        />

                        <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 bg-[#FF7F50] text-white text-xs font-semibold uppercase tracking-widest rounded-md"
                        >
                            特別給を追加
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    error,
    disabled,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    disabled?: boolean;
}) {
    return (
        <div>
            <label className="block font-medium text-sm text-gray-700">{label}</label>
            <input
                type="number"
                inputMode="numeric"
                min={1}
                required
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value.replace(/^0+(?=\d)/, ""))}
                className="mt-1 block w-full px-3 py-2 border-gray-300 focus:border-[#FF7F50] focus:ring-[#FF7F50] rounded-md shadow-sm disabled:bg-gray-100 disabled:text-gray-500"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    );
}
