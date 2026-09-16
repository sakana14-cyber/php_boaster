export type User = {
    id: number;
    name: string;
    email: string;
    hourly_wage_default: number;
    hourly_wage_weekend_holiday: number;
    rounding_unit_shift: number;
    rounding_unit_edge: number;
};

export type SpecialWage = {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    hourly_wage: number;
};

export type WorkSession = {
    id: number;
    scheduled_start_at: string | null;
    scheduled_end_at: string | null;
    actual_start_at: string | null;
    actual_end_at: string | null;
    earned_amount: number | null;
};

export type DashboardData = {
    active_session: WorkSession | null;
    todays_shift: WorkSession | null;
    today_earned_amount: number;
};

export type CalendarDailyTotal = {
    earned_amount: number;
    worked_seconds: number;
};

export type CalendarIndexData = {
    year: number;
    month: number;
    daily_totals: Record<string, CalendarDailyTotal>;
    shift_days: string[];
    monthly_earned_amount: number;
    monthly_worked_seconds: number;
    monthly_worked_days: number;
};

export type CalendarShowData = {
    date: string;
    sessions: WorkSession[];
};
