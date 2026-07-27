import { Routes, Route, Navigate } from 'react-router-dom'
import MapScreen from './features/map/MapScreen'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MapScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
