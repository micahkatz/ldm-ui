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

export default async function Datasets() {
    const { userId } = auth()

    const datasetData = userId
        ? await db
              .select()
              .from(dataset)
              .where(eq(dataset.user_id, userId))
              .orderBy(desc(dataset.createdAt))
        : null
    return (
        <main className="flex min-h-screen flex-col items-center p-24 bg-background">
            <div className="flex flex-col max-w-2xl">
                <div className="flex justify-between">
                    <h1 className="text-2xl font-bold mb-2">My Datasets</h1>
                    <Button asChild>
                        <Link href="/">
                            <Plus className="h-4 w-4 mr-1" />
                            New
                        </Link>
                    </Button>
                </div>
                <DatasetList
                    // @ts-ignore
                    datasetData={datasetData}
                />
            </div>
        </main>
    )
}
