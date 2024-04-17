import React from 'react'
import { twMerge } from 'tailwind-merge'

interface Props extends React.HTMLAttributes<HTMLSpanElement> {
    children: React.ReactNode
}

const GradientText = (props: Props) => {
    const { className, ...propsWithoutClassName } = props
    return (
        <span
            className={twMerge(
                'font-bold bg-gradient-to-r from-primary to-[#3C82F6] bg-clip-text text-transparent',
                className
            )}
            {...propsWithoutClassName}
        >
            {props.children}
        </span>
    )
}

export default GradientText
