<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('勤務記録の編集') }}
        </h2>
    </x-slot>

    <div class="py-8">
        <div class="px-4">
            <div class="bg-white shadow rounded-lg p-4">
                <form method="post" action="{{ route('work-sessions.edit.update', $workSession) }}" class="space-y-6">
                    @csrf
                    @method('put')

                    <div>
                        <x-input-label for="actual_start_at" value="出勤時刻" />
                        <x-text-input id="actual_start_at" name="actual_start_at" type="datetime-local"
                                      class="mt-1 block w-full"
                                      :value="old('actual_start_at', $workSession->actual_start_at?->format('Y-m-d\TH:i'))" required />
                        <x-input-error class="mt-2" :messages="$errors->get('actual_start_at')" />
                    </div>

                    <div>
                        <x-input-label for="actual_end_at" value="退勤時刻" />
                        <x-text-input id="actual_end_at" name="actual_end_at" type="datetime-local"
                                      class="mt-1 block w-full"
                                      :value="old('actual_end_at', $workSession->actual_end_at?->format('Y-m-d\TH:i'))" required />
                        <x-input-error class="mt-2" :messages="$errors->get('actual_end_at')" />
                    </div>

                    <p class="text-sm text-gray-500">
                        保存すると、修正後の時刻を元に給与が自動的に再計算されます。
                    </p>

                    <x-primary-button>{{ __('保存') }}</x-primary-button>
                </form>
            </div>
        </div>
    </div>
</x-app-layout>
