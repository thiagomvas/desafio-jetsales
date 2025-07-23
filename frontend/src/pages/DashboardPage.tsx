/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import styles from '../styles/DashboardPage.module.css'; 
import { api } from '../api'; // Your API client
import DataTable from '../components/DataTable/DataTable';

type Task = {
  id: number;
  title: string;
  description: string;
  dueDate: string | null;
  completed: boolean;
};

type User = {
  id: number;
  name: string;
  email: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [formVisible, setFormVisible] = useState(false);

  function localDateTimeToUtcIso(dateTimeLocal?: string): string | undefined {
    if (!dateTimeLocal) return undefined;
    const [date, time = '00:00:00'] = dateTimeLocal.split('T');
    const [year, month, day] = date.split('-').map(Number);
    const [hour = 0, minute = 0, second = 0] = time.split(':').map(Number);
    // Create a Date object in local timezone
    const localDate = new Date(year, month - 1, day, hour, minute, second);
    return localDate.toISOString();
  }
  

  const markTaskCompleted = async (taskId: number) => {
    try {
      await api.patchTask(taskId, { completed: true });
      fetchTasks(); // Refresh task list
    } catch {
      setError('Failed to mark task as completed');
    }
  };
  const deleteTask = async (taskId: number) => {
    try {
      await api.deleteTask(taskId);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch {
      setError('Failed to delete task');
    }
  };
  
  
  
  const fetchUser = async () => {
    try {
      const data = await api.getCurrentUser();
      setUser(data);
    } catch {
      setError('Failed to load user info');
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.fetchTasksForUser();
      setTasks(data);
    } catch {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchTasks();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
  
    if (!title || !description) {
      setError('Title and description are required');
      return;
    }
  
    try {
      await api.createTask({
        title,
        description,
        dueDate: localDateTimeToUtcIso(dueDate),
      });
  
      setTitle('');
      setDescription('');
      setDueDate('');
      setFormVisible(false);
      fetchTasks();
    } catch (error: any) {
      console.error('Error creating task:', error);
      setError(error.error || error.message || 'Failed to add task');
    }
  };
  

  // --- Analysis helpers ---

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7); // exactly 7 days from now


  const tasksDueThisWeek = tasks.filter(t => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    return due >= now && due <= sevenDaysFromNow && !t.completed;
  });

  // Return color based on how soon the due date is: green (>4 days), orange (1-4 days), red (<1 day)
  const getDueColor = (dueDate: string | null) => {
    if (!dueDate) return 'inherit';
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 1) return 'var(--accent)';      // urgent (red-ish)
    if (diffDays < 4) return 'orange';             // warning (orange)
    return 'var(--primary)';                        // safe (blue)
  };

  const columns = ['ID', 'Title', 'Description', 'Due Date', 'Completed'];

  const data = [...tasks]
    .sort((a, b) => Number(a.completed) - Number(b.completed))
    .map(task => ({
      ID: task.id,
      Title: task.title,
      Description: task.description,
      'Due Date': task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-',
      Completed: task.completed ? 'Yes' : 'No',
      _rowId: `row-${task.id}`,
  }));
  

  const scrollToTask = (taskId: number) => {
    const el = document.getElementById(`row-${taskId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
  

  return (
    <div className={`${styles.container} ${styles.fadeIn}`}>
      <h1>{user && <p>Welcome, <strong>{user.name}</strong>!</p>}</h1>

      <section className={styles.analysis}>
        <p>You have completed <strong>{completedCount}</strong> out of <strong>{totalCount}</strong> tasks.</p>

        <div>
          <h3>Due this week:</h3>
          {tasksDueThisWeek.length === 0 && <p>No tasks due this week.</p>}
          <ul>
            {tasksDueThisWeek.map(task => (
              <li
                key={task.id}
                onClick={() => scrollToTask(task.id)}
                style={{ cursor: 'pointer', color: getDueColor(task.dueDate) }}
                title="Click to scroll to task"
              >
                {task.title} - due {new Date(task.dueDate!).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <button
        className={styles.toggleButton}
        onClick={() => setFormVisible(v => !v)}
        aria-expanded={formVisible}
      >
        {formVisible ? 'Hide Add Task' : 'Show Add Task'}
      </button>

      <div
        className={`${styles.collapsibleForm} ${formVisible ? styles.open : ''}`}
        aria-hidden={!formVisible}
      >
        <form onSubmit={handleAddTask} className={styles.form}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={styles.input}
            required
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className={styles.textarea}
            required
          />
          <input
            type="datetime-local"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className={styles.input}
          />
          <button type="submit" className={styles.button}>Add Task</button>
          {error && <p className={styles.error}>{error}</p>}
        </form>
      </div>

      {loading && <p>Loading tasks...</p>}
      
      <DataTable
        columns={columns}
        data={data}
        renderActions={(row) => (
          <>
            {row.Completed === 'No' && (
              <button onClick={() => markTaskCompleted(row.ID)}>Mark as done</button>
            )}
            <button onClick={() => deleteTask(row.ID)} style={{ marginLeft: '0.5rem' }}>
              Delete
            </button>
          </>
        )}
      />


    </div>
  );
}
