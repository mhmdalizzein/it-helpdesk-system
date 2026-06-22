import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TicketList from './pages/TicketList'
import TicketCreate from './pages/TicketCreate'
import TicketDetail from './pages/TicketDetail'
import Notifications from './pages/Notifications'
import Reports from './pages/Reports'
import AdminSettings from './pages/AdminSettings'
import ManageUsers from './pages/ManageUsers'
import UserProfile from './pages/UserProfile'
import AIAssistant from './pages/AIAssistant'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/tickets" element={<TicketList />} />
      <Route path="/tickets/create" element={<TicketCreate />} />
      <Route path="/tickets/:id" element={<TicketDetail />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
      <Route path="/admin/users" element={<ManageUsers />} />
      <Route path="/profile" element={<UserProfile />} />
      <Route path="/ai-assistant" element={<AIAssistant />} />
    </Routes>
  )
}

export default App
