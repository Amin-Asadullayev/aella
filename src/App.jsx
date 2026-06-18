import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "@/lib/AuthContext"
import Chat from "./pages/Chat"
import Login from "./pages/Login"

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PrivateRoute><Chat /></PrivateRoute>} />
      <Route path="/login" element={<Login />} />
    </Routes>
  )
}