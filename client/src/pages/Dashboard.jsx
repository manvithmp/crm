import React, { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';
import { FiUsers, FiUserCheck, FiUser, FiTrendingUp } from 'react-icons/fi';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const API_BASE = 'http://localhost:5000';

function isActive(lastLogin) {
  if (!lastLogin) return false;
  return Date.now() - new Date(lastLogin).getTime() < 15 * 60 * 1000;
}

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    unassignedLeads: 0,
    assignedThisWeek: 0,
    activeSalespeople: 0,
    conversionRate: 0
  });
  const [activity, setActivity] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{ data: [], backgroundColor: '#d2d6df' }]
  });
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = user?.token || localStorage.getItem('token');
    if (!token) {
      setError('You are not authorized. Please log in as admin.');
      setEmployees([]);
      setChartData({
        labels: [],
        datasets: [{ data: [], backgroundColor: '#d2d6df' }]
      });
      return;
    }

    let leadsData = [];
    let allEmployees = [];

    fetch(`${API_BASE}/api/leads`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async r => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to fetch leads');
        }
        return r.json();
      })
      .then(leads => {
        if (!Array.isArray(leads)) throw new Error('Leads response is not an array');
        leadsData = leads;
        const now = new Date();
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);

        let unassigned = 0, assignedThisWeek = 0;
        const conversions = Array(7).fill(0);
        const labels = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(now.getDate() - i);
          labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        }

        leads.forEach(l => {
          if (l.status === 'unassigned') unassigned++;
          const assignedDate = l.createdAt ? new Date(l.createdAt) : null;
          if (
            l.status === 'assigned' &&
            assignedDate &&
            assignedDate > oneWeekAgo
          ) assignedThisWeek++;
          if (l.status === 'closed' && l.date) {
            const closedDate = new Date(l.date);
            const diffDays = Math.floor((now - closedDate) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays <= 6) {
              conversions[6 - diffDays] += 1;
            }
          }
        });

        const employeeLeadStats = {};
        leads.forEach(l => {
          if (l.assignedTo) {
            const eid = typeof l.assignedTo === 'object' && l.assignedTo._id ? l.assignedTo._id : l.assignedTo;
            if (!employeeLeadStats[eid]) {
              employeeLeadStats[eid] = { assignedLeads: 0, closedLeads: 0 };
            }
            if (l.status === 'assigned') employeeLeadStats[eid].assignedLeads += 1;
            if (l.status === 'closed') employeeLeadStats[eid].closedLeads += 1;
          }
        });

        setStats(s => ({
          ...s,
          unassignedLeads: unassigned,
          assignedThisWeek,
        }));

        setChartData({
          labels,
          datasets: [
            {
              label: 'Daily Conversion',
              data: conversions,
              backgroundColor: '#d2d6df'
            }
          ]
        });

        fetch(`${API_BASE}/api/employees`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(async r => {
            if (!r.ok) {
              const data = await r.json().catch(() => ({}));
              throw new Error(data.error || 'Failed to fetch employees');
            }
            return r.json();
          })
          .then(emps => {
            if (!Array.isArray(emps)) throw new Error('Employees response is not an array');
            allEmployees = emps.map(e => {
              const eid = e._id;
              return {
                ...e,
                assignedLeads: employeeLeadStats[eid]?.assignedLeads || 0,
                closedLeads: employeeLeadStats[eid]?.closedLeads || 0
              };
            });

            setStats(s => ({
              ...s,
              activeSalespeople: allEmployees.filter(emp => isActive(emp.lastLogin)).length,
              conversionRate:
                leads.length > 0
                  ? Math.round(
                      (leads.filter(l => l.status === 'closed').length /
                        leads.length) *
                        100
                    )
                  : 0
            }));
            setEmployees(allEmployees);
          })
          .catch(err => {
            setEmployees([]);
            setError(err.message || 'Failed to fetch employees');
          });
      })
      .catch(err => {
        setError(err.message || 'Failed to fetch leads');
        setEmployees([]);
        setChartData({
          labels: [],
          datasets: [{ data: [], backgroundColor: '#d2d6df' }]
        });
      });

    fetch(`${API_BASE}/api/activity`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async r => {
        if (!r.ok) {
          setActivity([]);
          return;
        }
        const acts = await r.json();
        setActivity(
          Array.isArray(acts)
            ? acts
                .slice(0, 5)
                .map(a => ({
                  message: a.message,
                  time: a.createdAt
                    ? new Date(a.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', hour12: true, month: 'short', day: 'numeric' })
                    : ''
                }))
            : []
        );
      })
      .catch(() => setActivity([]));
  }, [user]);

  const cardSections = [
    {
      key: 'unassignedLeads',
      label: 'Unassigned Leads',
      render: () => (
        <div className={styles.statCard} key="unassignedLeads">
          <FiUser className={styles.statIcon} />
          <div>
            <div className={styles.statTitle}>Unassigned Leads</div>
            <div className={styles.statValue}>{stats.unassignedLeads}</div>
          </div>
        </div>
      )
    },
    {
      key: 'assignedThisWeek',
      label: 'Assigned This Week',
      render: () => (
        <div className={styles.statCard} key="assignedThisWeek">
          <FiUserCheck className={styles.statIcon} />
          <div>
            <div className={styles.statTitle}>Assigned This Week</div>
            <div className={styles.statValue}>{stats.assignedThisWeek}</div>
          </div>
        </div>
      )
    },
    {
      key: 'activeSalespeople',
      label: 'Active Salespeople',
      render: () => (
        <div className={styles.statCard} key="activeSalespeople">
          <FiUsers className={styles.statIcon} />
          <div>
            <div className={styles.statTitle}>Active Salespeople</div>
            <div className={styles.statValue}>
              {employees.filter(emp => isActive(emp.lastLogin)).length}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'conversionRate',
      label: 'Conversion Rate',
      render: () => (
        <div className={styles.statCard} key="conversionRate">
          <FiTrendingUp className={styles.statIcon} />
          <div>
            <div className={styles.statTitle}>Conversion Rate</div>
            <div className={styles.statValue}>{stats.conversionRate}%</div>
          </div>
        </div>
      )
    },
    {
      key: 'saleAnalytics',
      label: 'Sale Analytics',
      render: () => (
        <div className={styles.saleAnalytics} key="saleAnalytics">
          <div className={styles.analyticsTitle}>Sale Analytics</div>
          <Bar
            data={chartData}
            options={{
              plugins: { legend: { display: false } },
              scales: {
                y: {
                  beginAtZero: true,
                  max: Math.max(...chartData.datasets[0].data, 7),
                  ticks: {
                    callback: (val) => val
                  }
                }
              },
              hover: { mode: 'index', intersect: false }
            }}
            height={150}
          />
        </div>
      )
    },
    {
      key: 'activityFeed',
      label: 'Recent Activity Feed',
      render: () => (
        <div className={styles.activityFeed} key="activityFeed">
          <div className={styles.feedTitle}>Recent Activity Feed</div>
          <ul>
            {activity.map((a, i) => (
              <li key={a.message + i}>
                <span>•</span> {a.message}
                <span className={styles.time}>— {a.time}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    },
    {
      key: 'employeeList',
      label: 'Employee List',
      render: () => (
        <div className={styles.tableSection} key="employeeList">
          <table className={styles.table}>
            <thead>
              <tr>
                <th>
                  <input type="checkbox" disabled />
                </th>
                <th>Name</th>
                <th>Employee ID</th>
                <th>Assigned Leads</th>
                <th>Closed Leads</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp._id || emp.email || emp.empId}>
                  <td>
                    <input type="checkbox" />
                  </td>
                  <td>
                    <div className={styles.empAvatar}>
                      {emp.avatar ? (
                        <img src={emp.avatar} alt={emp.name} />
                      ) : (
                        <span className={styles.empInitials}>
                          {emp.name?.split(' ').map(n => n[0]).join('')}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 10 }}>
                      <div className={styles.empName}>{emp.name}</div>
                      <div className={styles.empEmail}>@{emp.email}</div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.empIdTag}>#{emp.empId || 'N/A'}</span>
                  </td>
                  <td>{emp.assignedLeads}</td>
                  <td>{emp.closedLeads}</td>
                  <td>
                    {isActive(emp.lastLogin) ? (
                      <span className={styles.statusActive}>
                        <span className={styles.statusDot}></span> Active
                      </span>
                    ) : (
                      <span className={styles.statusInactive}>
                        <span className={styles.statusDot}></span> Inactive
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "#888" }}>
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )
    }
  ];

  const filteredCardSections = cardSections.filter(card =>
    search
      ? card.label.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className={styles.dashboardWrapper}>
      <div className={styles.topBar}>
        <input
          type="text"
          placeholder="Search here ..."
          className={styles.searchInput}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className={styles.breadcrumb}>Home &gt; Dashboard</div>
      {error ? (
        <div style={{ color: "#c00", textAlign: "center", margin: 32, fontWeight: 600 }}>{error}</div>
      ) : search ? (
        filteredCardSections.length > 0 ? (
          <>
            <div className={styles.statsRow}>
              {filteredCardSections
                .filter(card =>
                  ['unassignedLeads', 'assignedThisWeek', 'activeSalespeople', 'conversionRate'].includes(card.key)
                )
                .map(card => card.render())}
            </div>
            <div className={styles.analyticsSection}>
              {filteredCardSections
                .filter(card => ['saleAnalytics', 'activityFeed'].includes(card.key))
                .map(card => card.render())}
            </div>
            {filteredCardSections
              .filter(card => card.key === 'employeeList')
              .map(card => card.render())}
          </>
        ) : (
          <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>No results found.</div>
        )
      ) : (
        <>
          <div className={styles.statsRow}>
            {cardSections
              .filter(card =>
                ['unassignedLeads', 'assignedThisWeek', 'activeSalespeople', 'conversionRate'].includes(card.key)
              )
              .map(card => card.render())}
          </div>
          <div className={styles.analyticsSection}>
            <div className={styles.saleAnalytics} key="saleAnalytics_main">
              <div className={styles.analyticsTitle}>Sale Analytics</div>
              <Bar
                data={chartData}
                options={{
                  plugins: { legend: { display: false } },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: Math.max(...chartData.datasets[0].data, 7),
                      ticks: {
                        callback: (val) => val
                      }
                    }
                  },
                  hover: { mode: 'index', intersect: false }
                }}
                height={150}
              />
            </div>
            <div className={styles.activityFeed} key="activityFeed_main">
              <div className={styles.feedTitle}>Recent Activity Feed</div>
              <ul>
                {activity.map((a, i) => (
                  <li key={a.message + i}>
                    <span>•</span> {a.message}
                    <span className={styles.time}>— {a.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {cardSections
            .filter(card => card.key === 'employeeList')
            .map(card => card.render())}
        </>
      )}
    </div>
  );
};

export default Dashboard;