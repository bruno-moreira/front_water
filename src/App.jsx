import { useState } from 'react'
import './App.css'
import Dashboard from './components/Dashboard.tsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app-root">
      <Dashboard />
    </div>
  )
}

export default App
