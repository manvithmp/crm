import React from "react";
import { FiHome, FiUsers, FiCalendar, FiUser } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./BottomNav.module.css";

const NAVS = [
  {
    path: "/employee_dashboard",
    icon: <FiHome size={22} />,
    label: "Home",
    match: ["/employee_dashboard"]
  },
  {
    path: "/employee_leads",
    icon: <FiUsers size={22} />,
    label: "Leads",
    match: ["/employee_leads"]
  },
  {
    path: "/employee_schedule",
    icon: <FiCalendar size={22} />,
    label: "Schedule",
    match: ["/employee_schedule"]
  },
  {
    path: "/profile",
    icon: <FiUser size={22} />,
    label: "Profile",
    match: ["/profile"]
  }
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className={styles.navbar}>
      {NAVS.map((nav) => {
        const isActive = nav.match.some((m) => location.pathname.startsWith(m));
        return (
          <div
            key={nav.path}
            className={`${styles.navitem} ${isActive ? styles.active : ""}`}
            onClick={() => navigate(nav.path)}
          >
            {nav.icon}
            <div>{nav.label}</div>
          </div>
        );
      })}
    </div>
  );
};

export default BottomNav;
