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

export const task = pgTable('task', {
    id: serial('id'),
    user_id: text('user_id'),
    dataset_id: serial('dataset_id'),
    status: text('status'),
    message: text('message'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
})

export type TaskType = typeof task
