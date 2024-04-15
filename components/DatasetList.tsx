'use client'
import { ArrowUpDown } from 'lucide-react'
import { DataTable } from './DataTable'
import { Button } from './ui/button'
import { DatasetType } from '@/lib/schema'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from './ui/checkbox'
type Props = {
    datasetData: DatasetType[] | null
}
export default function DatasetList(props: Props) {
    const columns: ColumnDef<DatasetType>[] = [
        {
            accessorKey: 'prompt',
            header: 'prompt',
            cell: ({ row }) => (
                <div className="capitalize">{row.getValue('prompt')}</div>
            ),
        },
        {
            accessorKey: 'original_dataset_uri',
            header: 'original_dataset_uri',
            cell: ({ row }) => (
                <div className="capitalize">
                    {row.getValue('original_dataset_uri')}
                </div>
            ),
        },
        {
            accessorKey: 'augmented_dataset_uri',
            header: 'augmented_dataset_uri',
            cell: ({ row }) => (
                <div className="capitalize">
                    {row.getValue('augmented_dataset_uri')}
                </div>
            ),
        },
        // {
        //   id: "actions",
        //   enableHiding: false,
        //   cell: ({ row }) => {
        //     const payment = row.original

        //     return (
        //       <DropdownMen>
        //         <DropdownMenuTrigger asChild>
        //           <Button variant="ghost" className="h-8 w-8 p-0">
        //             <span className="sr-only">Open menu</span>
        //             <MoreHorizontal className="h-4 w-4" />
        //           </Button>
        //         </DropdownMenuTrigger>
        //         <DropdownMenuContent align="end">
        //           <DropdownMenuLabel>Actions</DropdownMenuLabel>
        //           <DropdownMenuItem
        //             onClick={() => navigator.clipboard.writeText(payment.id)}
        //           >
        //             Copy payment ID
        //           </DropdownMenuItem>
        //           <DropdownMenuSeparator />
        //           <DropdownMenuItem>View customer</DropdownMenuItem>
        //           <DropdownMenuItem>View payment details</DropdownMenuItem>
        //         </DropdownMenuContent>
        //       </DropdownMenu>
        //     )
        //   },
        // },
    ]
    return (
        <DataTable
            // @ts-ignore
            data={props.datasetData}
            columns={columns}
        />
    )
}
