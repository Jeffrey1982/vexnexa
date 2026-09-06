import type { Metadata } from 'next'
import VerifiedClient from './VerifiedClient'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Email verified | VexNexa',
  robots: {
    index: false,
    follow: false,
  },
}

export default function VerifiedPage(): JSX.Element {
  return <Suspense><VerifiedClient /></Suspense>
}
