'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { IoProvider } from 'socket.io-react-hook'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    const queryClient = new QueryClient()

    return (
        <QueryClientProvider client={queryClient}>
            <IoProvider>
                <NextThemesProvider {...props}>{children}</NextThemesProvider>
            </IoProvider>
        </QueryClientProvider>
    )
}
