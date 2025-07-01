import React, { useState } from "react";
import styles from "./Profile.module.css";
import BottomNav from "../components/BottomNav";
import { FiChevronLeft } from "react-icons/fi";

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
        res = await fetch("http://localhost:5000/api/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: `${form.firstName} ${form.lastName}`,
            email: form.email,
            password: form.password,
          }),
        });
        data = await res.json();
        if (res.ok) {
          setMsg("Profile updated successfully!");
          setForm((f) => ({ ...f, password: "", confirmPassword: "" }));
        } else {
          setMsg(data.error || "Error updating profile.");
        }
      } else {
    
        res = await fetch("http://localhost:5000/api/users/update-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
          }),
        });
        data = await res.json();
        if (res.ok) {
          setMsg("Password updated successfully!");
          setForm((f) => ({ ...f, password: "", confirmPassword: "" }));
        } else {
          setMsg(data.error || "Error updating password.");
        }
      }
    } catch (err) {
      setMsg("Network error.");
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