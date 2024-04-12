import { ModeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { handleCreateDataset } from './actions'
import CreateDatasetButton from '@/components/CreateDatasetButton'
import RunAugmentationButton from '@/components/RunAugmentationButton'

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center p-24 bg-background">
            <div className="flex flex-col gap-4">
                <CreateDatasetButton />
                <RunAugmentationButton />
            </div>
        </main>
    )
}
