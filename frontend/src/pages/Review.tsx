import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, Flex, Grid, Heading, Loader, Text } from '@aws-amplify/ui-react'
import { Logo } from '../components/icons'

type Status = 'pending' | 'approved' | 'denied'
interface Signup { name: string; email: string; status: Status }

const BADGE: Record<Status, 'warning' | 'success' | 'error'> = { pending: 'warning', approved: 'success', denied: 'error' }

/** Admin page opened from the Approve / Deny links in the sign-up email. */
export function Review() {
  const params = new URLSearchParams(location.search)
  const u = params.get('u') ?? ''
  const sig = params.get('sig') ?? ''
  const suggested = params.get('action')

  const [user, setUser] = useState<Signup | null>(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/user?u=${encodeURIComponent(u)}&sig=${encodeURIComponent(sig)}`)
      .then(async (r) => {
        const body = await r.json()
        if (!r.ok) throw new Error(body.error)
        setUser(body)
      })
      .catch((e: Error) => setError(e.message || 'Could not load this sign-up.'))
  }, [u, sig])

  async function decide(action: 'approve' | 'deny') {
    setBusy(true); setError(''); setResult('')
    try {
      const r = await fetch('/api/admin/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ u, sig, action }),
      })
      const body = await r.json()
      if (!r.ok) throw new Error(body.error)
      setUser((prev) => (prev ? { ...prev, status: body.status } : prev))
      setResult(body.status === 'approved'
        ? 'Approved. They can now sign in with their email and password.'
        : 'Denied. They won’t be able to sign in.')
    } catch (e) {
      setError((e as Error).message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Flex minHeight="100vh" alignItems="center" justifyContent="center" padding="24px 16px">
      <Card variation="elevated" className="review" width="100%" maxWidth="460px">
        <Flex direction="column" alignItems="center" gap="6px">
          <Logo size={52} />
          <Heading level={3} marginTop="10px">Review sign-up</Heading>
          <Text color="font.secondary" textAlign="center">Approve to let this person sign in, or deny to block them.</Text>
        </Flex>

        {!user && !error && <Flex justifyContent="center" padding="32px"><Loader size="large" /></Flex>}

        {user && (
          <Card variation="outlined" className="who" margin="20px 0">
            <Flex justifyContent="space-between"><Text color="font.secondary">Name</Text><Text fontWeight={600}>{user.name}</Text></Flex>
            <Flex justifyContent="space-between"><Text color="font.secondary">Email</Text><Text fontWeight={600}>{user.email}</Text></Flex>
            <Flex justifyContent="space-between" alignItems="center"><Text color="font.secondary">Status</Text><Badge variation={BADGE[user.status]}>{user.status}</Badge></Flex>
          </Card>
        )}

        {result && <Alert variation="success" marginBottom="14px">{result}</Alert>}
        {error && <Alert variation="error" marginTop="16px" marginBottom="14px">{error}</Alert>}

        {user && (
          <Grid templateColumns="1fr 1fr" gap="10px">
            <Button className={`btn-approve ${suggested === 'approve' ? 'suggested' : ''}`} isLoading={busy} onClick={() => decide('approve')}>Approve</Button>
            <Button className={`btn-deny ${suggested === 'deny' ? 'suggested' : ''}`} isLoading={busy} onClick={() => decide('deny')}>Deny</Button>
          </Grid>
        )}
      </Card>
    </Flex>
  )
}
