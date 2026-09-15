<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ $day->format('Y年n月j日') }}の勤務明細
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-2xl mx-auto sm:px-6 lg:px-8 space-y-6">
            <a href="{{ route('calendar.index', ['year' => $day->year, 'month' => $day->month]) }}"
               class="text-indigo-600 hover:underline text-sm">&laquo; カレンダーに戻る</a>

            @forelse ($sessions as $session)
                <div class="bg-white shadow sm:rounded-lg p-6">
                    <dl class="grid grid-cols-2 gap-4">
                        <div>
                            <dt class="text-sm text-gray-500">出勤時刻</dt>
                            <dd class="text-gray-900">{{ $session->actual_start_at?->format('H:i') ?? '—' }}</dd>
                        </div>
                        <div>
                            <dt class="text-sm text-gray-500">退勤時刻</dt>
                            <dd class="text-gray-900">{{ $session->actual_end_at?->format('H:i') ?? '勤務中' }}</dd>
                        </div>
                        <div>
                            <dt class="text-sm text-gray-500">給与</dt>
                            <dd class="text-gray-900 font-semibold">
                                {{ $session->earned_amount !== null ? number_format($session->earned_amount).'円' : '未確定' }}
                            </dd>
                        </div>
                    </dl>

                    <div class="mt-6 flex items-center gap-4">
                        <a href="{{ route('work-sessions.edit', $session) }}"
                           class="text-sm text-indigo-600 hover:underline">編集</a>

                        <form method="post" action="{{ route('work-sessions.destroy', $session) }}"
                              onsubmit="return confirm('この勤務記録を削除しますか?');">
                            @csrf
                            @method('delete')
                            <button type="submit" class="text-sm text-red-600 hover:underline">削除</button>
                        </form>
                    </div>
                </div>
            @empty
                <div class="bg-white shadow sm:rounded-lg p-6 text-gray-600">
                    この日の勤務記録はありません。
                </div>
            @endforelse
        </div>
    </div>
</x-app-layout>
