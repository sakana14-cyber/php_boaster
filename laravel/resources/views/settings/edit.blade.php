<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('設定') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-2xl mx-auto sm:px-6 lg:px-8 space-y-6">
            <div class="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                <section>
                    <header>
                        <h2 class="text-lg font-medium text-gray-900">時給・丸め設定</h2>
                        <p class="mt-1 text-sm text-gray-600">
                            変更後の設定は今後の勤務にのみ適用され、確定済みの過去の給与には影響しません。
                        </p>
                    </header>

                    <form method="post" action="{{ route('settings.update') }}" class="mt-6 space-y-6">
                        @csrf
                        @method('patch')

                        <div>
                            <x-input-label>ユーザー名</x-input-label>
                            <p class="mt-1 text-gray-900">{{ $user->name }}</p>
                        </div>

                        <div>
                            <x-input-label for="hourly_wage_default" value="時給(基本給)・円" />
                            <x-text-input id="hourly_wage_default" name="hourly_wage_default" type="number" min="1" step="1"
                                          class="mt-1 block w-full"
                                          :value="old('hourly_wage_default', $user->hourly_wage_default)" required />
                            <x-input-error class="mt-2" :messages="$errors->get('hourly_wage_default')" />
                        </div>

                        <div>
                            <x-input-label for="hourly_wage_weekend_holiday" value="時給(土日祝)・円" />
                            <x-text-input id="hourly_wage_weekend_holiday" name="hourly_wage_weekend_holiday" type="number" min="1" step="1"
                                          class="mt-1 block w-full"
                                          :value="old('hourly_wage_weekend_holiday', $user->hourly_wage_weekend_holiday)" required />
                            <x-input-error class="mt-2" :messages="$errors->get('hourly_wage_weekend_holiday')" />
                        </div>

                        <div>
                            <x-input-label for="rounding_unit_shift" value="勤務中の切り捨て単位・分" />
                            <x-text-input id="rounding_unit_shift" name="rounding_unit_shift" type="number" min="1" step="1"
                                          class="mt-1 block w-full"
                                          :value="old('rounding_unit_shift', $user->rounding_unit_shift)" required />
                            <x-input-error class="mt-2" :messages="$errors->get('rounding_unit_shift')" />
                        </div>

                        <div>
                            <x-input-label for="rounding_unit_edge" value="出退勤打刻前後の切り捨て単位・分" />
                            <x-text-input id="rounding_unit_edge" name="rounding_unit_edge" type="number" min="1" step="1"
                                          class="mt-1 block w-full"
                                          :value="old('rounding_unit_edge', $user->rounding_unit_edge)" required />
                            <x-input-error class="mt-2" :messages="$errors->get('rounding_unit_edge')" />
                        </div>

                        <div class="flex items-center gap-4">
                            <x-primary-button>{{ __('保存') }}</x-primary-button>

                            @if (session('status') === 'settings-updated')
                                <p x-data="{ show: true }" x-show="show" x-transition
                                   x-init="setTimeout(() => show = false, 2000)"
                                   class="text-sm text-gray-600">{{ __('保存しました。') }}</p>
                            @endif
                        </div>
                    </form>
                </section>
            </div>

            <div class="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                <section>
                    <header>
                        <h2 class="text-lg font-medium text-gray-900">特別給</h2>
                        <p class="mt-1 text-sm text-gray-600">
                            深夜給など、時間帯を指定して基本給・土日祝給より優先される時給を登録できます。
                        </p>
                    </header>

                    <ul class="mt-6 divide-y divide-gray-100">
                        @forelse ($specialWages as $specialWage)
                            <li class="py-3 flex items-center justify-between">
                                <div>
                                    <p class="font-medium text-gray-900">{{ $specialWage->title }}</p>
                                    <p class="text-sm text-gray-600">
                                        {{ $specialWage->start_time->format('H:i') }}〜{{ $specialWage->end_time->format('H:i') }}
                                        ・{{ number_format($specialWage->hourly_wage) }}円
                                    </p>
                                </div>
                                <form method="post" action="{{ route('special-wages.destroy', $specialWage) }}"
                                      onsubmit="return confirm('この特別給を削除しますか?');">
                                    @csrf
                                    @method('delete')
                                    <x-danger-button type="submit">削除</x-danger-button>
                                </form>
                            </li>
                        @empty
                            <li class="py-3 text-sm text-gray-600">登録されている特別給はありません。</li>
                        @endforelse
                    </ul>

                    <form method="post" action="{{ route('special-wages.store') }}" class="mt-6 space-y-6">
                        @csrf

                        <div>
                            <x-input-label for="title" value="名称" />
                            <x-text-input id="title" name="title" type="text" class="mt-1 block w-full"
                                          :value="old('title')" placeholder="例: 深夜給" required />
                            <x-input-error class="mt-2" :messages="$errors->get('title')" />
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <x-input-label for="start_time" value="開始時刻" />
                                <x-text-input id="start_time" name="start_time" type="time" class="mt-1 block w-full"
                                              :value="old('start_time')" required />
                                <x-input-error class="mt-2" :messages="$errors->get('start_time')" />
                            </div>

                            <div>
                                <x-input-label for="end_time" value="終了時刻" />
                                <x-text-input id="end_time" name="end_time" type="time" class="mt-1 block w-full"
                                              :value="old('end_time')" required />
                                <x-input-error class="mt-2" :messages="$errors->get('end_time')" />
                            </div>
                        </div>

                        <div>
                            <x-input-label for="hourly_wage" value="時給・円" />
                            <x-text-input id="hourly_wage" name="hourly_wage" type="number" min="1" step="1"
                                          class="mt-1 block w-full" :value="old('hourly_wage')" required />
                            <x-input-error class="mt-2" :messages="$errors->get('hourly_wage')" />
                        </div>

                        <x-primary-button>{{ __('特別給を追加') }}</x-primary-button>
                    </form>
                </section>
            </div>
        </div>
    </div>
</x-app-layout>
