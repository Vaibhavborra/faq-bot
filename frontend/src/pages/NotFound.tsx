import { Button, Card, Flex, Heading, Text } from '@aws-amplify/ui-react'
import { Logo } from '../components/icons'
import { navigate } from '../router'

export function NotFound() {
  return (
    <Flex minHeight="100vh" alignItems="center" justifyContent="center" padding="24px 16px">
      <Card variation="elevated" className="review" textAlign="center" maxWidth="420px" width="100%">
        <Flex direction="column" alignItems="center" gap="10px">
          <Logo size={52} />
          <Heading level={3}>Off the trail</Heading>
          <Text color="font.secondary">We couldn’t find that page.</Text>
          <Button variation="primary" onClick={() => navigate('/')}>Back to home</Button>
        </Flex>
      </Card>
    </Flex>
  )
}
