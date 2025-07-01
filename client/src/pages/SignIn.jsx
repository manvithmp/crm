import React, { useState } from 'react';
import axios from 'axios';
import styles from './SignIn.module.css';
import { FiLock, FiMail } from 'react-icons/fi';

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const SignIn = ({ onSignIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const data = response.data;
      if (data.token && data.user && data.user.role === 'admin') {
        localStorage.setItem('token', data.token);
        onSignIn({ ...data.user, token: data.token });
      } else {
        localStorage.removeItem('token');
        onSignIn(data.user);
      }
    } catch (err) {
      setError(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Login failed'
      );
    }
  };

  return (
    <div className={styles.signInPageWrapper}>
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
      <div className={styles.signInImageWrapper}>
        <img
          src="https://wp.sfdcdigital.com/en-us/wp-content/uploads/sites/4/2024/09/n-up-resource-what-is-crm.webp"
          alt="What is CRM"
          className={styles.signInImage}
        />
      </div>
    </div>
  );
};

export default SignIn;