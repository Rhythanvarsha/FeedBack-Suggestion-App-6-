import React, { useEffect, useState } from 'react';
import {
  FiDownload,
  FiFilter,
  FiMessageCircle,
  FiSearch,
  FiStar,
  FiTrash2,
  FiCheckSquare,
  FiSquare,
} from 'react-icons/fi';
import { adminService } from '../services/api';
import './Dashboard.css';

const AdminFeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');

  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkStatus, setBulkStatus] = useState('Reviewed');

  useEffect(() => {
    loadFeedbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter, activeQuery]);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      let response;
      const q = (activeQuery || '').trim();

      if (q) {
        response = await adminService.searchFeedback(q, page, 10);
      } else if (filter === 'all') {
        response = await adminService.getAllFeedback(page, 10);
      } else {
        response = await adminService.getFeedbackByStatus(filter, page, 10);
      }

      setFeedbacks(response.data.content || []);
      setTotalPages(response.data.totalPages ?? 0);

      const visible = new Set((response.data.content || []).map((f) => f.id));
      setSelectedIds((prev) => {
        const next = new Set();
        prev.forEach((id) => {
          if (visible.has(id)) next.add(id);
        });
        return next;
      });
    } catch (err) {
      console.error('Failed to load feedbacks', err);
      setFeedbacks([]);
      setTotalPages(0);
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = (searchQuery || '').trim();
    setActiveQuery(q);
    setPage(0);

    // Keep the behavior unambiguous: search is separate from status filtering.
    if (q) setFilter('all');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveQuery('');
    setPage(0);
  };

  const handleExportCsv = async () => {
    try {
      const q = (activeQuery || '').trim();
      const status = !q && filter !== 'all' ? filter : null;
      const title = q ? q : null;

      const res = await adminService.exportFeedbackCsv(status, title);
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      const dispo = res.headers?.['content-disposition'] || res.headers?.['Content-Disposition'];
      const match = dispo && dispo.match(/filename=\"([^\"]+)\"/);

      a.href = url;
      a.download = match ? match[1] : 'feedback_export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV', err);
      alert('Failed to export CSV. Please try again.');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const visibleIds = feedbacks.map((f) => f.id);
      if (visibleIds.length === 0) return new Set();
      const allSelected = visibleIds.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(visibleIds);
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkApply = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      await adminService.bulkUpdateFeedbackStatus(ids, bulkStatus);
      clearSelection();
      loadFeedbacks();
    } catch (err) {
      console.error('Bulk status update failed', err);
      alert(err.response?.data?.message || 'Bulk update failed. Please try again.');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await adminService.updateFeedbackStatus(id, status);
      loadFeedbacks();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleReplySubmit = async (id) => {
    try {
      await adminService.addReplyToFeedback(id, replyText);
      setReplyingTo(null);
      setReplyText('');
      loadFeedbacks();
    } catch (err) {
      console.error('Failed to add reply', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this feedback?')) {
      try {
        await adminService.deleteFeedback(id);
        loadFeedbacks();
      } catch (err) {
        console.error('Failed to delete feedback', err);
      }
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Pending':
        return 'status-pending';
      case 'Reviewed':
        return 'status-reviewed';
      case 'Resolved':
        return 'status-resolved';
      default:
        return '';
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Manage Feedback</h1>
        <p>Review and manage user feedback (your category only)</p>
      </div>

      <div className="admin-filters">
        <div className="filter-buttons">
          {['all', 'Pending', 'Reviewed', 'Resolved'].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => {
                setFilter(f);
                setPage(0);
              }}
              disabled={loading}
            >
              <FiFilter /> {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-toolbar">
        <form className="admin-search" onSubmit={handleSearchSubmit}>
          <FiSearch />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title..."
            aria-label="Search feedback by title"
          />
          <button className="admin-tool-btn" type="submit" disabled={loading}>
            Search
          </button>
          {activeQuery && (
            <button
              className="admin-tool-btn admin-tool-btn-muted"
              type="button"
              onClick={clearSearch}
              disabled={loading}
            >
              Clear
            </button>
          )}
        </form>

        <button
          className="admin-tool-btn admin-tool-btn-primary"
          type="button"
          onClick={handleExportCsv}
          disabled={loading}
          title="Export feedback as CSV"
        >
          <FiDownload /> Export CSV
        </button>
      </div>

      {selectedIds.size > 0 && (
        <div className="bulk-bar" role="region" aria-label="Bulk actions">
          <div className="bulk-left">
            <strong>{selectedIds.size}</strong> selected
            <button className="bulk-link" type="button" onClick={clearSelection} disabled={loading}>
              Clear
            </button>
          </div>
          <div className="bulk-right">
            <label className="bulk-label">
              Set status:
              <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} disabled={loading}>
                <option value="Pending">Pending</option>
                <option value="Reviewed">Reviewed</option>
                <option value="Resolved">Resolved</option>
              </select>
            </label>
            <button className="admin-tool-btn admin-tool-btn-primary" type="button" onClick={handleBulkApply} disabled={loading}>
              Apply
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="no-feedback">
          <div className="no-feedback-icon">
            <FiMessageCircle />
          </div>
          <h2>Loading...</h2>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="no-feedback">
          <div className="no-feedback-icon">
            <FiMessageCircle />
          </div>
          <h2>No Feedback Found</h2>
        </div>
      ) : (
        <div className="feedback-list">
          {feedbacks.map((feedback) => (
            <div key={feedback.id} className="admin-feedback-item">
              <div className="feedback-header-admin">
                <div className="feedback-title-row">
                  <button
                    type="button"
                    className="bulk-checkbox"
                    onClick={() => toggleSelect(feedback.id)}
                    aria-label={selectedIds.has(feedback.id) ? 'Deselect feedback' : 'Select feedback'}
                  >
                    {selectedIds.has(feedback.id) ? <FiCheckSquare /> : <FiSquare />}
                  </button>
                  <h3>{feedback.title}</h3>
                </div>
                <span className={`feedback-status ${getStatusClass(feedback.status)}`}>
                  {feedback.status}
                </span>
              </div>

              <div className="feedback-meta">
                <span>
                  By: <strong>{feedback.username}</strong>
                </span>
                <span>
                  Category: <strong>{feedback.category}</strong>
                </span>
                <span>
                  Rating:{' '}
                  <strong>
                    <FiStar style={{ verticalAlign: 'text-bottom' }} /> {feedback.rating}/5
                  </strong>
                </span>
              </div>

              <p className="feedback-description">{feedback.description}</p>

              {feedback.reply && (
                <div className="existing-reply">
                  <strong>Reply:</strong>
                  <p>{feedback.reply}</p>
                </div>
              )}

              {replyingTo === feedback.id ? (
                <div className="reply-form">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    rows="4"
                  />
                  <div className="reply-buttons">
                    <button className="btn-small btn-success" onClick={() => handleReplySubmit(feedback.id)}>
                      Send Reply
                    </button>
                    <button className="btn-small btn-cancel" onClick={() => setReplyingTo(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="admin-actions">
                  <select
                    value={feedback.status}
                    onChange={(e) => handleStatusChange(feedback.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Reviewed">Reviewed</option>
                    <option value="Resolved">Resolved</option>
                  </select>

                  <button className="btn-small btn-reply" onClick={() => setReplyingTo(feedback.id)}>
                    <FiMessageCircle /> Reply
                  </button>

                  <button className="btn-small btn-delete" onClick={() => handleDelete(feedback.id)}>
                    <FiTrash2 /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={page === i ? 'active' : ''}
              onClick={() => setPage(i)}
            >
              {i + 1}
            </button>
          ))}
          <button disabled={page === totalPages - 1} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      )}

      {feedbacks.length > 0 && !loading && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
          <button className="admin-tool-btn admin-tool-btn-muted" type="button" onClick={toggleSelectAllVisible}>
            {feedbacks.every((f) => selectedIds.has(f.id)) ? 'Deselect all on page' : 'Select all on page'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminFeedbackPage;
