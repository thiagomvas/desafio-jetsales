import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface Task {
  id: string
  title: string
  description: string
  scheduledAt: string // or datetime string
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${backendUrl}/tasks`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        return res.json()
      })
      .then(data => {
        setTasks(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank" rel="noreferrer">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>

      <div className="card">
        {loading && <p>Loading tasks...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {!loading && !error && (
          <>
            {tasks.length === 0 ? (
              <p>No tasks found.</p>
            ) : (
              <ul>
                {tasks.map(task => (
                  <li key={task.id}>
                    <strong>{task.title}</strong><br />
                    <em>{task.description}</em><br />
                    <small>Scheduled at: {new Date(task.scheduledAt).toLocaleString()}</small>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
