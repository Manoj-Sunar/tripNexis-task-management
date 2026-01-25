import React, { ButtonHTMLAttributes, FC, memo } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    label: string;
}
const Button: FC<ButtonProps> = memo(({ type, label, onClick }) => {
    return (
        <button type={type} className="w-full flex items-center justify-center rounded-lg h-12 px-4 bg-primary text-white text-base font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
            {label}
        </button>
    )
})

export default Button
