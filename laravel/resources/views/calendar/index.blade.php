@php
    $prevMonth = $month->copy()->subMonthNoOverflow();
    $nextMonth = $month->copy()->addMonthNoOverflow();
    $firstWeekday = $month->copy()->startOfMonth()->dayOfWeek;
    $daysInMonth = $month->daysInMonth;
@endphp

<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('カレンダー') }}
        </h2>
    </x-slot>

    <div class="py-8">
        <div class="px-4 space-y-6">
            <div class="bg-white shadow rounded-lg p-4">
                <div class="flex items-center justify-between mb-4">
                    <a href="{{ route('calendar.index', ['year' => $prevMonth->year, 'month' => $prevMonth->month]) }}"
                       class="text-indigo-600 hover:underline">&laquo; 前月</a>
                    <h3 class="text-lg font-semibold text-gray-900">{{ $month->format('Y年n月') }}</h3>
                    <a href="{{ route('calendar.index', ['year' => $nextMonth->year, 'month' => $nextMonth->month]) }}"
                       class="text-indigo-600 hover:underline">翌月 &raquo;</a>
                </div>

                <div class="grid grid-cols-3 gap-4 mb-6 text-center">
                    <div>
                        <p class="text-sm text-gray-500">月間給与</p>
                        <p class="text-xl font-bold text-gray-900">{{ number_format($monthlyEarnedAmount) }}円</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">月間勤務時間</p>
                        <p class="text-xl font-bold text-gray-900">{{ floor($monthlyWorkedSeconds / 3600) }}時間{{ floor(($monthlyWorkedSeconds % 3600) / 60) }}分</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">月間勤務日数</p>
                        <p class="text-xl font-bold text-gray-900">{{ $monthlyWorkedDays }}日</p>
                    </div>
                </div>

                <div class="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-1">
                    @foreach (['日', '月', '火', '水', '木', '金', '土'] as $label)
                        <div>{{ $label }}</div>
                    @endforeach
                </div>

                <div class="grid grid-cols-7 gap-1">
                    @for ($i = 0; $i < $firstWeekday; $i++)
                        <div></div>
                    @endfor

                    @for ($day = 1; $day <= $daysInMonth; $day++)
                        @php
                            $date = $month->copy()->day($day)->toDateString();
                            $total = $dailyTotals->get($date);
                        @endphp
                        <a href="{{ route('calendar.show', $date) }}"
                           class="aspect-square border rounded-md p-1 flex flex-col items-center justify-center hover:bg-gray-50 {{ $total ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100' }}">
                            <span class="text-sm text-gray-700">{{ $day }}</span>
                            @if ($total)
                                <span class="text-[10px] text-indigo-600 font-semibold">{{ number_format($total['earned_amount']) }}円</span>
                            @endif
                        </a>
                    @endfor
                </div>
            </div>
        </div>
    </div>
</x-app-layout>
