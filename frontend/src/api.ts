/* eslint-disable @typescript-eslint/no-explicit-any */
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include', // send cookies
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'API request failed');

  }

  return res.json();
}

export const api = {
  login: (data: { email: string; password: string }) =>
    request<{ user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  register: (data: {name: string; email: string; password: string;}) => 
    request<{ user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  fetchTasks: () => request<any[]>('/tasks'),
  fetchTasksForUser: () =>
    request<any[]>('/tasks/user'),
  getCurrentUser: () =>
    request<{ id: number; name: string; email: string }>('/auth/me'),

  createTask: (data: { title: string; description?: string; dueDate?: string }) =>
    request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTask: (id: number, data: { title?: string; description?: string; dueDate?: string }) =>
    request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTask: (id: number) =>
    request(`/tasks/${id}`, {
      method: 'DELETE',
    }),
  patchTask: (id: number, data: { completed?: boolean }) =>
    request(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
