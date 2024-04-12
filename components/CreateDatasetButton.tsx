'use client'
import React from 'react'
import { Button } from './ui/button'
import { handleCreateDataset } from '@/app/actions'
import { Input } from './ui/input'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

type Props = {}

const CreateDatasetButton = (props: Props) => {
    const createDatasetMutation = useMutation({
        mutationFn: handleCreateDataset,
    })
    const [prompt, setPrompt] = useState<string>('')
    return (
        <div>
            <Input
                placeholder="Enter a prompt to make a dataset"
                className="mb-4 w-96"
                value={prompt}
                onChange={(e) => {
                    setPrompt(e.target.value)
                }}
                disabled
            />
            <Button
                onClick={(e) => {
                    e.preventDefault()
                    createDatasetMutation.mutate()
                }}
                disabled={createDatasetMutation.isPending}
            >
                {createDatasetMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Dataset
            </Button>
            <p>{createDatasetMutation?.data || ''}</p>
            <p>{createDatasetMutation?.submittedAt || ''}</p>
        </div>
    )
}

export default CreateDatasetButton
