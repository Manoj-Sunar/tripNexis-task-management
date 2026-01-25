
import React, { FC, InputHTMLAttributes, memo } from 'react'

interface inputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    type: string;
    value: string;
    placeholder?: string;
    className?: string;
    setValue: (value: string) => void;
}

const InputField: FC<inputFieldProps> = memo(({ type, value, setValue, placeholder, className }) => {
    return (
        <input
            type={type}
            value={value}
            placeholder={placeholder}
            onChange={(e) => setValue(e.target.value)}
            className={`form-input flex w-full rounded-lg text-[#0d171b] focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-[#cfdfe7] bg-white focus:border-primary h-12 placeholder:text-[#4c809a] p-[15px] pr-12 text-base ${className || ''}`}
        />

    )
})

export default InputField
