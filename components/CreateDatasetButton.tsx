'use client'
import React, { useEffect, useMemo } from 'react'
import { Button } from './ui/button'
import {
    augmentDataset,
    handleCreateDataset,
    handleNewAugmentation,
} from '@/app/actions'
import { Input } from './ui/input'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowUpDown, Loader2, Minus, Plus } from 'lucide-react'
import { DataTable } from './DataTable'
import { io } from 'socket.io-client'
import { useSocket, useSocketEvent } from 'socket.io-react-hook'
// import { socket } from "../utils/socket";

type Props = {}

const CreateDatasetButton = (props: Props) => {
    // @ts-ignore
    const { socket, error } = useSocket()
    // const { socket, error } = useSocket(process.env.NODE_ENV !== 'development' ? process.env.NEXT_PUBLIC_SOCKET_URL : undefined)

    const { lastMessage } = useSocketEvent(socket, 'augmentationResponse')
    const { sendMessage } = useSocketEvent(socket, 'augmentation')
    const { lastMessage: lastAppendMessage } = useSocketEvent(
        socket,
        'augmentationAppend',
        {
            onMessage: (lastAppendMessage) => {
                console.log(
                    'augmentationAppend received message',
                    lastAppendMessage
                )
                if (lastAppendMessage?.row) {
                    setStreamingAugmentedData((prev) => {
                        const newCsvString =
                            prev?.csvString +
                            `${lastAppendMessage?.row.join(',')}\n`
                        const { jsonData, titles } = csvToJson(newCsvString)

                        return {
                            ...prev,
                            data: jsonData,
                            csvString: newCsvString,
                        }
                    })
                }
                if (lastAppendMessage?.columns) {
                    setStreamingAugmentedData((prev) => {
                        if (prev?.headers && prev.headers.length >= 0) {
                            return prev
                        }
                        const columns: string[] = lastAppendMessage?.columns

                        return {
                            // removed any existing data since columns should come first
                            data: [],
                            headers: columns,
                            csvString: columns.join(',') + '\n',
                        }
                    })
                }
            },
        }
    )

    const [augmentationLoading, setAugmentationLoading] = useState(false)

    const createDatasetMutation = useMutation({
        mutationFn: handleCreateDataset,
    })
    const augmentationMutation = useMutation({
        mutationFn: async () => {
            return await augmentDataset(
                createDatasetMutation?.data?.llmResponse
            )
            // const response = await fetch(
            //     `${window.location.origin.toString()}/api/augmentation`,
            //     {
            //         method: 'POST',
            //         body: JSON.stringify({
            //             csvData: createDatasetMutation?.data,
            //         }),
            //         headers: {
            //             'Content-Type': 'application/json',
            //         },
            //     }
            // )
            // if (!response.ok) {
            //     throw 'Error Augmenting Data'
            // }
            // console.log('handleDataAugmentation status', response.status)
            // const responseText = await response.text()
            // console.log('handleDataAugmentation responseText', responseText)
            // return responseText
            // return response.status

            // setAugmentationLoading(true)
            // console.log(
            //     'sending csv data to socket',
            //     createDatasetMutation?.data
            // )
            // await sendMessage({ csvData: createDatasetMutation?.data })
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
        if (createDatasetMutation.data?.llmResponse) {
            const data = createDatasetMutation.data?.llmResponse
            const { jsonData, titles } = csvToJson(data)
            return { data: jsonData, headers: titles }
        }
        return null
    }, [createDatasetMutation.data])
    const jsonFromAugmentedData = useMemo(() => {
        console.log('jsonFromAugmentedData memo', { lastMessage })
        if (lastMessage?.uri) {
            setAugmentationLoading(false)
            console.log(
                'FOUND lastMessage?.uri',
                lastMessage?.uri,
                'calling handleNewAugmentation with dataset id',
                createDatasetMutation.data?.datasetId
            )
            handleNewAugmentation(
                createDatasetMutation.data?.datasetId,
                lastMessage.uri
            )
        }
        if (lastMessage?.csv_string) {
            setAugmentationLoading(false)
            const data = lastMessage?.csv_string
            if (typeof data === 'string') {
                const { jsonData, titles } = csvToJson(data)
                return { data: jsonData, headers: titles }
            }
        }
        return null
    }, [createDatasetMutation.data, lastMessage])

    const [streamingAugmentedData, setStreamingAugmentedData] = useState<{
        headers?: string[]
        data?: {}[]
        csvString?: string
    } | null>(null)

    // useEffect(() => {
    //     if (lastAppendMessage?.row) {
    //         setStreamingAugmentedData((prev) => {
    //             const newCsvString =
    //                 prev?.csvString + `${lastAppendMessage?.row.join(',')}\n`
    //             const { jsonData, titles } = csvToJson(newCsvString)

    //             return {
    //                 ...prev,
    //                 data: jsonData,
    //                 csvString: newCsvString,
    //             }
    //         })
    //     }
    //     if (lastAppendMessage?.columns) {
    //         setStreamingAugmentedData((prev) => {
    //             if (prev?.headers && prev.headers.length >= 0) {
    //                 return prev
    //             }
    //             const columns: string[] = lastAppendMessage?.columns

    //             return {
    //                 ...prev,
    //                 headers: columns,
    //                 csvString: columns.join(',') + '\n',
    //             }
    //         })
    //     }
    // }, [lastAppendMessage])
    return (
        <div className="flex flex-col mx-4">
            {/* Connected: {JSON.stringify(socket.connected)} */}
            {/* LastMessage: {JSON.stringify(lastMessage)} */}
            {/* <code className="mb-4">
                lastAppendMessage: {JSON.stringify(lastAppendMessage)}
            </code> */}
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
                    rawData={createDatasetMutation.data?.llmResponse}
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
                    setAugmentationLoading(true)
                    augmentationMutation.mutate()
                    // sendMessage({
                    //     csvData: createDatasetMutation?.data?.llmResponse,
                    // })
                }}
                disabled={
                    augmentationMutation.isPending ||
                    !createDatasetMutation?.data?.llmResponse
                }
                // disabled={
                //     augmentationLoading ||
                //     !createDatasetMutation?.data?.llmResponse
                // }
                className="w-fit"
            >
                {augmentationMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {/* {augmentationLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )} */}
                Run Data Augmentation
            </Button>
            {streamingAugmentedData && (
                <DataTable
                    data={streamingAugmentedData?.data || []}
                    rawData={streamingAugmentedData?.csvString}
                    columns={
                        streamingAugmentedData?.headers
                            ? streamingAugmentedData.headers.map((title) => {
                                  return {
                                      accessorKey: title,
                                      header: ({ column }) => {
                                          return (
                                              <Button
                                                  variant="ghost"
                                                  onClick={() =>
                                                      column.toggleSorting(
                                                          column.getIsSorted() ===
                                                              'asc'
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
                              })
                            : []
                    }
                />
            )}
            {/* {jsonFromAugmentedData && (
                <DataTable
                    data={jsonFromAugmentedData.data}
                    rawData={lastMessage?.csv_string}
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
            )} */}
            {/* {augmentationMutation?.error?.message && (
                <p className="text-destructive mb-4">
                    {augmentationMutation?.error?.message}
                </p>
            )} */}
        </div>
    )
}

export default CreateDatasetButton
