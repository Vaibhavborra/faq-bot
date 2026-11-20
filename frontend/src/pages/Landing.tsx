import { Badge, Button, Card, Flex, Grid, Heading, Text, View, useAuthenticator } from '@aws-amplify/ui-react'
import { Icon, Logo, TOPICS } from '../components/icons'
import { Link, navigate } from '../router'

export function Nav() {
  const { authStatus } = useAuthenticator((c) => [c.authStatus])
  const signedIn = authStatus === 'authenticated'
  return (
    <Flex as="header" className="wrap" justifyContent="space-between" alignItems="center" padding="20px 0" gap="12px">
      <Link href="/" className="brand"><Logo />Trailhead Outfitters</Link>
      <Flex gap="10px">
        {signedIn ? (
          <Button variation="primary" onClick={() => navigate('/chat')}>Open assistant</Button>
        ) : (
          <>
            <Button className="hide-sm" onClick={() => navigate('/login')}>Sign in</Button>
            <Button variation="primary" onClick={() => navigate('/register')}>Register</Button>
          </>
        )}
      </Flex>
    </Flex>
  )
}

const PREVIEW = [
  ['user', 'Can I rent a tent for the weekend?'],
  ['bot', 'Yes! Tents rent for $25 per day. There’s a $100 deposit, refunded when the gear comes back clean.'],
  ['user', 'And do you ship to Canada?'],
  ['bot', 'Not right now. We currently ship only within the United States.'],
] as const

const STEPS = [
  ['01', 'Register', 'Create an account with your name, email and a password, then confirm the code we email you.'],
  ['02', 'Get approved', 'Our team reviews every request, usually the same day.'],
  ['03', 'Ask away', 'Sign in with the same email and password and start chatting. You stay signed in on your device.'],
] as const

export function Landing() {
  return (
    <View className="page">
      <Nav />

      <Grid as="section" className="wrap hero" templateColumns={{ base: '1fr', large: '1.05fr .95fr' }} gap="48px" alignItems="center">
        <View>
          <Badge className="eyebrow" variation="success"><span className="dot" />Trailhead Assistant</Badge>
          <Heading level={1} className="display">Answers before you <em>hit the trail.</em></Heading>
          <Text className="lead">
            Our assistant knows our store policies inside out: hours, returns, shipping, gear rentals and Trail Points.
            Ask in plain English and get a clear answer in seconds, any time of day.
          </Text>
          <Flex gap="12px" wrap="wrap">
            <Button variation="primary" size="large" onClick={() => navigate('/register')} gap="8px">
              Request access <Icon name="arrow" size={16} />
            </Button>
            <Button size="large" onClick={() => navigate('/login')}>I already have an account</Button>
          </Flex>
          <Flex className="hero-note" alignItems="center" gap="8px">
            <Icon name="shield" size={16} /> Answers come only from our official customer FAQ.
          </Flex>
        </View>

        <Card variation="elevated" className="preview" aria-hidden="true">
          <Flex alignItems="center" gap="10px" className="preview-head">
            <span className="avatar-bot"><Logo size={22} /></span>
            <View>
              <Text fontWeight={600} fontSize="14px">Trailhead Assistant</Text>
              <Text fontSize="12px" color="#2f7d4f">● Online now</Text>
            </View>
          </Flex>
          {PREVIEW.map(([who, text], i) => (
            <div key={i} className={`mini ${who}`}>{text}</div>
          ))}
        </Card>
      </Grid>

      <View as="section" className="section section-alt">
        <View className="wrap">
          <View className="section-head">
            <Heading level={2}>What you can ask about</Heading>
            <Text>Everything in our customer FAQ, answered the same way every time, with no hold music.</Text>
          </View>
          <Grid templateColumns={{ base: '1fr', medium: '1fr 1fr', large: 'repeat(3, 1fr)' }} gap="18px">
            {TOPICS.map((t) => (
              <Card key={t.title} variation="outlined" className="topic-card">
                <span className="icon-tile"><Icon name={t.icon} /></span>
                <Heading level={3}>{t.title}</Heading>
                <Text>{t.blurb}</Text>
              </Card>
            ))}
          </Grid>
        </View>
      </View>

      <View as="section" className="section">
        <View className="wrap">
          <View className="section-head">
            <Heading level={2}>How access works</Heading>
            <Text>The assistant is invite-only while we’re in early access.</Text>
          </View>
          <Grid templateColumns={{ base: '1fr', large: 'repeat(3, 1fr)' }} gap="18px">
            {STEPS.map(([n, title, text]) => (
              <Card key={n} variation="outlined" className="topic-card">
                <Text className="step-num">{n}</Text>
                <Heading level={3}>{title}</Heading>
                <Text>{text}</Text>
              </Card>
            ))}
          </Grid>
        </View>
      </View>

      <View as="section" className="wrap" paddingBottom="56px">
        <Flex className="banner" justifyContent="space-between" alignItems="center" wrap="wrap" gap="24px">
          <View>
            <Heading level={2}>Ready when you are.</Heading>
            <Text>Request access now. It takes less than a minute.</Text>
          </View>
          <Button className="btn-ember" size="large" onClick={() => navigate('/register')}>Create an account</Button>
          <svg className="mtn" viewBox="0 0 420 160" fill="#fff" aria-hidden="true"><path d="M0 160 90 50l50 60 60-90 80 100 40-40 100 80Z" /></svg>
        </Flex>
      </View>

      <Flex as="footer" className="wrap footer" justifyContent="space-between" wrap="wrap" gap="12px">
        <span>© Trailhead Outfitters · Demo project</span>
        <span>Powered by Claude on Amazon Bedrock · Accounts by Amazon Cognito</span>
      </Flex>
    </View>
  )
}
