import type { Metadata } from 'next'
import VerifiedClient from './VerifiedClient'

export const metadata: Metadata = {
  title: 'Email verified | VexNexa',
  robots: {
    index: false,
    follow: false,
  },
}

export default function VerifiedPage(): JSX.Element {
  return <VerifiedClient />
}
