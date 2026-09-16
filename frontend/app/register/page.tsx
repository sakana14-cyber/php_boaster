"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PasswordInput } from "@/components/PasswordInput";
import type { User } from "@/lib/types";

export default function RegisterPage() {
    const router = useRouter();
    const { setUser } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitting(true);
        setErrors({});

        try {
            const data = await apiFetch<{ user: User }>("/api/register", {
                method: "POST",
                body: {
                    name,
                    email,
                    password,
                    password_confirmation: passwordConfirmation,
                },
            });
            setUser(data.user);
            router.push("/dashboard");
        } catch (error) {
            if (error instanceof ApiError && error.errors) {
                setErrors(error.errors);
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen max-w-md mx-auto flex flex-col items-center justify-center gap-12 bg-white px-8">
            <h1 className="text-2xl text-black">新規登録</h1>

            <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-12">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                            <label htmlFor="name" className="text-[10px] text-[#838383]">
                                ユーザー名
                            </label>
                            <input
                                id="name"
                                type="text"
                                required
                                autoFocus
                                autoComplete="off"
                                placeholder="ユーザー名を入力してください"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                className="h-10 px-3 bg-[#FCFAFA] border border-[#D6D6D6] rounded text-xs placeholder-[#BCBCBC] focus:outline-none focus:ring-1 focus:ring-[#FF7E5F]"
                            />
                            {errors.name && <p className="text-xs text-red-600">{errors.name[0]}</p>}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label htmlFor="email" className="text-[10px] text-[#838383]">
                                メールアドレス
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                autoComplete="off"
                                placeholder="メールアドレスを入力してください"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className="h-10 px-3 bg-[#FCFAFA] border border-[#D6D6D6] rounded text-xs placeholder-[#BCBCBC] focus:outline-none focus:ring-1 focus:ring-[#FF7E5F]"
                            />
                            {errors.email && <p className="text-xs text-red-600">{errors.email[0]}</p>}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div>
                            <PasswordInput
                                label="パスワード"
                                required
                                autoComplete="new-password"
                                placeholder="パスワードを入力してください"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                            />
                            {errors.password && <p className="text-xs text-red-600">{errors.password[0]}</p>}
                        </div>

                        <PasswordInput
                            label="パスワード(確認)"
                            required
                            autoComplete="new-password"
                            placeholder="パスワードを入力してください"
                            value={passwordConfirmation}
                            onChange={(event) => setPasswordConfirmation(event.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full h-10 px-3 bg-white border border-[#FF7E5F] text-[#FF7E5F] text-sm rounded shadow-[2px_4px_4px_rgba(139,152,220,0.25)] disabled:opacity-60"
                    >
                        新規登録
                    </button>

                    <div className="flex items-center gap-4 w-full">
                        <span className="flex-1 border-t border-[#838383]" />
                        <span className="text-xs text-[#838383]">または</span>
                        <span className="flex-1 border-t border-[#838383]" />
                    </div>

                    <Link
                        href="/login"
                        className="w-full h-10 px-3 flex items-center justify-center bg-[#FF7E5F] text-white text-sm rounded shadow-[2px_4px_4px_rgba(139,152,220,0.25)]"
                    >
                        ログイン
                    </Link>
                </div>
            </form>
        </main>
    );
}
