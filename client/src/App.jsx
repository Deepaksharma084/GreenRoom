import { Routes, Route } from 'react-router-dom'
import './App.css'
import LoginPage from './pages/LoginPage'
import CreateOrJoinRoomPage from './pages/CreateOrJoinRoomPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/CreateOrJoinRoomPage" element={<CreateOrJoinRoomPage />} />
    </Routes>
  )
}
