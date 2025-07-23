import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from '../styles/LoginPage.module.css';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setUser } = useAuth();
  const navigate = useNavigate();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  try {
    const authResponse = await api.login({ email, password });
    setUser(authResponse.user); // update context here
    navigate('/', { replace: true });
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Login failed');
  }
};


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

      <p style={{ marginTop: '1rem' }}>
        Don't have an account?{' '}
        <Link to="/register" className={styles.link}>
          Register here
        </Link>
      </p>
    </div>
  );
}
