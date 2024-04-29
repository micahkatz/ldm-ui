import GradientText from '@/components/GradientText'
import { Button } from '@/components/ui/button'
import { NextScript } from 'next/document'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'

export default function LandingPage() {
    return (
        <main className="flex flex-1 flex-col p-8 gap-4 items-center justify-center">
            <div className="max-w-xl mb-2 pt-8">
                <h1 className="text-center text-4xl font-bold tracking-tight sm:text-6xl sm:tracking-tight lg:text-[4rem]">
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
                {/* <Link href="/dashboard">Get Started</Link> */}
                <Link href="/waitlist">Join the Waitlist</Link>
            </Button>
            <div className="items-start flex flex-col max-w-2xl">
                <h2 className="text-4xl font-bold mb-8">Why DataSynth AI?</h2>
                <p className="text-lg mb-4">
                    In today's data-driven world, the success of machine
                    learning models hinges on the quality and quantity of data
                    they're trained on. However, acquiring diverse, labeled data
                    at scale remains a monumental challenge for many businesses.
                    That's where DataSynth AI steps in.
                </p>
                <div className="mb-8" />
                <h2 className="text-4xl font-bold mb-8">The Problem</h2>
                <p className="text-lg mb-4">
                    Traditional data augmentation methods often fall short in
                    producing truly diverse and realistic data, leading to
                    biased models and limited generalization. Additionally,
                    manually labeling data is time-consuming and costly,
                    hindering the pace of innovation in AI.
                </p>
                <div className="mb-8" />
                <h2 className="text-4xl font-bold mb-8">Our Solution</h2>
                <p className="text-lg mb-4">
                    At DataSynth AI, we've revolutionized the data augmentation
                    and generation landscape. Our cutting-edge platform utilizes
                    advanced machine learning algorithms and our custom Large
                    Data Model (LDM) to create high-quality synthetic data that
                    mirrors real-world scenarios. By harnessing the power of our
                    LDM and other state-of-the-art techniques, we produce vast
                    datasets with diverse variations, ensuring robust model
                    performance across various applications.
                </p>
                <div className="mb-8" />
                <h2 className="text-4xl font-bold mb-8">Benefits</h2>
                <p className="text-lg mb-4">
                    <span className="font-bold">
                        Accelerate Model Development
                    </span>
                    : With our platform, you can exponentially expand your
                    dataset, enabling faster model training and iteration
                    cycles.
                </p>
                <p className="text-lg mb-4">
                    <span className="font-bold">Enhance Model Performance</span>
                    : Our synthetic data is carefully crafted to cover diverse
                    edge cases and scenarios, resulting in more robust and
                    reliable AI models.
                </p>
                <p className="text-lg mb-4">
                    <span className="font-bold">Cost-Efficient Solution</span>:
                    Say goodbye to the high costs associated with manual data
                    labeling and collection. Our automated approach delivers
                    cost-effective data augmentation and generation at scale.
                </p>
                <p className="text-lg mb-4">
                    <span className="font-bold">Ethical AI</span>: By reducing
                    the reliance on real-world data, DataSynth AI helps mitigate
                    privacy concerns and ethical dilemmas associated with
                    large-scale data collection.
                </p>
                <div className="mb-32" />
                <p className="text-lg mb-8">
                    Join the revolution in data augmentation and generation with
                    DataSynth AI. Empower your AI initiatives with limitless,
                    high-quality data.
                </p>
                <Button className="text-lg mb-16 self-center" asChild>
                    <Link href="/waitlist">Join the Waitlist</Link>
                </Button>
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
