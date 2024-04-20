'use client'
import {
    augmentDataset,
    getAugmentationCsvUrl,
    getAugmentationIdByUri,
} from '@/app/actions'
import { QueryClient, useMutation, useQuery } from '@tanstack/react-query'
import React, { useEffect, useState } from 'react'
import { Button } from './ui/button'
import Link from 'next/link'
import { Loader2, Wand2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Props = {
    datasetId: string
    csvData: string | null
}

const AugmentButton = (props: Props) => {
    const router = useRouter()
    const queryClient = new QueryClient()

    const [augmentationUrlPollingInterval, setAugmentationUrlPollingInterval] =
        useState(2000)
    const augmentationMutation = useMutation({
        mutationFn: async () => {
            setAugmentationUrlPollingInterval(2000)
            return await augmentDataset(props.datasetId, props.csvData)
        },
    })
    const augmentationUrlPolling = useQuery({
        queryKey: ['augmentationUrlPolling', props.datasetId],
        queryFn: () => getAugmentationCsvUrl(props.datasetId),
        enabled: !!augmentationMutation.isSuccess,
        refetchInterval: augmentationUrlPollingInterval,
    })

    const [augmentationLoading, setAugmentationLoading] = useState(false)

    useEffect(() => {
        if (augmentationUrlPolling?.data && augmentationMutation.status === 'success') {
            setAugmentationLoading(false)
            setAugmentationUrlPollingInterval(0)
            getAugmentationIdByUri(augmentationUrlPolling.data)
                .then((id) => {
                    queryClient.resetQueries({queryKey: ['augmentationUrlPolling', props.datasetId]})
                    augmentationMutation.reset()
                    router.push(`/datasets/${id}`)
                })
                .catch((e) => console.error(e))
        }
    }, [augmentationUrlPolling?.data, augmentationMutation.status])

    return (
        <Button
            onClick={(e) => {
                e.preventDefault()
                setAugmentationLoading(true)
                augmentationMutation.mutate()
            }}
            disabled={augmentationLoading}
            className="w-fit"
        >
            {augmentationLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Wand2 className="h-4 w-4 mr-1" />
            )}
            Augment
        </Button>
    )
}

export default AugmentButton
