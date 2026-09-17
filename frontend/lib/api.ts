const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
    status: number;
    errors: Record<string, string[]> | null;

    constructor(status: number, message: string, errors: Record<string, string[]> | null = null) {
        super(message);
        this.status = status;
        this.errors = errors;
    }
}

function readCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}

/**
 * SanctumのSPA向けCookie認証を使うため、状態を変更するリクエストの前に
 * 必ずCSRF Cookieを取得してからXSRF-TOKENヘッダーを付与する。
 */
async function ensureCsrfCookie(): Promise<void> {
    if (readCookie("XSRF-TOKEN")) {
        return;
    }

    await fetch(`${API_URL}/sanctum/csrf-cookie`, {
        credentials: "include",
    });
}

type ApiFetchOptions = {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: unknown;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
    const method = options.method ?? "GET";

    if (method !== "GET") {
        await ensureCsrfCookie();
    }

    const headers: Record<string, string> = {
        Accept: "application/json",
    };

    if (options.body !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    const xsrfToken = readCookie("XSRF-TOKEN");
    if (xsrfToken) {
        headers["X-XSRF-TOKEN"] = xsrfToken;
    }

    const response = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        credentials: "include",
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    if (response.status === 204) {
        return undefined as T;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new ApiError(
            response.status,
            data?.message ?? "リクエストに失敗しました",
            data?.errors ?? null,
        );
    }

    return data as T;
}
