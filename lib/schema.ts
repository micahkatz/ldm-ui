import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const dataset = pgTable('dataset', {
    id: serial('id'),
    name: text('name'),
    user_id: text('user_id'),
    prompt: text('prompt'),
    dataset_uri: text('dataset_uri'),
    augmented_uri: text('augmented_uri'),
    column_data: text('column_data'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
})

export type DatasetType = typeof dataset
