import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import styles from './EmpLead.module.css';
import BottomNav from '../components/BottomNav';
import { FiChevronLeft, FiSearch, FiFilter, FiEdit2, FiClock, FiCheckCircle, FiCalendar, FiX } from 'react-icons/fi';

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const LEAD_TYPE_COLORS = {
  hot: '#FF6B00',
  warm: '#FFE600',
  cold: '#00C2FF'
};

const STATUS_STYLES = [
  {
    borderColor: '#FF6B00',
    text: 'Ongoing',
    textColor: '#181C32',
    cardBg: '#F7F8FC',
    circleClass: '',
    textClass: '',
    opacity: 1
  },
  {
    borderColor: '#FFE600',
    text: 'Ongoing',
    textColor: '#181C32',
    cardBg: '#F7F8FC',
    circleClass: 'yellow',
    textClass: '',
    opacity: 1
  },
  {
    borderColor: '#E2BBA6',
    text: 'Closed',
    textColor: '#A6856F',
    cardBg: '#F1F1F1',
    circleClass: 'brown',
    textClass: 'brown',
    opacity: 0.95
  }
];

function formatDate(dateStr) {
  if (!dateStr) return "--/--/--";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { year: 'numeric', month: 'long', day: '2-digit' });
}

function ScheduleModal({ open, onClose, onSubmit, lead }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!date || !time) return;
    const dt = new Date(`${date}T${time}`);
    setSaving(true);
    onSubmit(dt)
      .finally(() => setSaving(false));
  }
  if (!open) return null;
  return (
    <div className={styles.scheduleModalOverlay}>
      <div className={styles.scheduleModal}>
        <button className={styles.closeBtn} onClick={onClose}><FiX /></button>
        <h3>Schedule Lead</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Date:<br />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </label>
          <label>
            Time:<br />
            <input type="time" value={time} onChange={e => setTime(e.target.value)} required />
          </label>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? 'Saving...' : 'Schedule'}
          </button>
        </form>
      </div>
    </div>
  );
}

const LeadOptionsMenu = ({ onType, onStatus, lead, close }) => {
  const [mode, setMode] = useState(null);
  const [type, setType] = useState(lead.leadType);
  const [status, setStatus] = useState(lead.status || 'ongoing');
  const ref = useRef();
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) close();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [close]);
  const canClose = lead.status !== 'closed';

  return (
    <div className={styles.optionsMenu} ref={ref}>
      {!mode && (
        <div>
          <div className={styles.menuItem} onClick={() => setMode('type')}>
            <span>Type</span>
            <span style={{ width: 20, height: 20, display: 'inline-block', borderRadius: 6, background: LEAD_TYPE_COLORS[type], verticalAlign: 'middle', marginLeft: 8 }}></span>
          </div>
          <div className={styles.menuItem} onClick={() => setMode('status')}>
            <span>Lead Status</span>
            <FiCheckCircle size={18} style={{ marginLeft: 8 }} />
          </div>
        </div>
      )}
      {mode === 'type' && (
        <div className={styles.typeSelector}>
          {['hot', 'warm', 'cold'].map(t => (
            <div key={t} className={styles.typeOpt} style={{ background: LEAD_TYPE_COLORS[t] }} onClick={() => { setType(t); onType(t); close(); }}>
              {t[0].toUpperCase() + t.slice(1)}
            </div>
          ))}
        </div>
      )}
      {mode === 'status' && (
        <form className={styles.statusForm} onSubmit={e => { e.preventDefault(); if (status === 'closed' && !canClose) return; onStatus(status); close(); }}>
          <label className={styles.statusLabel}>Lead Status</label>
          <select
            className={styles.statusDropdown}
            value={status}
            onChange={e => setStatus(e.target.value)}
            disabled={!canClose}
          >
            <option value="ongoing">Ongoing</option>
            <option value="closed">Closed</option>
          </select>
          {!canClose && <span className={styles.statusHint}>Lead cannot be closed</span>}
          <button type="submit" className={styles.saveBtn} disabled={!canClose}>Save</button>
        </form>
      )}
    </div>
  );
};

const EmpLead = ({ user }) => {
  const [leads, setLeads] = useState([]);
  const [origLeads, setOrigLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openScheduleId, setOpenScheduleId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLeads(); }, []);

  async function fetchLeads() {
    setLoading(true);
    try {
      const res = await axios.get(`/api/leads?employeeEmail=${encodeURIComponent(user.email)}`);
      const data = res.data;
      if (!Array.isArray(data)) {
        setLeads([]);
        setOrigLeads([]);
        setLoading(false);
        return;
      }
      const withDefaults = data
        .map(l => ({
          ...l,
          leadType: l.leadType || 'warm',
          status: l.status || 'ongoing'
        }));
      setLeads(withDefaults.filter(l => l.assignedTo && user && l.assignedTo._id === user._id));
      setOrigLeads(withDefaults.filter(l => l.assignedTo && user && l.assignedTo._id === user._id));
    } catch {
      setLeads([]);
      setOrigLeads([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    let filtered = origLeads;
    if (search) {
      filtered = filtered.filter(
        l =>
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filter !== 'all') {
      filtered = filtered.filter(l => l.leadType === filter);
    }
    setLeads(filtered);
  }, [search, filter, origLeads]);

  const handleTypeChange = async (leadId, newType) => {
    await axios.put(`/api/leads/${leadId}`, { leadType: newType, employeeEmail: user.email });
    fetchLeads();
  };

  const handleStatusChange = async (leadId, newStatus, lead) => {
    await axios.put(`/api/leads/${leadId}`, { status: newStatus, employeeEmail: user.email });
    fetchLeads();
  };

  const callTypeMap = {
    cold: 'cold',
    hot: 'other',
    warm: 'other'
  };
  const handleSchedule = async (lead, dt) => {
    await axios.post(`/api/calls`, {
      leadId: lead._id,
      contactName: lead.name,
      contact: lead.phone,
      callType: callTypeMap[lead.leadType] || 'other',
      date: dt,
      employeeEmail: user.email
    });
    setOpenScheduleId(null);
    fetchLeads();
  };

  const filterDropdownRef = useRef();
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  useEffect(() => {
    function handle(e) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) setFilterDropdownOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.headerBg}>
        <div className={styles.header}>
          <FiChevronLeft className={styles.backIcon} size={24} />
          <span className={styles.logo}>Canova<span className={styles.logoHighlight}>CRM</span></span>
        </div>
        <div className={styles.pageTitle}>Leads</div>
      </div>
      <div className={styles.searchBarRow}>
        <div className={styles.searchBar}>
          <FiSearch className={styles.searchIcon} size={18} />
          <input
            className={styles.searchInput}
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterBtn} ref={filterDropdownRef} onClick={() => setFilterDropdownOpen(v => !v)}>
          <FiFilter size={20} />
          {filterDropdownOpen && (
            <div className={styles.filterDropdown}>
              <div className={styles.filterOpt + (filter === 'all' ? ` ${styles.active}` : '')} onClick={() => setFilter('all')}>All</div>
              <div className={styles.filterOpt + (filter === 'hot' ? ` ${styles.active}` : '')} onClick={() => setFilter('hot')}>Hot</div>
              <div className={styles.filterOpt + (filter === 'warm' ? ` ${styles.active}` : '')} onClick={() => setFilter('warm')}>Warm</div>
              <div className={styles.filterOpt + (filter === 'cold' ? ` ${styles.active}` : '')} onClick={() => setFilter('cold')}>Cold</div>
            </div>
          )}
        </div>
      </div>
      <div className={styles.leadsList}>
        {loading && <div className={styles.loading}>Loading leads...</div>}
        {!loading && leads.length === 0 && (
          <div className={styles.noLeads}>No leads found</div>
        )}
        {!loading && leads.map((lead, idx) => {
          let s = STATUS_STYLES[1];
          if (lead.status === 'closed') s = STATUS_STYLES[2];
          else if (lead.leadType === 'hot') s = STATUS_STYLES[0];
          else if (lead.leadType === 'cold') s = { ...STATUS_STYLES[0], borderColor: LEAD_TYPE_COLORS.cold };

          return (
            <div
              className={styles.leadCard}
              key={lead._id || idx}
              style={{
                background: s.cardBg,
                opacity: s.opacity
              }}
            >
              <div className={styles.leadInfo}>
                <div className={styles.leadBar} style={{ background: '#FFB043' }} />
                <div style={{ flex: 1 }}>
                  <div className={styles.leadName}>{lead.name}</div>
                  <div className={styles.leadEmail}>@{lead.email}</div>
                  <div className={styles.leadDateLabel}>date</div>
                  <div className={styles.leadDate}>
                    <FiCalendar size={16} style={{ marginRight: 4 }} />
                    {lead.assignedDate ? formatDate(lead.assignedDate) : "--/--/--"}
                  </div>
                </div>
                <div className={styles.leadStatusBlock}>
                  <div
                    className={`${styles.leadStatusCircle} ${s.circleClass ? styles[s.circleClass] : ''}`}
                    style={{
                      borderColor: s.borderColor,
                    }}
                  >
                    <span
                      className={`${styles.leadStatusText} ${s.textClass ? styles[s.textClass] : ''}`}
                      style={{
                        color: s.textColor
                      }}
                    >
                      {s.text}
                    </span>
                  </div>
                  <div className={styles.leadActions}>
                    <FiEdit2 className={styles.actionBtn} title="Change lead type" onClick={() => setOpenMenuId(openMenuId === lead._id ? null : lead._id)} />
                    <FiClock className={styles.actionBtn} title="Schedule" onClick={() => setOpenScheduleId(lead._id)} />
                    <FiCheckCircle className={styles.actionBtn} title="Change status" onClick={() => setOpenMenuId(openMenuId === lead._id ? null : lead._id)} />
                  </div>
                </div>
              </div>
              {openMenuId === lead._id && (
                <LeadOptionsMenu
                  lead={lead}
                  close={() => setOpenMenuId(null)}
                  onType={type => handleTypeChange(lead._id, type)}
                  onStatus={status => handleStatusChange(lead._id, status, lead)}
                />
              )}
              {openScheduleId === lead._id && (
                <ScheduleModal
                  open={true}
                  onClose={() => setOpenScheduleId(null)}
                  onSubmit={dt => handleSchedule(lead, dt)}
                  lead={lead}
                />
              )}
            </div>
          );
        })}
      </div>
      <BottomNav />
    </div>
  );
};

export default EmpLead;