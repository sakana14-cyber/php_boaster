"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id"> & {
    label: string;
};

export function PasswordInput({ label, ...props }: PasswordInputProps) {
    const [show, setShow] = useState(false);
    const id = useId();

    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={id} className="text-[10px] text-[#838383]">
                {label}
            </label>
            <div className="h-10 flex items-center justify-between px-3 bg-[#FCFAFA] border border-[#D6D6D6] rounded focus-within:ring-1 focus-within:ring-[#FF7E5F]">
                <input
                    id={id}
                    type={show ? "text" : "password"}
                    className="flex-1 bg-transparent text-xs placeholder-[#BCBCBC] focus:outline-none"
                    {...props}
                />
                <button
                    type="button"
                    onClick={() => setShow((value) => !value)}
                    className="ms-2 text-[#BCBCBC]"
                    tabIndex={-1}
                >
                    {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
            </div>
        </div>
    );
}
