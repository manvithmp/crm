import React, { useEffect, useState } from "react";
import styles from "./AdminSettings.module.css";
import Sidebar from "../components/Sidebar";
import axios from "axios";

function AdminSettings({ user }) {
  const token = user?.token || localStorage.getItem('token');
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (!token) {
      alert("Please log in first.");
      setLoading(false);
      return;
    }
    axios.get("/api/profile", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).then(res => {
      setProfile(res.data);
      const [firstName, ...lastArr] = (res.data.name || "").split(" ");
      setForm({
        firstName: firstName || "",
        lastName: lastArr.join(" ") || "",
        email: res.data.email || "",
        password: "",
        confirmPassword: ""
      });
      setLoading(false);
    }).catch(err => {
      setLoading(false);
      if (err.response && err.response.status === 401) {
        alert("Unauthorized. Please log in again.");
      } else {
        alert("Failed to load profile.");
      }
    });
    
  }, [token]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    setSaving(true);
    const updateData = {
      name: form.lastName ? `${form.firstName} ${form.lastName}` : form.firstName,
      email: form.email,
    };
    if (form.password) updateData.password = form.password;
    try {
      await axios.put("/api/profile", updateData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSaving(false);
      window.location.reload();
    } catch (err) {
      setSaving(false);
      if (err.response && err.response.status === 401) {
        alert("Unauthorized. Please log in again.");
      } else {
        alert("Failed to save changes.");
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.mainWrap}>
        <Sidebar />
        <div className={styles.loader}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.mainWrap}>
      <Sidebar />
      <div className={styles.contentArea}>
        <div className={styles.breadcrumb}>
          <span>Home</span>
          <span className={styles.chevron}>›</span>
          <span>Settings</span>
        </div>
        <div className={styles.formCard}>
          <div className={styles.tabBar}>
            <div className={styles.activeTab}>Edit Profile</div>
          </div>
          <form className={styles.profileForm} onSubmit={handleSubmit}>
            <div>
              <label className={styles.label}>First name</label>
              <input
                type="text"
                className={styles.input}
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className={styles.label}>Last name</label>
              <input
                type="text"
                className={styles.input}
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                className={styles.input}
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className={styles.label}>Password</label>
              <input
                type="password"
                className={styles.input}
                name="password"
                value={form.password}
                autoComplete="new-password"
                onChange={handleChange}
                placeholder="************"
              />
            </div>
            <div>
              <label className={styles.label}>Confirm Password</label>
              <input
                type="password"
                className={styles.input}
                name="confirmPassword"
                value={form.confirmPassword}
                autoComplete="new-password"
                onChange={handleChange}
                placeholder="************"
              />
            </div>
            <div className={styles.actionsRow}>
              <button
                type="submit"
                className={styles.saveBtn}
                disabled={saving}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;