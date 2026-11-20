import { useEffect, useState } from 'react'
import { Alert, Authenticator, Heading, Text, View, useAuthenticator } from '@aws-amplify/ui-react'
import { confirmSignUp, signIn, type ConfirmSignUpInput, type SignInInput } from 'aws-amplify/auth'
import { Logo } from '../components/icons'
import { Link, navigate } from '../router'

/** Turn the Cognito pre-authentication errors from our Lambda into friendly messages. */
function friendlyAuthError(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes('PENDING_APPROVAL')) {
    throw new Error('Thanks for signing up! Your account is waiting for approval. You can sign in as soon as it’s approved.')
  }
  if (msg.includes('ACCOUNT_DENIED')) {
    throw new Error('Sorry, this account wasn’t approved for access.')
  }
  throw err
}

const FORM_FIELDS = {
  signUp: {
    name: { label: 'Full name', placeholder: 'Jane Hiker', isRequired: true, order: 1 },
    email: { label: 'Email', placeholder: 'you@example.com', order: 2 },
    password: { label: 'Password', placeholder: 'At least 8 characters, with a number', order: 3 },
    confirm_password: { label: 'Confirm password', order: 4 },
  },
  signIn: {
    username: { label: 'Email', placeholder: 'you@example.com' },
  },
}

export function AuthPage({ initialState }: { initialState: 'signIn' | 'signUp' }) {
  const { authStatus, route } = useAuthenticator((c) => [c.authStatus, c.route])
  const [justConfirmed, setJustConfirmed] = useState(false)

  useEffect(() => {
    if (authStatus === 'authenticated') navigate('/chat', true)
  }, [authStatus])

  // Keep the URL in sync with the tab the person is on.
  useEffect(() => {
    if (route === 'signIn' && location.pathname !== '/login') history.replaceState(null, '', '/login')
    if (route === 'signUp' && location.pathname !== '/register') history.replaceState(null, '', '/register')
    if (route === 'signUp') setJustConfirmed(false)
  }, [route])

  const services = {
    // The Authenticator calls this with just the input; the cast matches signIn's overloaded type.
    handleSignIn: (async (input: SignInInput) => {
      try {
        return await signIn(input)
      } catch (err) {
        return friendlyAuthError(err)
      }
    }) as typeof signIn,
    handleConfirmSignUp: (async (input: ConfirmSignUpInput) => {
      await confirmSignUp(input)
      setJustConfirmed(true)
      // New accounts need approval, so skip auto sign-in and go to the sign-in screen.
      return { isSignUpComplete: true, nextStep: { signUpStep: 'DONE' as const } }
    }) as typeof confirmSignUp,
  }

  return (
    <div className="auth">
      <aside className="auth-art">
        <Link href="/" className="brand brand-light"><Logo />Trailhead Outfitters</Link>
        <div className="auth-copy">
          <Heading level={2}>Your trail questions, answered in seconds.</Heading>
          <Text>Hours, returns, shipping, rentals and rewards, straight from our official FAQ.</Text>
          <ul className="auth-steps">
            <li><b>1</b> Register and confirm your email</li>
            <li><b>2</b> We review and approve your request</li>
            <li><b>3</b> Sign in and stay signed in</li>
          </ul>
        </div>
        <svg className="mtn" viewBox="0 0 600 220" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 220 120 90l70 70 110-130 110 120 60-50 130 120Z" fill="#fff" opacity=".08" />
          <path d="M0 220 80 150l90 40 130-100 120 90 80-40 100 80Z" fill="#fff" opacity=".1" />
        </svg>
      </aside>

      <main className="auth-main">
        <View width="100%" maxWidth="460px">
          <Link href="/" className="brand auth-mobile-brand"><Logo />Trailhead Outfitters</Link>
          {justConfirmed && route === 'signIn' && (
            <Alert variation="success" heading="Email confirmed" marginBottom="16px" isDismissible>
              Your request has been sent for approval. You can sign in here as soon as it’s approved.
            </Alert>
          )}
          <Authenticator
            initialState={initialState}
            signUpAttributes={['name']}
            loginMechanisms={['email']}
            formFields={FORM_FIELDS}
            services={services}
            components={{
              Header: () => (
                <View textAlign="center" padding="8px 0 20px">
                  <Heading level={3} className="auth-title">
                    {initialState === 'signUp' ? 'Request access' : 'Welcome back'}
                  </Heading>
                  <Text color="font.secondary" fontSize="15px">
                    Chat with the Trailhead Assistant
                  </Text>
                </View>
              ),
              Footer: () => (
                <View textAlign="center" padding="16px 0 0">
                  <Link href="/" className="muted-link">← Back to home</Link>
                </View>
              ),
            }}
          >
            {() => <Text textAlign="center">Signing you in…</Text>}
          </Authenticator>
        </View>
      </main>
    </div>
  )
}
