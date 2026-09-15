/**
 * ホーム画面の「勤務中タイマー」と「予測給与」を毎秒更新する。
 *
 * ここでの計算はあくまで表示用の予測であり、確定給与は必ずサーバー側の
 * SalaryCalculator (app/Services/SalaryCalculator.php) が退勤時に再計算する。
 * 予測表示のためだけに毎秒APIやDBへアクセスしないよう、出勤時刻と時給設定は
 * サーバーが埋め込んだ data 属性から一度だけ読み取る。
 */
function formatElapsedTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return [hours, minutes, seconds]
        .map((part) => String(part).padStart(2, '0'))
        .join(':');
}

function isWeekend(date) {
    const day = date.getDay();

    return day === 0 || day === 6;
}

function parseTimeOnDate(date, timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);

    return result;
}

/**
 * 特別給 > 土日祝給 > 基本給 の優先順位で、指定時刻に適用される時給を返す。
 * SalaryCalculator と同じ優先順位を、表示用に簡易再現したもの。
 */
function resolveHourlyWageAt(moment, config) {
    for (const wage of config.specialWages) {
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

    if (isWeekend(moment)) {
        return config.hourlyWageWeekendHoliday;
    }

    return config.hourlyWageDefault;
}

/**
 * 出勤時刻から現在時刻までを1分ごとの区間に分割し、区間ごとの時給で積算する。
 * 秒単位の完全な再現はせず、表示用として十分な精度(分単位)で計算する。
 */
function predictSalary(startedAt, now, config) {
    let total = 0;
    let cursor = new Date(startedAt);

    while (cursor < now) {
        const next = new Date(Math.min(cursor.getTime() + 60_000, now.getTime()));
        const hourlyWage = resolveHourlyWageAt(cursor, config);
        const seconds = (next.getTime() - cursor.getTime()) / 1000;

        total += Math.floor((hourlyWage * seconds) / 3600);
        cursor = next;
    }

    return total;
}

function initWorkSessionWidget() {
    const widget = document.getElementById('work-session-widget');

    if (!widget || widget.dataset.active !== 'true') {
        return;
    }

    const startedAt = new Date(widget.dataset.startedAt);
    const config = {
        hourlyWageDefault: Number(widget.dataset.hourlyWageDefault),
        hourlyWageWeekendHoliday: Number(widget.dataset.hourlyWageWeekendHoliday),
        specialWages: JSON.parse(widget.dataset.specialWages ?? '[]'),
    };

    const elapsedTimeEl = widget.querySelector('[data-role="elapsed-time"]');
    const predictedSalaryEl = widget.querySelector('[data-role="predicted-salary"]');

    function tick() {
        const now = new Date();
        const elapsedSeconds = Math.max(0, (now.getTime() - startedAt.getTime()) / 1000);

        if (elapsedTimeEl) {
            elapsedTimeEl.textContent = formatElapsedTime(elapsedSeconds);
        }

        if (predictedSalaryEl) {
            const predicted = predictSalary(startedAt, now, config);
            predictedSalaryEl.textContent = `${predicted.toLocaleString('ja-JP')}円`;
        }
    }

    tick();
    setInterval(tick, 1000);
}

function disableSubmitButtonOnceClicked() {
    document.querySelectorAll('form').forEach((form) => {
        form.addEventListener('submit', () => {
            const button = form.querySelector('[data-role="submit-button"]');

            if (button) {
                button.disabled = true;
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initWorkSessionWidget();
    disableSubmitButtonOnceClicked();
});
