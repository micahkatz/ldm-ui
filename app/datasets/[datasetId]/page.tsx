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
import { Plus, Wand, Wand2 } from 'lucide-react'
import { getCsvFromS3 } from '@/app/actions'
import { DatasetType } from '@/lib/schema'
import { DataTable } from '@/components/DataTable'
import AugmentButton from '@/components/AugmentButton'
import { csvToJson } from '@/lib/utils'

export default async function DatasetPage({
    params,
}: {
    params: { datasetId: any }
}) {
    const dbResult = await db
        .select({
            dataset_uri: dataset.dataset_uri,
            name: dataset.name,
        })
        .from(dataset)
        .where(eq(params.datasetId, dataset.id))
        .limit(1)

    const csvData = await getCsvFromS3(dbResult?.[0]?.dataset_uri)
    const { jsonData, titles } = await csvToJson(csvData)

    return (
        <main className="flex min-h-screen flex-col items-center p-24 bg-background">
            <div className="flex flex-col max-w-4xl">
                <div className="flex justify-between">
                    <h1 className="text-2xl font-bold">
                        {dbResult?.[0]?.name || 'Dataset'}
                    </h1>
                    <AugmentButton
                        datasetId={params.datasetId}
                        csvData={csvData}
                    />
                </div>
                {jsonData && (
                    <DataTable
                        data={jsonData}
                        rawData={csvData || ''}
                        titles={titles}
                    />
                )}
            </div>
        </main>
    )
}
