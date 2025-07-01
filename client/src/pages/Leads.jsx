import React, { useEffect, useState, useRef } from 'react';
import styles from './Leads.module.css';
import { FiUpload, FiX, FiDownload, FiMoreHorizontal, FiUser, FiTrash2 } from 'react-icons/fi';

function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB');
}

const Leads = () => {
  const [batches, setBatches] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [csvFile, setCsvFile] = useState(null);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvSize, setCsvSize] = useState('');
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState(60);
  const [showConfirm, setShowConfirm] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [assignEmployees, setAssignEmployees] = useState([]);
  const [employeeToRemove, setEmployeeToRemove] = useState(null);


  const [dropdownOpenBatch, setDropdownOpenBatch] = useState(null);
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [showDeleteBatchConfirm, setShowDeleteBatchConfirm] = useState(false);

  const inputRef = useRef();

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (modalStep === 2 && showModal) {
      fetchEmployees();
    }
  }, [modalStep, showModal]);

  const fetchEmployees = () => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:5000/api/employees', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setEmployees(data);
        setAssignEmployees(data.map(e => e._id));
      });
  };

  const filteredBatches = search
    ? batches.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase())
      )
    : batches;

  function fetchBatches() {
    const token = localStorage.getItem('token');
    fetch('http://localhost:5000/api/leads', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(leads => {
        const byFile = {};
        leads.forEach(l => {
          const file = l.fileName || l.batch || l.csvBatch || 'Unknown';
          if (!byFile[file]) {
            byFile[file] = {
              name: file,
              date: l.date,
              total: 0,
              assigned: 0,
              unassigned: 0,
            };
          }
          byFile[file].total++;
          if (l.status === 'assigned') byFile[file].assigned++;
          if (l.status === 'unassigned') byFile[file].unassigned++;
        });
        setBatches(Object.values(byFile));
      });
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.csv')) {
      setCsvFile(file);
      setCsvFileName(file.name);
      setCsvSize((file.size / 1024 / 1024).toFixed(1) + 'MB');
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange({ target: { files: e.dataTransfer.files } });
    }
  };

  const handleUpload = () => {
    setVerifying(true);
    setModalStep(2);
    let v = 60;
    const interval = setInterval(() => {
      v += 5;
      setVerifyProgress(v);
      if (v >= 100) {
        clearInterval(interval);
        setVerifying(false);
      }
    }, 350);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setModalStep(1);
    setCsvFile(null);
    setCsvFileName('');
    setCsvSize('');
    setVerifying(false);
    setVerifyProgress(60);
    setShowConfirm(false);
    setEmployees([]);
    setAssignEmployees([]);
    setEmployeeToRemove(null);
    setDropdownOpenBatch(null);
    setBatchToDelete(null);
    setShowDeleteBatchConfirm(false);
  };

 
  const handleRemoveEmployeeAttempt = (id) => {
    setEmployeeToRemove(id);
    setShowConfirm(true);
  };

  const handleRemoveEmployee = () => {
    if (employeeToRemove) {
      setAssignEmployees(assignEmployees.filter(eid => eid !== employeeToRemove));
      setEmployeeToRemove(null);
      setShowConfirm(false);
    }
  };

  const handleCsvConfirm = () => {
    setUploading(true);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('csv', csvFile);
    formData.append('fileName', csvFileName);
    formData.append('employeeIds', JSON.stringify(assignEmployees));
    fetch('http://localhost:5000/api/leads/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    })
      .then(res => res.json())
      .then(() => {
        setUploading(false);
        handleModalClose();
        setTimeout(fetchBatches, 600);
      });
  };

  const handleSampleDownload = () => {
    window.open('http://localhost:5000/api/leads/sample-csv', '_blank');
  };


  const handleBatchDropdown = (batchName) => {
    setDropdownOpenBatch(dropdownOpenBatch === batchName ? null : batchName);
  };


  const handleDeleteBatchPrompt = (batchName) => {
    setBatchToDelete(batchName);
    setShowDeleteBatchConfirm(true);
    setDropdownOpenBatch(null);
  };

 
  const handleDeleteBatch = () => {
    if (!batchToDelete) return;
    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/api/leads/batch/${encodeURIComponent(batchToDelete)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(() => {
        setShowDeleteBatchConfirm(false);
        setBatchToDelete(null);
        fetchBatches();
      });
  };

  return (
    <div className={styles.leadsWrapper}>
      <div className={styles.topBar}>
        <input
          className={styles.searchInput}
          placeholder="Search files..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          Add Leads
        </button>
      </div>
      <div className={styles.breadcrumb}>Home &gt; Leads</div>
      <div className={styles.tableSection}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>No.</th>
              <th>Name</th>
              <th>Date</th>
              <th>No. of Leads</th>
              <th>Assigned Leads</th>
              <th>Unassigned Leads</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredBatches.map((batch, i) => (
              <tr key={batch.name}>
                <td>{String(i + 1).padStart(2, '0')}</td>
                <td>{batch.name}</td>
                <td>{formatDate(batch.date)}</td>
                <td>{batch.total}</td>
                <td>{batch.assigned}</td>
                <td>{batch.unassigned}</td>
                <td style={{ position: 'relative' }}>
                  <FiMoreHorizontal
                    className={styles.moreIcon}
                    onClick={() => handleBatchDropdown(batch.name)}
                    style={{ cursor: 'pointer' }}
                  />
                  {dropdownOpenBatch === batch.name && (
                    <div className={styles.dropdownMenu}>
                      <button
                        className={styles.dropdownDelete}
                        onClick={() => handleDeleteBatchPrompt(batch.name)}
                      >
                        <FiTrash2 style={{ marginRight: 6 }} />
                        Delete Leads
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filteredBatches.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#aaa' }}>
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
     
      {showDeleteBatchConfirm && (
        <div className={styles.modalBackdrop}>
          <div className={styles.confirmBox}>
            <div>
              Are you sure you want to delete all leads in <b>{batchToDelete}</b>? This cannot be undone.
            </div>
            <div className={styles.confirmBtns}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowDeleteBatchConfirm(false)}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleDeleteBatch}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
     
      {showModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <button className={styles.closeBtn} onClick={handleModalClose}>
              <FiX />
            </button>
            <div className={styles.modalTitle}>CSV Upload</div>
            <div className={styles.modalSubTitle}>Add your documents here</div>
            <div
              className={styles.uploadArea}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              {modalStep === 1 && !csvFile && (
                <>
                  <FiUpload className={styles.uploadIcon} />
                  <div className={styles.dragText}>Drag your file(s) to start uploading</div>
                  <div className={styles.or}>OR</div>
                  <button
                    className={styles.browseBtn}
                    onClick={() => inputRef.current.click()}
                  >
                    Browse files
                  </button>
                  <input
                    type="file"
                    accept=".csv"
                    style={{ display: 'none' }}
                    ref={inputRef}
                    onChange={handleFileChange}
                  />
                  <div className={styles.sampleRow}>
                    <input
                      type="text"
                      value="Sample File.csv"
                      readOnly
                      className={styles.sampleInput}
                    />
                    <button
                      className={styles.downloadSample}
                      onClick={handleSampleDownload}
                      title="Download Sample CSV"
                    >
                      <FiDownload />
                    </button>
                  </div>
                </>
              )}
              {modalStep === 1 && csvFile && (
                <div className={styles.fileRow}>
                  <span className={styles.csvIcon}>CSV</span>
                  <span className={styles.fileName}>{csvFileName}</span>
                  <span className={styles.fileSize}>{csvSize}</span>
                  <button className={styles.removeFileBtn} onClick={() => setCsvFile(null)}>
                    <FiX />
                  </button>
                </div>
              )}
              {modalStep === 2 && (
                <>
                  <div className={styles.verifyingBox}>
                    <div className={styles.progressCircle}>
                      <svg width="48" height="48">
                        <circle
                          cx="24"
                          cy="24"
                          r="21"
                          fill="none"
                          stroke="#f2f2f2"
                          strokeWidth="6"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="21"
                          fill="none"
                          stroke="#232323"
                          strokeWidth="6"
                          strokeDasharray={2 * Math.PI * 21}
                          strokeDashoffset={
                            2 * Math.PI * 21 * (1 - verifyProgress / 100)
                          }
                          style={{ transition: 'stroke-dashoffset 0.3s' }}
                        />
                        <text
                          x="50%"
                          y="53%"
                          textAnchor="middle"
                          fontSize="12"
                          fill="#232323"
                          dy=".3em"
                        >
                          {verifyProgress}%
                        </text>
                      </svg>
                    </div>
                    <div className={styles.verifyingText}>Verifying...</div>
                    <button
                      className={styles.cancelBtn}
                      onClick={handleModalClose}
                      disabled={uploading}
                    >
                      Cancel
                    </button>
                  </div>
                  {!verifying && (
                    <div className={styles.assignmentList}>
                      <div className={styles.assignmentTitle}>Assign leads to employees:</div>
                      {employees
                        .filter(e => assignEmployees.includes(e._id))
                        .map(e => (
                          <div className={styles.assignmentEmployee} key={e._id}>
                            <FiUser className={styles.assignmentUserIcon} />
                            <span className={styles.assignmentName}>{e.name}</span>
                            <button
                              className={styles.assignmentRemove}
                              onClick={() => handleRemoveEmployeeAttempt(e._id)}
                              title="Remove from assignment"
                              disabled={assignEmployees.length === 1}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        ))}
                      {assignEmployees.length === 0 && (
                        <div className={styles.noEmployeeWarning}>
                          No employees selected. All leads will be unassigned.
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            {modalStep === 1 && (
              <div className={styles.modalFooter}>
                <button className={styles.cancelBtn} onClick={handleModalClose}>
                  Cancel
                </button>
                <button
                  className={styles.nextBtn}
                  onClick={() => {
                    if (csvFile) handleUpload();
                  }}
                  disabled={!csvFile}
                >
                  Next <span className={styles.arrow}>&#8250;</span>
                </button>
              </div>
            )}
            {modalStep === 2 && (
              <div className={styles.modalFooter}>
                <button
                  className={styles.cancelBtn}
                  onClick={handleModalClose}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  className={styles.uploadBtn}
                  onClick={handleCsvConfirm}
                  disabled={uploading || verifying}
                  style={{ opacity: uploading || verifying ? 0.4 : 1 }}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            )}
            {showConfirm && employeeToRemove && (
              <div className={styles.confirmBox}>
                <div>
                  All the Leads will be distributed among other employees equally.
                  Do you want to delete this employee from assignment?
                </div>
                <div className={styles.confirmBtns}>
                  <button
                    className={styles.cancelBtn}
                    onClick={() => {
                      setEmployeeToRemove(null);
                      setShowConfirm(false);
                    }}
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.confirmBtn}
                    onClick={handleRemoveEmployee}
                    disabled={uploading}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;