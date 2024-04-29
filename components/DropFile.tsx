'use client'
import { handleCreateDataset, handleUploadDataset } from '@/app/actions'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

type Props = {}

const DropFile = (props: Props) => {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setIsLoading(true)
        // Do something with the files
        console.log({ acceptedFiles })
        const file = acceptedFiles?.[0]

        let formData: FormData = new FormData()
        formData.append('file', file)
        const uploadRespone = await handleUploadDataset(formData)
        setIsLoading(false)
        router.push(`/datasets/${uploadRespone.datasetId}`)
    }, [])
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
    })

    return (
        <div {...getRootProps()}>
            <input {...getInputProps()} accept=".csv" />
            {
                <button
                    className={cn(
                        'border-dashed border-2 rounded-md p-4 h-40 flex items-center justify-center mt-4 w-full hover:border-primary',
                        {
                            'border-primary': isDragActive,
                        }
                    )}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <p>Drop the files here</p>
                    )}
                </button>
            }
        </div>
    )
}

export default DropFile
