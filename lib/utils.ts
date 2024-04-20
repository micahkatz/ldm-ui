import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

import csv from 'csvtojson'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



export const csvToJson = async (data: string | null) => {
    if (!data) {
        return { jsonData: null, titles: null }
    }
    const delimiter = ','
    const titles = data.slice(0, data.indexOf('\n')).split(delimiter)

    const jsonData = await csv().fromString(data)

    return { jsonData, titles }
}
