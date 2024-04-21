'use client'
import {
    augmentDataset,
    getAugmentationCsvUrl,
    getAugmentationIdByUri,
    getTaskStatus,
} from '@/app/actions'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { QueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { Check, Loader2, Wand2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import Link from 'next/link'
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
            return await augmentDataset(props.datasetId)
        },
    })
    const augmentationUrlPolling = useQuery({
        queryKey: ['augmentationUrlPolling', props.datasetId],
        queryFn: () => getAugmentationCsvUrl(props.datasetId),
        enabled: !!augmentationMutation.isSuccess,
        refetchInterval: augmentationUrlPollingInterval,
    })
    const augmentationStatusPolling = useQuery({
        queryKey: ['augmentationStatusPolling', props.datasetId],
        queryFn: () => getTaskStatus(props.datasetId),
        enabled: !!augmentationMutation.isSuccess,
        refetchInterval: augmentationUrlPollingInterval / 2,
        // refetchInterval: 1000,
    })

    const [augmentationLoading, setAugmentationLoading] = useState(false)
    const [alertIsOpen, setAlertIsOpen] = useState(false)

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (augmentationLoading) {
                setAugmentationLoading(false)
                setAlertIsOpen(true)
            }
        }, 15000) // stop loading after 15 seconds
        return () => {
            clearTimeout(timeout)
        }
    }, [augmentationLoading, setAugmentationLoading, setAlertIsOpen])

    useEffect(() => {
        if (
            augmentationUrlPolling?.data &&
            augmentationMutation.status === 'success'
        ) {
            setAugmentationLoading(false)
            setAugmentationUrlPollingInterval(0)
            getAugmentationIdByUri(augmentationUrlPolling.data)
                .then((id) => {
                    queryClient.resetQueries({
                        queryKey: ['augmentationUrlPolling', props.datasetId],
                    })
                    augmentationMutation.reset()
                    router.push(`/datasets/${id}`)
                })
                .catch((e) => console.error(e))
        }
    }, [augmentationUrlPolling?.data, augmentationMutation.status])

    const renderIcon = (status?: string | null) => {
        if(augmentationLoading){
            return <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
        }
        switch (status) {
            case 'LOADING':
                return <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            case 'SUCCESS':
                return <Check className="mr-2 h-4 w-4" />
            case 'ERROR':
                return <X className="mr-2 h-4 w-4" />
            default:
                return <Wand2 className="h-4 w-4 mr-1" />
        }
    }

    return (
        <>
            <Button
                onClick={(e) => {
                    e.preventDefault()
                    setAugmentationLoading(true)
                    augmentationMutation.mutate()
                }}
                disabled={augmentationLoading}
                className="w-fit"
            >
                {renderIcon(augmentationStatusPolling?.data?.status)}
                {augmentationStatusPolling?.data?.message || 'Augment'}
            </Button>

            <AlertDialog onOpenChange={setAlertIsOpen} open={alertIsOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Try again</AlertDialogTitle>
                        <AlertDialogDescription>
                            There was an error. Try again with another dataset
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => e.preventDefault()}>
                            <Link href="/new">Try again</Link>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export default AugmentButton
