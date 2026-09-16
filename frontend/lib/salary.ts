import type { SpecialWage, User } from "./types";

/**
 * ホーム画面の「予測給与」を毎秒更新するための表示専用ロジック。
 * サーバー側のSalaryCalculator(特別給 > 土日祝給 > 基本給の優先順位)を
 * 分単位の精度で簡易再現したもので、確定給与は必ず退勤時にサーバーが
 * 再計算する。
 */

function isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
}

function parseTimeOnDate(date: Date, time: string): Date {
    const [hours, minutes] = time.split(":").map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
}

function resolveHourlyWageAt(moment: Date, user: User, specialWages: SpecialWage[]): number {
    for (const wage of specialWages) {
        let start = parseTimeOnDate(moment, wage.start_time);
        let end = parseTimeOnDate(moment, wage.end_time);

        if (end <= start) {
            if (moment < start) {
                start = new Date(start.getTime() - 24 * 60 * 60 * 1000);
            } else {
                end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
            }
        }

        if (moment >= start && moment < end) {
            return wage.hourly_wage;
        }
    }

    return isWeekend(moment) ? user.hourly_wage_weekend_holiday : user.hourly_wage_default;
}

export function predictSalary(
    startedAt: Date,
    now: Date,
    user: User,
    specialWages: SpecialWage[],
): number {
    let total = 0;
    let cursor = new Date(startedAt);

    while (cursor < now) {
        const next = new Date(Math.min(cursor.getTime() + 60_000, now.getTime()));
        const hourlyWage = resolveHourlyWageAt(cursor, user, specialWages);
        const seconds = (next.getTime() - cursor.getTime()) / 1000;

        total += Math.floor((hourlyWage * seconds) / 3600);
        cursor = next;
    }

    return total;
}

export function formatElapsedTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}
