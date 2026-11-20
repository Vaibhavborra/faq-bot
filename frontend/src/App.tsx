import { Landing } from './pages/Landing'
import { AuthPage } from './pages/AuthPage'
import { Chat } from './pages/Chat'
import { Review } from './pages/Review'
import { NotFound } from './pages/NotFound'
import { usePath } from './router'

export default function App() {
  const path = usePath().replace(/\/+$/, '') || '/'
  switch (path) {
    case '/':
      return <Landing />
    case '/login':
      return <AuthPage initialState="signIn" />
    case '/register':
      return <AuthPage initialState="signUp" />
    case '/chat':
      return <Chat />
    case '/admin/review':
      return <Review />
    default:
      return <NotFound />
  }
}
