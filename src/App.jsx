import { Navigate, Route, Routes } from 'react-router'
import RequireAuth from './auth/RequireAuth'
import AccountPage from './components/AccountPage'
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
            <RequireAuth message="Đăng ký hoặc đăng nhập để tìm người quanh bạn.">
              <NearbyList />
            </RequireAuth>
          }
        />
        <Route
          path="chats"
          element={
            <RequireAuth message="Đăng ký hoặc đăng nhập để xem tin nhắn của bạn.">
              <ChatList />
            </RequireAuth>
          }
        />
        <Route
          path="chats/:conversationId"
          element={
            <RequireAuth message="Đăng ký hoặc đăng nhập để xem tin nhắn của bạn.">
              <ChatThread />
            </RequireAuth>
          }
        />
        <Route
          path="hire/setup"
          element={
            <RequireAuth message="Đăng ký hoặc đăng nhập để tạo trang Hire.">
              <HireSetup />
            </RequireAuth>
          }
        />
        <Route
          path="hire/:userId"
          element={
            <RequireAuth message="Đăng ký hoặc đăng nhập để xem trang Hire này.">
              <HirePage />
            </RequireAuth>
          }
        />
        <Route
          path="account"
          element={
            <RequireAuth message="Đăng ký hoặc đăng nhập để xem tài khoản.">
              <AccountPage />
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
