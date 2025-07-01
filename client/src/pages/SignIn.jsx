import React, { useState } from 'react';
import styles from './SignIn.module.css';
import { FiLock, FiMail } from 'react-icons/fi';

const SignIn = ({ onSignIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        if (data.token && data.user && data.user.role === 'admin') {
          localStorage.setItem('token', data.token);
         
          onSignIn({ ...data.user, token: data.token });
        } else {
         
          localStorage.removeItem('token');
          onSignIn(data.user);
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className={styles.signInContainer}>
      <form className={styles.signInForm} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Sign In</h2>
        <div className={styles.inputGroup}>
          <FiMail className={styles.icon} />
          <input
            type="email"
            placeholder="Email"
            className={styles.input}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <FiLock className={styles.icon} />
          <input
            type="password"
            placeholder="Password"
            className={styles.input}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className={styles.errorMsg}>{error}</div>}
        <button type="submit" className={styles.signInBtn}>Sign In</button>
      </form>
    </div>
  );
};

export default SignIn;