'use client'
import React, { useMemo } from 'react'
import { Button } from './ui/button'
import { handleCreateDataset } from '@/app/actions'
import { Input } from './ui/input'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowUpDown, Loader2, Minus, Plus } from 'lucide-react'
import { DataTable } from './DataTable'

type Props = {}

const CreateDatasetButton = (props: Props) => {
    const createDatasetMutation = useMutation({
        mutationFn: handleCreateDataset,
    })
    const augmentationMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(
                `${window.location.origin.toString()}/api/python/augmentation`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        csvData: createDatasetMutation?.data,
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            )
            console.log('handleDataAugmentation status', response.status)
            const responseText = await response.text()
            console.log('handleDataAugmentation responseText', responseText)
            return responseText
            return response.status
        },
    })
    type ColumnType = {
        name: string
        description: string
        id: string
    }
    const [prompt, setPrompt] = useState<string>('')
    const [columns, setColumns] = useState<ColumnType[]>([
        { name: '', description: '', id: 'test' },
    ])

    const csvToJson = (data: string) => {
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

    const jsonFromCsvData = useMemo(() => {
        if (createDatasetMutation.data) {
            const { data } = createDatasetMutation
            const { jsonData, titles } = csvToJson(data)
            return { data: jsonData, headers: titles }
        }
        return null
    }, [createDatasetMutation.data])
    const jsonFromAugmentedData = useMemo(() => {
        if (augmentationMutation.data) {
            const { data } = augmentationMutation
            if (typeof data === 'string') {
                const { jsonData, titles } = csvToJson(data)
                return { data: jsonData, headers: titles }
            }
        }
        return null
    }, [augmentationMutation.data])
    return (
        <div className="flex flex-col">
            <p className="text-sm mb-1">Prompt</p>
            <Input
                placeholder="Enter a prompt to make a dataset"
                className="mb-4 w-96"
                value={prompt}
                onChange={(e) => {
                    setPrompt(e.target.value)
                }}
            />
            {columns.map((col, index) => (
                <div className="flex gap-2 mb-2 items-end">
                    <div>
                        <p className="text-sm mb-1">Column Name</p>
                        <Input
                            key={`name-${col.id}`}
                            placeholder="Column Name"
                            className="w-52"
                            value={col.name}
                            onChange={(e) =>
                                setColumns((prev) => {
                                    prev[index].name = e.target.value
                                    return [...prev]
                                })
                            }
                        />
                    </div>
                    <div>
                        <p className="text-sm mb-1">Column Description</p>
                        <Input
                            key={`description-${col.id}`}
                            placeholder="Column Description"
                            className="w-52"
                            value={col.description}
                            onChange={(e) =>
                                setColumns((prev) => {
                                    prev[index].description = e.target.value
                                    return [...prev]
                                })
                            }
                        />
                    </div>
                    <Button
                        variant="secondary"
                        className="rounded-full px-0 py-0 h-6 w-6 mb-2"
                        onClick={(e) => {
                            e.preventDefault()
                            setColumns((prev) =>
                                prev.filter((c) => c.id !== col.id)
                            )
                        }}
                    >
                        <Minus className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <Button
                variant="ghost"
                className="w-fit mb-2 self-end"
                onClick={(e) => {
                    e.preventDefault()
                    setColumns((prev) => [
                        ...prev,
                        {
                            id: 'new' + Date.now(),
                            name: '',
                            description: '',
                        },
                    ])
                }}
            >
                <Plus className="h-4 w-4" />
                Add Column
            </Button>
            <Button
                onClick={(e) => {
                    e.preventDefault()
                    createDatasetMutation.mutate({ prompt, columns })
                }}
                disabled={createDatasetMutation.isPending || prompt.length <= 0}
                className="w-fit mb-4"
            >
                {createDatasetMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Dataset
            </Button>
            {/* <p>{createDatasetMutation?.data || ''}</p> */}
            {createDatasetMutation?.error?.message && (
                <p className="text-destructive mb-4">
                    {createDatasetMutation?.error?.message}
                </p>
            )}
            {jsonFromCsvData && (
                <DataTable
                    data={jsonFromCsvData.data}
                    columns={jsonFromCsvData.headers.map((title) => {
                        return {
                            accessorKey: title,
                            header: ({ column }) => {
                                return (
                                    <Button
                                        variant="ghost"
                                        onClick={() =>
                                            column.toggleSorting(
                                                column.getIsSorted() === 'asc'
                                            )
                                        }
                                    >
                                        {title}
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                )
                            },
                            cell: ({ row }) => (
                                <div className="capitalize">
                                    {row.getValue(title)}
                                </div>
                            ),
                        }
                    })}
                />
            )}

            <Button
                onClick={(e) => {
                    e.preventDefault()
                    augmentationMutation.mutate()
                }}
                disabled={
                    augmentationMutation.isPending ||
                    !createDatasetMutation?.data
                }
                className="w-fit"
            >
                {augmentationMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Run Data Augmentation
            </Button>
            {jsonFromAugmentedData && (
                <DataTable
                    data={jsonFromAugmentedData.data}
                    columns={jsonFromAugmentedData.headers.map((title) => {
                        return {
                            accessorKey: title,
                            header: ({ column }) => {
                                return (
                                    <Button
                                        variant="ghost"
                                        onClick={() =>
                                            column.toggleSorting(
                                                column.getIsSorted() === 'asc'
                                            )
                                        }
                                    >
                                        {title}
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                )
                            },
                            cell: ({ row }) => (
                                <div className="capitalize">
                                    {row.getValue(title)}
                                </div>
                            ),
                        }
                    })}
                />
            )}
            {augmentationMutation?.error?.message && (
                <p className="text-destructive mb-4">
                    {augmentationMutation?.error?.message}
                </p>
            )}
        </div>
    )
}

export default CreateDatasetButton
