import { Navigate, Route, Routes } from 'react-router'
import RequireAuth from './auth/RequireAuth'
import ChatList from './components/ChatList'
import ChatThread from './components/ChatThread'
import HirePage from './components/HirePage'
import HireSetup from './components/HireSetup'
import Landing from './components/Landing'
import Layout from './components/Layout'
import LoginPage from './components/LoginPage'
import NearbyList from './components/NearbyList'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Landing />} />
        <Route
          path="nearby"
          element={
            <RequireAuth message="Create an account or log in to find people near you.">
              <NearbyList />
            </RequireAuth>
          }
        />
        <Route
          path="chats"
          element={
            <RequireAuth message="Create an account or log in to see your chats.">
              <ChatList />
            </RequireAuth>
          }
        />
        <Route
          path="chats/:conversationId"
          element={
            <RequireAuth message="Create an account or log in to see your chats.">
              <ChatThread />
            </RequireAuth>
          }
        />
        <Route
          path="hire/setup"
          element={
            <RequireAuth message="Create an account or log in to set up your Hire page.">
              <HireSetup />
            </RequireAuth>
          }
        />
        <Route
          path="hire/:userId"
          element={
            <RequireAuth message="Create an account or log in to view this Hire page.">
              <HirePage />
            </RequireAuth>
          }
        />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<LoginPage mode="signup" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
