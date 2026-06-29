import { useEffect } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "@/lib/AuthContext"
import Chat from "./pages/Chat"
import Login from "./pages/Login"

function DocumentTitle({ title, children }) {
  useEffect(() => {
    document.title = title
  }, [title])

  return children
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <PrivateRoute>
            <DocumentTitle title="Aella Chat">
              <Chat />
            </DocumentTitle>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/login" 
        element={
          <DocumentTitle title="Aella | Login">
            <Login />
          </DocumentTitle>
        } 
      />
    </Routes>
  )
}