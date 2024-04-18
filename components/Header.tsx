import Image from 'next/image'
import Link from 'next/link'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { twMerge } from 'tailwind-merge'
import { ModeToggle } from './theme-toggle'
import { Button } from '@/components/ui/button'
// ;('react-icons/fi')

// Header component using <SignedIn> & <SignedOut>.
//
// The SignedIn and SignedOut components are used to control rendering depending
// on whether or not a visitor is signed in.
//
// https://docs.clerk.dev/frontend/react/signedin-and-signedout
type Props = {
    className?: string
}
const Header = (props: Props) => (
    <header
        className={twMerge(
            'flex justify-between p-4 absolute w-full top-0 backdrop-blur backdrop-brightness-50 border-b-2 z-50',
            props.className
        )}
    >
        <div className={'flex items-center'}>
            <Link href="/" className={'flex'}>
                {/* <Image className='fill-primary' src="/logo.svg" width="32" height="32" alt="Logo" /> */}
                {/* <Logo /> */}
                <span className="ml-3 font-bold">Large Data Model</span>
            </Link>
        </div>
        <div className={'flex items-center'}>
            <SignedOut>
                <Button asChild variant="ghost">
                    <Link href="/dashboard" className="font-bold">
                        Sign in
                    </Link>
                </Button>
            </SignedOut>
            <SignedIn>
                {/* <UsesLeft /> */}
                <ModeToggle />
                <div className="ml-4" />
                <UserButton
                    userProfileMode="navigation"
                    userProfileUrl="/user"
                    afterSignOutUrl="/"
                    afterMultiSessionSingleSignOutUrl="/"
                />
            </SignedIn>
        </div>
    </header>
)

export default Header
