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

const csvToJson = (data: string | null) => {
    if (!data) {
        return { jsonData: null, titles: null }
    }
    const delimiter = ','
    const titles = data.slice(0, data.indexOf('\n')).split(delimiter)
    const jsonData = data
        .slice(data.indexOf('\n') + 1)
        .split('\n')
        .map((v) => {
            const values = v.split(delimiter)
            return titles.reduce(
                (obj, title, index) =>
                    (
                        // @ts-ignore
                        (obj[title] = values[index]), obj
                    ),
                {}
            )
        })

    return { jsonData, titles }
}

export default async function DatasetPage({
    params,
}: {
    params: { datasetId: any; datasetType: 'original' | 'augmented' }
}) {
    const dbResult = await db
        .select({
            original_dataset_uri: dataset.original_dataset_uri,
            augmented_dataset_uri: dataset.augmented_dataset_uri,
            name: dataset.name
        })
        .from(dataset)
        .where(eq(params.datasetId, dataset.id))
        .limit(1)

    const csvData = await getCsvFromS3(
        params.datasetType === 'original'
            ? dbResult?.[0]?.original_dataset_uri
            : dbResult?.[0]?.augmented_dataset_uri
    )
    const { jsonData, titles } = csvToJson(csvData)

    return (
        <main className="flex min-h-screen flex-col items-center p-24 bg-background">
            <div className="flex flex-col max-w-2xl">
                <div className="flex justify-between">
                    <h1 className="text-2xl font-bold">{dbResult?.[0]?.name || 'Dataset'}</h1>
                    <Button asChild>
                        <Link href="/new">
                            <Wand2 className="h-4 w-4 mr-1" />
                            Augment
                        </Link>
                    </Button>
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
