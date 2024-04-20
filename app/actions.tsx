'use server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})
import { auth, currentUser, redirectToSignIn } from '@clerk/nextjs'
import { sql } from '@vercel/postgres'
import { drizzle } from 'drizzle-orm/vercel-postgres'
import { dataset } from '@/lib/schema'
import { db } from '@/lib/db'
import {
    PutObjectCommand,
    GetObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import AWS from 'aws-sdk'
AWS.config.update({ region: 'us-east-1' })

var sqs = new AWS.SQS({ region: 'us-east-1' })
const s3Client = new S3Client({ region: process.env.AWS_REGION })
type ColumnType = {
    name: string
    description: string
    id: string
}
export async function handleCreateDataset({
    name,
    prompt,
    columns,
}: {
    name: string
    prompt: string
    columns: ColumnType[]
}) {
    const { userId } = auth()

    if (!userId) {
        throw new Error('Unauthorized')
    }
    const user = await currentUser()
    if (!user) {
        throw new Error('User Not Defined')
    }
    console.log({ emails: user?.emailAddresses })
    if (
        !user.emailAddresses.find(
            (item) =>
                item.emailAddress === 'micahj2110@gmail.com' ||
                item.emailAddress === 'bcsteele1228@gmail.com'
        )
    ) {
        throw new Error('Forbidden')
    }

    const makeColumnText = () => {
        var columnText = ''
        columns.forEach(
            (column) =>
                (columnText += `- ${column.name}: ${column.description}\n`)
        )
        return columnText
    }

    const userPrompt = `${prompt}

    There should be 10 rows

    Columns:
    ${makeColumnText()}
    `

    // return {
    //     llmResponse: `cheese,drink,customer
    // American,Soda,Vegetarian
    // Cheddar,Beer,Carnivore
    // Swiss,Water,Fitness Enthusiast`,
    //     datasetId: 1,
    // }
    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: `You are a Large Data Model. You create datasets to train AI.
                    Return Only comma separated rows of data. 
                    If there are commas in a column, put quotes around it so there are not parsing errors.
                    Include the header.`,
            },
            {
                role: 'user',
                content: userPrompt,
            },
            // `Make me a dataset for a sentiment classification system.
            // - chat: this column will contain a transcription of the user voice on a call
            // - sentiment: this column will contain the sentiment of the user transcription. The different sentiments are "positive", "negative", and "neutral"

            //     {
            //     role: "user",
            //     content:
            //         `Make me a dataset for an intent engine.

            //         There should be 5 rows

            //         Columns:
            //         - prompt: this column will contain a string of the prompt from the AI assistant. This is typically a question
            //         - response: this column will contain a transcription of the response from the user on a call.
            //         - intent: this is the output determined from prompt and response. There are 3 intents. "answered_question" (which means that the user answered the question that the AI assistant asked), "off_topic" (the user said something that was not related to the question that the AI assistant asked), and "repeat" (which means the user wants the AI Assistant to repeat the question)
            //         `
            // }
        ],
        model: 'gpt-3.5-turbo',
    })
    const llmResponse = completion?.choices?.[0]?.message?.content
    console.log({ llmResponse })
    if (llmResponse && llmResponse !== null) {
        const objectKey = `${randomUUID()}.csv`
        const putCommand = new PutObjectCommand({
            Body: llmResponse,
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: objectKey,
        })
        const s3response = await s3Client.send(putCommand)
        console.log({ s3response })

        const result = await db
            .insert(dataset)
            .values({
                name,
                prompt,
                column_data: makeColumnText(),
                user_id: userId,
                dataset_uri: objectKey,
            })
            .returning({ insertedId: dataset.id })

        console.log({ result })

        return { llmResponse, datasetId: result?.[0]?.insertedId }
    }
    return { llmResponse }
}

export async function augmentDataset(
    datasetId: string | null | undefined | number,
) {
    const { userId } = auth()

    if (!userId) {
        throw new Error('Unauthorized')
    }
    if (!datasetId || !process.env.SQS_URL) {
        throw new Error('Invalid request')
    }
    var params: AWS.SQS.SendMessageRequest = {
        MessageAttributes: {
            uid: {
                DataType: 'String',
                StringValue: userId,
            },
        },
        MessageBody: `${datasetId}`,
        QueueUrl: process.env.SQS_URL,
        MessageGroupId: 'default',
        MessageDeduplicationId: 'default',
    }

    try {
        console.log('sending message to sqs')
        const sqsResponse = await new Promise((resolve, reject) => {
            sqs.sendMessage(params, function (err: any, data: any) {
                if (err) {
                    console.log('Error sending message to SQS', err)
                    reject(err)
                } else {
                    console.log('Successfully sent message to SQS', data.MessageId)
                    resolve(data.MessageId)
                }
            })
        })
        console.log({ sqsResponse })
    } catch (err) {
        console.error('error with sqs', err)
    }
}
export async function handleNewAugmentation(dataset_id: any, uri: string) {
    console.log('handleNewAugmentation')
    const result = await db
        .update(dataset)
        .set({
            dataset_uri: uri,
        })
        .where(eq(dataset.id, dataset_id))
    console.log('handleNewAugmentation result', result)
    return 'Success'
}
export async function getAugmentationCsvUrl(dataset_id: any) {
    const dbResult = await db
        .select({
            augmented_uri: dataset.augmented_uri,
        })
        .from(dataset)
        .where(eq(dataset_id, dataset.id))
        .limit(1)

    console.log('getAugmentationCsvUrl', dbResult?.[0]?.augmented_uri)

    return dbResult?.[0]?.augmented_uri
}
export async function getAugmentationIdByUri(uri: any) {
    const dbResult = await db
        .select({
            id: dataset.id,
        })
        .from(dataset)
        .where(eq(uri, dataset.dataset_uri))
        .limit(1)

    console.log('getAugmentationCsvUrl', dbResult?.[0]?.id)

    return dbResult?.[0]?.id
}

export interface GetFileProps {
    url: string
}

export async function getCsvSignedUrl(key: string) {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
    })

    const url = await getSignedUrl(s3Client, command, { expiresIn: 900 })
    return url
}

export async function getCsvFromS3(key?: string | null) {
    if (!key) {
        return null
    }
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
    })

    const response = await s3Client.send(command)
    // The Body object also has 'transformToByteArray' and 'transformToWebStream' methods.
    if (!response?.Body) {
        return null
    }
    const str = await response.Body.transformToString()
    if (!str) {
        throw 'No content'
    }
    return str
}
