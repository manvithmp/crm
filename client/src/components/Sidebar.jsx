import React from 'react';
import styles from './Sidebar.module.css';
import {
  FiGrid, FiUsers, FiSettings, FiUser, FiLogOut, FiArchive,
} from 'react-icons/fi';
import { useLocation, NavLink } from 'react-router-dom';

const Sidebar = ({ onLogout }) => {
  const location = useLocation();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        Canova<span className={styles.crm}>CRM</span>
      </div>
      <nav className={styles.nav}>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => isActive ? styles.active : ''}
        >
          <FiGrid className={styles.icon} />
          Dashboard
        </NavLink>
        <NavLink
          to="/leads"
          className={({ isActive }) => isActive ? styles.active : ''}
        >
          <FiArchive className={styles.icon} />
          Leads
        </NavLink>
        <NavLink
          to="/employees"
          className={({ isActive }) => isActive ? styles.active : ''}
        >
          <FiUsers className={styles.icon} />
          Employees
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => isActive ? styles.active : ''}
        >
          <FiSettings className={styles.icon} />
          Settings
        </NavLink>
      </nav>
      <div className={styles.profileSection}>
        <button className={styles.logoutBtn} onClick={onLogout}>
          <FiLogOut className={styles.logoutIcon} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
