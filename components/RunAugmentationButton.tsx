'use client'
import React from 'react'
import { Button } from './ui/button'
import { handleDataAugmentation } from '@/app/actions'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useUploadThing } from '@/utils/uploadthing'
import { Loader2 } from 'lucide-react'
// import { useUploadThing } from "~/utils/uploadthing";

type Props = {}

const RunAugmentationButton = (props: Props) => {
    const { startUpload, permittedFileInfo } = useUploadThing(
        'imageUploader',
        {
          onClientUploadComplete: () => {
            alert("uploaded successfully!");
          },
          onUploadError: () => {
            alert("error occurred while uploading");
          },
          onUploadBegin: () => {
            alert("upload has begun");
          },
        },
      );
    const augmentationMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(
                `${window.location.origin.toString()}/api/python/augmentation`,
                { method: 'GET' }
            )
            console.log('handleDataAugmentation status', response.status)
            console.log('handleDataAugmentation', await response.text())
            return 'Success'
        },
    })
    return (
        <div>
            <Button
                onClick={(e) => {
                    e.preventDefault()
                    augmentationMutation.mutate()
                }}
                disabled={augmentationMutation.isPending}
            >
                {augmentationMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Run Data Augmentation
            </Button>
            <p>{augmentationMutation?.data || ''}</p>
        </div>
    )
}

export default RunAugmentationButton
