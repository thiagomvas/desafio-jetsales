import { useState } from 'react';
import styles from '../styles/LoginPage.module.css';
import { api } from '../api';
import { Navigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [redirect, setRedirect] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await api.login({ email, password });
      setRedirect(true); // trigger navigation
    } catch (err) {
      setError((err instanceof Error ? err.message : 'Login failed'));
    }
  };

  if (redirect) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Login</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email" className={styles.label}>Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className={styles.input}
        />

        <label htmlFor="password" className={styles.label}>Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className={styles.input}
        />

        {error && <div className={styles.error}>{error}</div>}

        <button type="submit" className={styles.button}>Login</button>
      </form>
    </div>
  );
}
