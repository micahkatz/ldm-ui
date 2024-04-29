'use client'
import { ModeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import CreateDatasetButton from '@/components/CreateDatasetButton'
import { db } from '@/lib/db'
import { dataset } from '@/lib/schema'
import { desc, eq } from 'drizzle-orm'
import { auth } from '@clerk/nextjs'
import DatasetList from '@/components/DatasetList'
import { Plus } from 'lucide-react'
import { NextScript } from 'next/document'

import { Widget } from '@typeform/embed-react'

export default function Waitlist() {
    return (
        <main className="flex flex-col items-center justify-center py-8 px-8 bg-background">
            <h1 className="text-xl mt-8 mb-8">Join the Waitlist</h1>
            <Widget
                id="gEqQARFH"
                className="h-[calc(100vh-2rem)] w-full bg-transparent -mt-2"
            />
        </main>
    )
}
