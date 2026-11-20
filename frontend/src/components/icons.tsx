import type { ReactNode } from 'react'

const PATHS: Record<string, ReactNode> = {
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  returns: <><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></>,
  truck: <><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></>,
  tent: <><path d="M3 20 12 4l9 16Z" /><path d="M9 20l3-6 3 6" /></>,
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />,
  mail: <><path d="M4 5h16v14H4z" /><path d="m4 6 8 7 8-7" /></>,
  shield: <><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6Z" /><path d="m9 12 2 2 4-4" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  logout: <><path d="M15 4h4v16h-4" /><path d="M10 8l-4 4 4 4M6 12h10" /></>,
}

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  )
}

export function Logo({ size = 36 }: { size?: number }) {
  return <img src="/logo.svg" width={size} height={size} alt="" style={{ display: 'block' }} />
}

export const TOPICS: { icon: IconName; title: string; blurb: string; question: string }[] = [
  { icon: 'clock', title: 'Store hours', blurb: 'When we open and close, plus the holidays we take off.', question: 'What are your store hours?' },
  { icon: 'returns', title: 'Returns', blurb: '30-day refunds, 14-day exchanges, and what counts as final sale.', question: 'What is your return policy?' },
  { icon: 'truck', title: 'Shipping', blurb: 'Free shipping thresholds, delivery times and express options.', question: 'How much is shipping and how long does it take?' },
  { icon: 'tent', title: 'Gear rentals', blurb: 'Tent and sleeping bag rates, deposits and how returns work.', question: 'How does camping gear rental work?' },
  { icon: 'star', title: 'Trail Points', blurb: 'How you earn points and when they turn into rewards.', question: 'How does the Trail Points loyalty program work?' },
  { icon: 'mail', title: 'Contact us', blurb: 'Who to email or call when you need a real person.', question: 'How do I contact customer service?' },
]
