import { NextResponse } from 'next/server'
import OpenAI from 'openai'
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})
import { auth, currentUser, redirectToSignIn } from '@clerk/nextjs'

export async function GET(request: Request) {
    const { userId } = auth()

    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 })
    }
    const user = await currentUser()
    if (!user) {
        return NextResponse.json(
            { error: { message: 'User not defined' } },
            { status: 500 }
        )
    }
    console.log({ emails: user?.emailAddresses })
    if (
        !user.emailAddresses.find(
            (item) => item.emailAddress === 'micahj2110@gmail.com'
        )
    ) {
        return NextResponse.json(
            { error: { message: 'Forbidden' } },
            { status: 403 }
        )
    }
    console.log('get request made', request.url)
    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: `You are a Large Data Model. You create datasets to train AI. 
                 Return Only comma separated rows of data.`,
            },
            {
                role: 'user',
                content: `Make me a dataset for a sentiment classification system.

                There should be 5 rows
                
                Columns:
                - chat: this column will contain a transcription of the user voice on a call
                - sentiment: this column will contain the sentiment of the user transcription. The different sentiments are "positive", "negative", and "neutral"
                `,
            },
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
    const response = NextResponse.json({
        success: true,
        completion: completion?.choices?.[0]?.message?.content,
    })
    return response
}
