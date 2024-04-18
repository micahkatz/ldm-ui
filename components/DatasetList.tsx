'use client'
import { ArrowUpDown, ExternalLink } from 'lucide-react'
import { DataTable } from './DataTable'
import { Button } from './ui/button'
import { DatasetType } from '@/lib/schema'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from './ui/checkbox'
import moment from 'moment'
import Link from 'next/link'
type Props = {
    datasetData: DatasetType[] | null
}
export default function DatasetList(props: Props) {
    const columns: ColumnDef<DatasetType>[] = [
        {
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }) => (
                <div className="capitalize">{row.getValue('name')}</div>
            ),
        },
        {
            accessorKey: 'prompt',
            header: 'Prompt',
            cell: ({ row }) => (
                <div className="capitalize">{row.getValue('prompt')}</div>
            ),
        },
        {
            accessorKey: 'createdAt',
            header: 'Created',
            cell: ({ row }) => (
                <div className="capitalize">
                    {moment(row.getValue('createdAt')).fromNow()}
                </div>
            ),
        },
        {
            accessorKey: 'id',
            header: '',
            cell: ({ row }) => (
                <Button variant={'secondary'} asChild>
                    <div className="flex gap-1">
                        <Link href={`/datasets/original/${row.getValue('id')}`}>
                            View
                        </Link>
                        <ExternalLink className="h-4 w-4" />
                    </div>
                </Button>
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
