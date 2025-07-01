import React, { useEffect, useState, useRef } from "react";
import styles from "./EmpSchedule.module.css";
import BottomNav from "../components/BottomNav";
import { FiChevronLeft, FiSearch, FiFilter, FiMapPin } from "react-icons/fi";


const CALL_TYPE_LABEL = {
  referral: "Referral",
  cold: "Cold call",
  other: "Other"
};

function formatDateShort(dateStr) {
  if (!dateStr) return "--/--/--";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { year: "2-digit", month: "2-digit", day: "2-digit" });
}

const ScheduleFilter = ({ open, filter, setFilter, onClose, onApply }) => {
  const ref = useRef();
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return open ? (
    <div className={styles.filterOverlay}>
      <div className={styles.filterModal} ref={ref}>
        <div className={styles.filterTitle}>Filter</div>
        <div className={styles.filterOptions}>
          <button
            className={filter === "today" ? styles.selected : ""}
            onClick={() => setFilter("today")}
            type="button"
          >Today</button>
          <button
            className={filter === "all" ? styles.selected : ""}
            onClick={() => setFilter("all")}
            type="button"
          >All</button>
        </div>
        <button className={styles.saveBtn} onClick={onApply}>Save</button>
      </div>
    </div>
  ) : null;
};

const EmpSchedule = ({ user }) => {
  const [calls, setCalls] = useState([]);
  const [displayed, setDisplayed] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("today");
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCalls(); }, []);

  async function fetchCalls() {
    setLoading(true);
    const res = await fetch(`http://localhost:5000/api/calls?employeeEmail=${encodeURIComponent(user.email)}`);
    let data = await res.json();
    data = data.filter(c => c.status === "scheduled");
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    setCalls(data);
    setLoading(false);
  }

  useEffect(() => {
    let filtered = calls;

    if (filter === "today") {
      const today = new Date();
      filtered = filtered.filter((c) => {
        const callDate = new Date(c.date);
        return (
          callDate.getDate() === today.getDate() &&
          callDate.getMonth() === today.getMonth() &&
          callDate.getFullYear() === today.getFullYear()
        );
      });
    }

    if (search.trim()) {
      filtered = filtered.filter(
        (c) =>
          (c.contactName && c.contactName.toLowerCase().includes(search.toLowerCase())) ||
          (c.contact && c.contact.includes(search)) ||
          (c.callType && CALL_TYPE_LABEL[c.callType].toLowerCase().includes(search.toLowerCase()))
      );
    }
    setDisplayed(filtered);
  }, [calls, search, filter]);


  const first = displayed[0];
  const rest = displayed.slice(1);

  return (
    <div className={styles.root}>
      <div className={styles.headerBg}>
        <div className={styles.header}>
          <FiChevronLeft className={styles.backIcon} size={24} />
          <span className={styles.logo}>Canova<span className={styles.logoHighlight}>CRM</span></span>
        </div>
        <div className={styles.pageTitle}>Schedule</div>
      </div>

      <div className={styles.searchRow}>
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} size={18} />
          <input
            className={styles.searchInput}
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterBtn} onClick={() => setFilterOpen(v => !v)}>
          <FiFilter size={22} />
        </div>
        <ScheduleFilter
          open={filterOpen}
          filter={filter}
          setFilter={setFilter}
          onClose={() => setFilterOpen(false)}
          onApply={() => setFilterOpen(false)}
        />
      </div>

      <div className={styles.cardsArea}>
        {loading && <div className={styles.loading}>Loading scheduled calls...</div>}
        {!loading && displayed.length === 0 && (
          <div className={styles.noCalls}>No scheduled calls found</div>
        )}
        {!loading && first && (
          <div className={styles.highlightCard} key={first._id || 0}>
            <div className={styles.typeLabel}>{CALL_TYPE_LABEL[first.callType] || "Other"}</div>
            <div className={styles.phone}>{first.contact || "--"}</div>
            <div className={styles.row}>
              <FiMapPin size={16} style={{ marginRight: 4, color: "#fff" }} />
              <span>Call</span>
            </div>
            <div className={styles.personRow}>
              <span className={styles.personName}>{first.contactName}</span>
            </div>
            <div className={styles.highlightDate}>
              Date <span>{formatDateShort(first.date)}</span>
            </div>
          </div>
        )}
        {!loading && rest.map((call) => (
          <div className={styles.card} key={call._id}>
            <div className={styles.cardRow}>
              <div>
                <div className={styles.typeLabel2}>{CALL_TYPE_LABEL[call.callType] || "Other"}</div>
                <div className={styles.phone2}>{call.contact || "--"}</div>
              </div>
              <div className={styles.dateCol}>
                <div className={styles.dateLabel}>Date</div>
                <div className={styles.dateVal}>{formatDateShort(call.date)}</div>
              </div>
            </div>
            <div className={styles.cardRow}>
              <div className={styles.row}><FiMapPin size={15} style={{ marginRight: 4 }} />Call</div>
              <div className={styles.cardPerson}>
                <span className={styles.personName}>{call.contactName}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  );
};

export default EmpSchedule;