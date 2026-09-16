<x-guest-layout>
    <h1 class="text-2xl text-black">新規登録</h1>

    <form method="POST" action="{{ route('register') }}" class="w-full max-w-xs flex flex-col gap-12">
        @csrf

        <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-3">
                <div class="flex flex-col gap-1">
                    <label for="name" class="text-[10px] text-[#838383]">ユーザー名</label>
                    <input id="name" type="text" name="name" value="{{ old('name') }}"
                           required autofocus autocomplete="name"
                           placeholder="ユーザー名を入力してください"
                           class="h-10 px-3 bg-[#FCFAFA] border border-[#D6D6D6] rounded text-xs placeholder-[#BCBCBC] focus:outline-none focus:ring-1 focus:ring-[#FF7E5F]">
                    <x-input-error :messages="$errors->get('name')" class="text-xs" />
                </div>

                <div class="flex flex-col gap-1">
                    <label for="email" class="text-[10px] text-[#838383]">メールアドレス</label>
                    <input id="email" type="email" name="email" value="{{ old('email') }}"
                           required autocomplete="username"
                           placeholder="メールアドレスを入力してください"
                           class="h-10 px-3 bg-[#FCFAFA] border border-[#D6D6D6] rounded text-xs placeholder-[#BCBCBC] focus:outline-none focus:ring-1 focus:ring-[#FF7E5F]">
                    <x-input-error :messages="$errors->get('email')" class="text-xs" />
                </div>
            </div>

            <div class="flex flex-col gap-3">
                <div class="flex flex-col gap-1" x-data="{ show: false }">
                    <label for="password" class="text-[10px] text-[#838383]">パスワード</label>
                    <div class="h-10 flex items-center justify-between px-3 bg-[#FCFAFA] border border-[#D6D6D6] rounded focus-within:ring-1 focus-within:ring-[#FF7E5F]">
                        <input id="password" :type="show ? 'text' : 'password'" name="password"
                               required autocomplete="new-password"
                               placeholder="パスワードを入力してください"
                               class="flex-1 bg-transparent text-xs placeholder-[#BCBCBC] focus:outline-none">
                        <button type="button" @click="show = !show" class="ms-2 text-[#BCBCBC]" tabindex="-1">
                            <svg x-show="!show" class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <svg x-show="show" x-cloak class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.5a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88" />
                            </svg>
                        </button>
                    </div>
                    <x-input-error :messages="$errors->get('password')" class="text-xs" />
                </div>

                <div class="flex flex-col gap-1" x-data="{ show: false }">
                    <label for="password_confirmation" class="text-[10px] text-[#838383]">パスワード(確認)</label>
                    <div class="h-10 flex items-center justify-between px-3 bg-[#FCFAFA] border border-[#D6D6D6] rounded focus-within:ring-1 focus-within:ring-[#FF7E5F]">
                        <input id="password_confirmation" :type="show ? 'text' : 'password'" name="password_confirmation"
                               required autocomplete="new-password"
                               placeholder="パスワードを入力してください"
                               class="flex-1 bg-transparent text-xs placeholder-[#BCBCBC] focus:outline-none">
                        <button type="button" @click="show = !show" class="ms-2 text-[#BCBCBC]" tabindex="-1">
                            <svg x-show="!show" class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <svg x-show="show" x-cloak class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.5a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88" />
                            </svg>
                        </button>
                    </div>
                    <x-input-error :messages="$errors->get('password_confirmation')" class="text-xs" />
                </div>
            </div>
        </div>

        <div class="flex flex-col items-center gap-3">
            <button type="submit"
                    class="w-full h-10 px-3 bg-white border border-[#FF7E5F] text-[#FF7E5F] text-sm rounded shadow-[2px_4px_4px_rgba(139,152,220,0.25)]">
                新規登録
            </button>

            <div class="flex items-center gap-4 w-full">
                <span class="flex-1 border-t border-[#838383]"></span>
                <span class="text-xs text-[#838383]">または</span>
                <span class="flex-1 border-t border-[#838383]"></span>
            </div>

            <a href="{{ route('login') }}"
               class="w-full h-10 px-3 flex items-center justify-center bg-[#FF7E5F] text-white text-sm rounded shadow-[2px_4px_4px_rgba(139,152,220,0.25)]">
                ログイン
            </a>
        </div>
    </form>
</x-guest-layout>
