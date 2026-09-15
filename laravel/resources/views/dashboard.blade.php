@php
    $user = auth()->user();
@endphp

<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('ホーム') }}
        </h2>
    </x-slot>

    <div class="py-8">
        <div class="px-4 space-y-6">
            @if ($errors->has('work_session'))
                <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                    {{ $errors->first('work_session') }}
                </div>
            @endif

            <div class="bg-white overflow-hidden shadow-sm rounded-lg p-6 text-center"
                 id="work-session-widget"
                 data-active="{{ $activeSession ? 'true' : 'false' }}"
                 data-started-at="{{ $activeSession?->actual_start_at?->toIso8601String() }}"
                 data-hourly-wage-default="{{ $user->hourly_wage_default }}"
                 data-hourly-wage-weekend-holiday="{{ $user->hourly_wage_weekend_holiday }}"
                 data-special-wages="{{ $user->specialWages->map(fn ($wage) => [
                     'start_time' => $wage->start_time->format('H:i'),
                     'end_time' => $wage->end_time->format('H:i'),
                     'hourly_wage' => $wage->hourly_wage,
                 ])->toJson() }}"
            >
                @if ($activeSession)
                    <p class="text-sm text-gray-500">勤務中</p>
                    <p class="text-4xl font-bold text-gray-900 mt-2" data-role="elapsed-time">00:00:00</p>

                    <p class="text-sm text-gray-500 mt-6">現在の予測給与</p>
                    <p class="text-3xl font-bold text-indigo-600 mt-1" data-role="predicted-salary">0円</p>

                    <form method="POST" action="{{ route('work-sessions.update', $activeSession) }}" class="mt-8">
                        @csrf
                        @method('PATCH')
                        <button type="submit" data-role="submit-button"
                                class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg">
                            退勤する
                        </button>
                    </form>
                @else
                    <p class="text-sm text-gray-500">今日の給与</p>
                    <p class="text-4xl font-bold text-gray-900 mt-2">{{ number_format($todayEarnedAmount) }}円</p>

                    <form method="POST" action="{{ route('work-sessions.store') }}" class="mt-8">
                        @csrf
                        <button type="submit" data-role="submit-button"
                                class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg">
                            出勤する
                        </button>
                    </form>
                @endif
            </div>
        </div>
    </div>
</x-app-layout>
