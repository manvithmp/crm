import React, { useState } from "react";
import axios from "axios";
import styles from "./Profile.module.css";
import BottomNav from "../components/BottomNav";
import { FiChevronLeft } from "react-icons/fi";

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const Profile = ({ user }) => {
  let firstName = "";
  let lastName = "";
  if (user && user.name) {
    const parts = user.name.trim().split(" ");
    firstName = parts[0] || "";
    lastName = parts.slice(1).join(" ") || "";
  }

  const [form, setForm] = useState({
    firstName,
    lastName,
    email: user?.email || "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleChange = (e) => {
    setForm((f) => ({
      ...f,
      [e.target.name]: e.target.value,
    }));
    setMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (!form.password || !form.confirmPassword) {
      setMsg("Password fields cannot be empty.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMsg("Passwords do not match.");
      return;
    }
    setSubmitting(true);

    const token = user?.token || localStorage.getItem('token');
    try {
      let res, data;
      if (user?.role === "admin") {
        res = await axios.put(
          "/api/profile",
          {
            name: `${form.firstName} ${form.lastName}`,
            email: form.email,
            password: form.password,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        data = res.data;
        setMsg("Profile updated successfully!");
        setForm((f) => ({ ...f, password: "", confirmPassword: "" }));
      } else {
        res = await axios.post(
          "/api/users/update-password",
          {
            email: form.email,
            password: form.password,
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        data = res.data;
        setMsg("Password updated successfully!");
        setForm((f) => ({ ...f, password: "", confirmPassword: "" }));
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setMsg(err.response.data.error);
      } else {
        setMsg("Network error.");
      }
    }
    setSubmitting(false);
  };

  return (
    <div className={styles.root}>
      <div className={styles.headerBg}>
        <div className={styles.header}>
          <FiChevronLeft className={styles.backIcon} size={24} />
          <span className={styles.logo}>Canova<span className={styles.logoHighlight}>CRM</span></span>
        </div>
        <div className={styles.pageTitle}>Profile</div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>First name</label>
        <input
          className={styles.input}
          type="text"
          value={form.firstName}
          name="firstName"
          disabled
        />

        <label className={styles.label}>Last name</label>
        <input
          className={styles.input}
          type="text"
          value={form.lastName}
          name="lastName"
          disabled
        />

        <label className={styles.label}>Email</label>
        <input
          className={styles.input}
          type="email"
          value={form.email}
          name="email"
          disabled
        />

        <label className={styles.label}>Password</label>
        <input
          className={styles.input}
          type="password"
          name="password"
          value={form.password}
          placeholder="********"
          onChange={handleChange}
          autoComplete="new-password"
        />

        <label className={styles.label}>Confirm Password</label>
        <input
          className={styles.input}
          type="password"
          name="confirmPassword"
          value={form.confirmPassword}
          placeholder="********"
          onChange={handleChange}
          autoComplete="new-password"
        />
        {msg && (
          <div
            className={
              msg.includes("success") ? styles.successMsg : styles.errorMsg
            }
          >
            {msg}
          </div>
        )}
        <button
          className={styles.saveBtn}
          type="submit"
          disabled={submitting}
        >
          Save
        </button>
      </form>

      <BottomNav />
    </div>
  );
};

export default Profile;