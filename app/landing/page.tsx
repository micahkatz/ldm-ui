import GradientText from '@/components/GradientText'
import { Button } from '@/components/ui/button'
import { NextScript } from 'next/document'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'

export default function LandingPage() {
    return (
        <main className="flex flex-1 flex-col p-8 gap-4 items-center justify-center">
            <div className="max-w-xl mb-2">
                <h1 className="text-center text-4xl font-bold tracking-tight sm:text-6xl sm:tracking-tight lg:text-[4rem] xl:text-[6rem] xl:tracking-tight 2xl:text-[6.5rem]">
                    {'Data '}
                    <span className="text-primary brightness-150">
                        generation
                    </span>
                    {' and '}
                    <span className="whitespace-nowrap text-[#c628d9] brightness-150">
                        augmentation
                    </span>
                    {/* {' and data '}
                    <span className="text-[#283bd9] brightness-150">
                        validation
                    </span> */}{' '}
                    made easy with AI
                </h1>
            </div>
            <Button variant={'secondary'} className="text-lg mb-8" asChild>
                <Link href="/">Get Started</Link>
            </Button>
            <div className="items-start flex flex-col max-w-2xl">
                <h2 className="text-4xl font-bold mb-8">The Problem</h2>
                <p className="text-lg mb-4">
                    Creating AI models is not very accessible at the moment. You
                    need vast amounts of data or the ability to create that
                    data.
                </p>
                <p className="text-lg">
                    Scratch AI provides the ability to not only create data from
                    scratch, but also to augment that data and provide
                    variation.
                </p>
                <div className="mb-8" />
                <h2 className="text-4xl font-bold mb-8">Meet the Team</h2>
                <div className="flex items-center gap-8">
                    <div className="flex flex-col items-center">
                        <Image
                            src="/micah.jpg"
                            alt="Micah Katz"
                            width={100}
                            height={100}
                            className="object-cover h-40 w-40 rounded-full mb-2"
                        />
                        <span className="text-lg font-semibold">
                            Micah Katz
                        </span>
                        <span className="">AI Software Developer</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <Image
                            src="/brady.jpeg"
                            alt="Brady Steele"
                            width={100}
                            height={100}
                            className="object-cover h-40 w-40 rounded-full mb-2"
                        />
                        <span className="text-lg font-semibold">
                            Brady Steele
                        </span>
                        <span className="">AI Software Developer</span>
                    </div>
                    {/* </div> */}
                </div>
            </div>
        </main>
    )
    // return (
    //     <main className="flex min-h-screen flex-col items-center p-24 bg-background">
    //         <div className="flex flex-col max-w-2xl">
    //             <h1>Landing</h1>
    //         </div>
    //     </main>
    // )
}
