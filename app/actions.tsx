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
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
import { eq } from 'drizzle-orm'
import AWS from 'aws-sdk'
AWS.config.update({ region: 'us-east-1' })
var sqs = new AWS.SQS({ region: 'us-east-1' })

type ColumnType = {
    name: string
    description: string
    id: string
}
export async function handleCreateDataset({
    prompt,
    columns,
}: {
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

    There should be ${columns.length} rows

    Columns:
    ${makeColumnText()}
    `

    // return {
    //     llmResponse: `cheese,drink,customer
    // American,Soda,Vegetarian
    // Cheddar,Beer,Carnivore
    // Swiss,Water,Fitness Enthusiast`,
    // }
    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: `You are a Large Data Model. You create datasets to train AI.
                 Return Only comma separated rows of data. Include the header.`,
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
        const s3Client = new S3Client({ region: process.env.AWS_REGION })
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
                prompt,
                column_data: makeColumnText(),
                user_id: userId,
                original_dataset_uri: objectKey,
            })
            .returning({ insertedId: dataset.id })

        console.log({ result })

        return { llmResponse, datasetId: result?.[0]?.insertedId }
    }
    return { llmResponse }
}

export async function augmentDataset(
    datasetId: string | null | undefined | number,
    csv_data: string | null | undefined
) {
    const { userId } = auth()

    if (!userId) {
        throw new Error('Unauthorized')
    }
    if (!datasetId || !csv_data || !process.env.SQS_URL) {
        throw new Error('Invalid request')
    }
    var params: AWS.SQS.SendMessageRequest = {
        MessageAttributes: {
            uid: {
                DataType: 'String',
                StringValue: userId,
            },
        },
        MessageBody: `${datasetId}///////${csv_data}`,
        QueueUrl: process.env.SQS_URL,
        MessageGroupId: 'default',
        MessageDeduplicationId: 'default',
    }

    try {
        const sqsResponse = await new Promise((resolve, reject) => {
            sqs.sendMessage(params, function (err: any, data: any) {
                if (err) {
                    console.log('Error', err)
                    reject(err)
                } else {
                    console.log('Success', data.MessageId)
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
            augmented_dataset_uri: uri,
        })
        .where(eq(dataset.id, dataset_id))
    console.log('handleNewAugmentation result', result)
    return 'Success'
}
