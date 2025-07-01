import React, { useEffect, useState } from 'react';
import styles from './EmployeeDashboard.module.css';
import BottomNav from '../components/BottomNav';

const EmployeeDashboard = ({ user, handleLogout }) => {
  const [attendance, setAttendance] = useState(null);
  const [breakHistory, setBreakHistory] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [breakLoading, setBreakLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchSummary();
 
  }, [user]);

  async function fetchSummary() {
    setLoading(true);
    const [attendanceRes, activityRes] = await Promise.all([
      fetch(`http://localhost:5000/api/attendance/employee/summary?email=${user.email}`),
      fetch(`http://localhost:5000/api/activity/employee?email=${user.email}`),
    ]);
    const attendanceData = await attendanceRes.json();
    const activityData = await activityRes.json();
    setAttendance(attendanceData.attendance);
    setBreakHistory(attendanceData.breakHistory); 
    setActivity(activityData.activity); 
    setLoading(false);
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }

  function formatTime(dateStr) {
    if (!dateStr) return "--:-- --";
    const date = new Date(dateStr);
    let h = date.getHours();
    let m = date.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    h = h ? h : 12;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
  }
  function formatDate(dateStr) {
    if (!dateStr) return "--/--/--";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB").replace(/\//g, "/").slice(0, 8);
  }

  if (loading) return <div className={styles.loading}>Loading...</div>;

  const today = attendance || {};
  const todayBreak = today.breaks && today.breaks.length
    ? today.breaks[today.breaks.length - 1]
    : null;
  const isCheckedIn = !!today.checkIn && !today.checkOut;
  const isOnBreak = todayBreak && !todayBreak.end;

  const token = localStorage.getItem('token');

  const handleBreak = async () => {
    setBreakLoading(true);
    try {
      if (!isOnBreak) {
        await fetch('http://localhost:5000/api/attendance/break/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email })
        });
      } else {
        await fetch('http://localhost:5000/api/attendance/break/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email })
        });
      }
      await fetchSummary();
    } catch (err) {
      alert('Break action failed!');
    }
    setBreakLoading(false);
  };

  const handleCheckOut = async () => {
    setCheckoutLoading(true);
    try {
      await fetch('http://localhost:5000/api/attendance/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      localStorage.removeItem('token');
      if (handleLogout) handleLogout();
    } catch (err) {
      alert('Check out failed!');
      setCheckoutLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.logo}>
          Canova<span style={{ color: "#FFE600" }}>CRM</span>
        </div>
        <div className={styles.greet}>{getGreeting()}</div>
        <div className={styles.name}>{user?.name || "Employee"}</div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Timings</div>
        <div className={styles.timingCard}>
          <div className={styles.timingInner}>
            <div className={styles.timingColumn}>
              <div className={styles.label}>Checked-In</div>
              <div className={styles.value}>{formatTime(today.checkIn)}</div>
            </div>
            <div className={styles.timingColumn}>
              <div className={styles.label}>Check Out</div>
              <div className={styles.value}>{today.checkOut ? formatTime(today.checkOut) : "--:-- --"}</div>
            </div>
            <div className={styles.indicator}>
              <div className={`${styles['pill-indicator']} ${isCheckedIn ? styles.green : styles.red}`}></div>
            </div>
          </div>
        </div>
        <div className={styles.breakCard}>
          <div className={styles.breakRow}>
            <div>
              <div className={styles.label}>Break</div>
              <div className={styles.value}>
                {todayBreak && !todayBreak.end ? formatTime(todayBreak.start) : "--:-- --"}
              </div>
            </div>
            <div>
              <div className={styles.label}>Ended</div>
              <div className={styles.value}>
                {todayBreak && todayBreak.end ? formatTime(todayBreak.end) : "--:-- --"}
              </div>
            </div>
            <div className={styles.indicator}>
              <div className={`${styles['pill-indicator']} ${isOnBreak ? styles.green : styles.red}`}></div>
            </div>
          </div>
          <div className={styles.historyTable}>
            {breakHistory && breakHistory.length > 0 ? (
              breakHistory.map((day, idx) => (
                <div className={styles.historyRow} key={idx}>
                  <div className={styles.historyCell}>
                    Break<br />
                    {formatTime(day.breakStart)}
                  </div>
                  <div className={styles.historyCell}>
                    Ended<br />
                    {formatTime(day.breakEnd)}
                  </div>
                  <div className={styles.historyCell}>
                    Date<br />
                    {formatDate(day.date)}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.historyRow} style={{ opacity: 0.7 }}>
                No break history
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Recent Activity</div>
        <div className={styles.activityCard}>
          {activity && activity.length ? activity.map((a, idx) => (
            <div key={idx} className={styles.activityItem}>
              • {a.message} <span className={styles.activityTime}>– {a.timeAgo}</span>
            </div>
          )) : <div style={{ color: "#767676" }}>No recent activity</div>}
        </div>
      </div>
      <div className={styles.actionBar}>
        <button
          className={styles.breakBtn}
          onClick={handleBreak}
          disabled={breakLoading || !isCheckedIn}
        >
          {isOnBreak ? (breakLoading ? "Ending Break..." : "End Break") : (breakLoading ? "Starting..." : "Start Break")}
        </button>
        <button
          className={styles.checkoutBtn}
          onClick={handleCheckOut}
          disabled={checkoutLoading || !isCheckedIn}
        >
          {checkoutLoading ? "Checking Out..." : "Check Out"}
        </button>
      </div>
      <BottomNav />
    </div>
  );
};

export default EmployeeDashboard;