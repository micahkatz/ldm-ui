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
    const result = await db.insert(dataset).values({
        prompt,
        column_data: makeColumnText(),
        user_id: userId
    })
    console.log({ result })

    // return `cheese,drink,customer
    // American,Soda,Vegetarian
    // Cheddar,Beer,Carnivore
    // Swiss,Water,Fitness Enthusiast`
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

    console.log(completion.choices[0])
    const response = completion?.choices?.[0]?.message?.content
    return response
}
