import React, { useEffect, useState } from 'react';
import styles from './Employees.module.css';
import { FiUserPlus, FiEdit2, FiTrash2, FiMoreHorizontal, FiX } from 'react-icons/fi';

const PAGE_SIZE = 5;

function getInitials(name) {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const statusColor = status =>
  status === 'active'
    ? styles.statusActive
    : styles.statusInactive;

const statusDot = status =>
  status === 'active'
    ? styles.dotActive
    : styles.dotInactive;

const Employees = ({ user }) => {
  const [employees, setEmployees] = useState([]);
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEmployee, setDeleteEmployee] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [page, setPage] = useState(1);

 
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    location: '',
    language: ''
  });

  
  const totalPages = Math.ceil(
    (employees.filter(
      e =>
        e.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.email?.toLowerCase().includes(search.toLowerCase())
    ).length || 1) / PAGE_SIZE
  );

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    const token = user?.token || localStorage.getItem('token');
  
    const empRes = await fetch('http://localhost:5000/api/employees', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const emps = await empRes.json();
   
    const leadRes = await fetch('http://localhost:5000/api/leads', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const leadsData = await leadRes.json();
  
    const stats = {};
    leadsData.forEach(l => {
      if (l.assignedTo) {
        const eid = typeof l.assignedTo === 'object' && l.assignedTo._id ? l.assignedTo._id : l.assignedTo;
        if (!stats[eid]) stats[eid] = { assigned: 0, closed: 0 };
        if (l.status === 'assigned') stats[eid].assigned += 1;
        if (l.status === 'closed') stats[eid].closed += 1;
      }
    });
    setLeads(leadsData);
    setEmployees(
      emps.map(emp => ({
        ...emp,
        name: emp.name,
        email: emp.email,
        empId: emp.empId || '#'+(emp._id || '').slice(-10).toUpperCase(),
        assignedLeads: stats[emp._id]?.assigned || 0,
        closedLeads: stats[emp._id]?.closed || 0,
        status: emp.status || 'active'
      }))
    );
  }

  function handleAddOpen() {
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      location: '',
      language: ''
    });
    setShowAddModal(true);
  }
  function handleEditOpen(emp) {
    setEditEmployee(emp);
    setForm({
      firstName: emp.name?.split(' ')[0] || '',
      lastName: emp.name?.split(' ').slice(1).join(' ') || '',
      email: emp.email || '',
      location: emp.location || '',
      language: emp.language || ''
    });
    setShowEditModal(true);
    setDropdownOpen(null);
  }

  function handleAddOrEditSave() {
    const token = user?.token || localStorage.getItem('token');
    const body = {
      name: `${form.firstName} ${form.lastName}`.trim(),
      email: form.email,
      location: form.location,
      language: form.language,
      role: 'employee',
      status: 'active'
    };
    if (showEditModal && editEmployee) {
     
      fetch(`http://localhost:5000/api/employees/${editEmployee._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }).then(() => {
        setShowEditModal(false);
        setEditEmployee(null);
        fetchAll();
      });
    } else {
   
      fetch('http://localhost:5000/api/employees', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...body,
          password: 'password123'
        })
      }).then(() => {
        setShowAddModal(false);
        fetchAll();
      });
    }
  }

  function handleDelete(emp) {
    setDeleteEmployee(emp);
    setShowDeleteConfirm(true);
    setDropdownOpen(null);
  }
  function handleDeleteConfirmed() {
    const token = user?.token || localStorage.getItem('token');
    fetch(`http://localhost:5000/api/employees/${deleteEmployee._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => {
      setShowDeleteConfirm(false);
      setDeleteEmployee(null);
      fetchAll();
    });
  }

  const filtered = employees.filter(
    e =>
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase())
  );
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className={styles.employeesWrapper}>
      <div className={styles.topBar}>
        <input
          className={styles.searchInput}
          placeholder="Search here..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <button className={styles.addBtn} onClick={handleAddOpen}>
          <FiUserPlus /> Add Employees
        </button>
      </div>
      <div className={styles.breadcrumb}>Home &gt; Employees</div>
      <div className={styles.tableSection}>
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paged.map(emp => (
              <tr key={emp._id}>
                <td>
                  <input type="checkbox" />
                </td>
                <td>
                  <div className={styles.empAvatar}>
                    {emp.avatar ? (
                      <img src={emp.avatar} alt={emp.name} />
                    ) : (
                      <span className={styles.empInitials}>{getInitials(emp.name)}</span>
                    )}
                  </div>
                  <div style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 10 }}>
                    <div className={styles.empName}>{emp.name}</div>
                    <div className={styles.empEmail}>@{emp.email}</div>
                  </div>
                </td>
                <td>
                  <span className={styles.empIdTag}>{emp.empId}</span>
                </td>
                <td>{emp.assignedLeads}</td>
                <td>{emp.closedLeads}</td>
                <td>
                  <span className={statusColor(emp.status)}>
                    <span className={statusDot(emp.status)}></span>
                    {emp.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ position: 'relative' }}>
                  <FiMoreHorizontal
                    className={styles.moreIcon}
                    onClick={() => setDropdownOpen(dropdownOpen === emp._id ? null : emp._id)}
                  />
                  {dropdownOpen === emp._id && (
                    <div className={styles.dropdownMenu}>
                      <button className={styles.dropdownEdit} onClick={() => handleEditOpen(emp)}>
                        <FiEdit2 style={{ marginRight: 6 }} /> Edit
                      </button>
                      <button className={styles.dropdownDelete} onClick={() => handleDelete(emp)}>
                        <FiTrash2 style={{ marginRight: 6 }} /> Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={7} style={{ color: '#aaa', textAlign: 'center', padding: 40 }}>
                  No employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
   
      <div className={styles.paginationRow}>
        <button
          className={styles.pageBtn}
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          &larr; Previous
        </button>
        <div className={styles.pageNumbers}>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={i + 1 === page ? styles.pageNumActive : styles.pageNum}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <button
          className={styles.pageBtn}
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next &rarr;
        </button>
      </div>


      {(showAddModal || showEditModal) && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <button className={styles.closeBtn} onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
              <FiX />
            </button>
            <div className={styles.modalTitle}>
              {showAddModal ? 'Add New Employee' : 'Edit Employee'}
            </div>
            <div className={styles.formGroup}>
              <label>First name</label>
              <input
                type="text"
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                autoFocus
              />
            </div>
            <div className={styles.formGroup}>
              <label>Last name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                disabled={showEditModal}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Location</label>
              <input
                type="text"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              />
              <span className={styles.tip}>Lead will be assigned on biases on location</span>
            </div>
            <div className={styles.formGroup}>
              <label>Preferred Language</label>
              <input
                type="text"
                value={form.language}
                onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
              />
              <span className={styles.tip}>Lead will be assigned on biases on language</span>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.saveBtn}
                onClick={handleAddOrEditSave}
                disabled={
                  !form.firstName ||
                  !form.lastName ||
                  !form.email ||
                  !form.location ||
                  !form.language
                }
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    
      {showDeleteConfirm && (
        <div className={styles.modalBackdrop}>
          <div className={styles.confirmBox}>
            <div>
              Are you sure you want to delete <b>{deleteEmployee.name}</b>? This cannot be undone.
            </div>
            <div className={styles.confirmBtns}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleDeleteConfirmed}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Employees;