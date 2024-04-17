import './globals.css'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/Providers'
import Header from '@/components/Header'
import Head from 'next/head'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
    title: 'Large Data Model',
    description: '',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            {/* <Head>
                <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
            </Head> */}
            <ClerkProvider>
                <body className={inter.className}>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <Header />
                        {children}
                    </ThemeProvider>
                </body>
            </ClerkProvider>
        </html>
    )
}
