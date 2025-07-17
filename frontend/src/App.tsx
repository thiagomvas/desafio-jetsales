import { useEffect, useState } from 'react'
import './App.css'
import DataTable from './components/DataTable/DataTable'

const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface Task {
  id: string
  title: string
  description: string
  createdAt: string 
  updatedAt: string
  dueDate?: string
  completed: boolean
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
      <DataTable
        columns={['ID', 'Title', 'Description', 'Completed', 'Due Date', 'User ID', 'Created At', 'Updated At']}
        data={tasks.map(task => ({
          ID: task.id,
          Title: task.title,
          Description: task.description,
          Completed: task.completed ? '✅' : '❌',
          'Due Date': task.dueDate ? new Date(task.dueDate).toLocaleString() : 'N/A',
          'User ID': (task as any).userId, // if userId is present
          'Created At': new Date(task.createdAt).toLocaleString(),
          'Updated At': new Date(task.updatedAt).toLocaleString(),
        }))}
      />

      {loading && <p>Loading tasks...</p>}
      {error && <p>Error loading tasks: {error}</p>}
        
    </>
  )
}

export default App
