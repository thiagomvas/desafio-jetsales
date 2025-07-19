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
    throw new Error(error.message || 'API request failed');
  }

  return res.json();
}

export const api = {
  login: (data: { email: string; password: string }) =>
    request<{ user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  fetchTasks: () => request<any[]>('/tasks'),
  getCurrentUser: () =>
    request<{ id: number; name: string; email: string }>('/auth/me'),

  createTask: (data: { title: string; description?: string; dueDate?: string }) =>
    request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
