import React, { useEffect, useMemo, useState } from 'react';
import { FiCopy, FiEdit2, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { feedbackService } from '../services/api';
import EditFeedbackModal from '../components/EditFeedbackModal';
import './Feedback.css';

const MyFeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editing, setEditing] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadFeedbacks();
  }, [page, searchQuery]);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const query = searchQuery.trim();
      const response = query
        ? await feedbackService.searchMyFeedback(query, page, 10)
        : await feedbackService.getMyFeedback(page, 10);
      setFeedbacks(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
    } catch (err) {
      console.error('Failed to load feedbacks', err);
      alert('Failed to load feedbacks. Please check if the backend is running on localhost:8080.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      try {
        await feedbackService.deleteFeedback(id);
        loadFeedbacks();
      } catch (err) {
        console.error('Failed to delete feedback', err);
      }
    }
  };

  const handleEditSave = async (formData) => {
    if (!editing?.id) return;
    try {
      await feedbackService.editFeedback(
        editing.id,
        formData.title,
        formData.description,
        formData.category,
        formData.rating
      );
      await loadFeedbacks();
    } catch (err) {
      const message = err.response?.data?.message || 'Edit failed';
      throw new Error(message);
    }
  };

  const handleDuplicate = (feedback) => {
    navigate('/add-feedback', {
      state: {
        draft: {
          title: feedback.title,
          description: feedback.description,
          category: feedback.category,
          rating: feedback.rating,
        },
      },
    });
  };

  const handleCopy = async (feedback) => {
    try {
      await navigator.clipboard.writeText(`#${feedback.id} - ${feedback.title}`);
    } catch (e) {
      console.error('Clipboard copy failed', e);
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

  const visibleFeedbacks = useMemo(() => {
    if (statusFilter === 'ALL') return feedbacks;
    return feedbacks.filter(
      (f) => (f.status || '').toLowerCase() === statusFilter.toLowerCase()
    );
  }, [feedbacks, statusFilter]);

  return (
    <div className="feedback-container">
      <div className="feedback-header">
        <h1>My Feedback</h1>
        <p>View and manage your feedback submissions</p>
      </div>

      <div className="feedback-toolbar">
        <div className="feedback-search">
          <FiSearch />
          <input
            value={searchQuery}
            onChange={(e) => {
              setPage(0);
              setSearchQuery(e.target.value);
            }}
            placeholder="Search by title..."
          />
        </div>

        <select
          className="feedback-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          title="Filter by status"
        >
          <option value="ALL">All</option>
          <option value="Pending">Pending</option>
          <option value="Reviewed">Reviewed</option>
          <option value="Resolved">Resolved</option>
        </select>

        <button className="btn-small btn-new" onClick={() => navigate('/add-feedback')}>
          <FiPlus /> New
        </button>
      </div>

      {loading ? (
        <div className="no-feedback">
          <p>Loading...</p>
        </div>
      ) : visibleFeedbacks.length === 0 ? (
        <div className="no-feedback">
          <div className="no-feedback-icon">📋</div>
          <h2>{searchQuery.trim() || statusFilter !== 'ALL' ? 'No matching feedback' : 'No Feedback Yet'}</h2>
          <p>
            {searchQuery.trim() || statusFilter !== 'ALL'
              ? 'Try changing your search or filters.'
              : 'Submit your first feedback to get started'}
          </p>
          {(searchQuery.trim() || statusFilter !== 'ALL') && (
            <button
              className="btn-small btn-new"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setPage(0);
              }}
              style={{ margin: '10px auto 0' }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="feedback-list">
          {visibleFeedbacks.map(feedback => (
            <div key={feedback.id} className="feedback-item">
              <h3 className="feedback-title">{feedback.title}</h3>
              <div className="feedback-meta">
                <span className="feedback-category">{feedback.category}</span>
                <span className={`feedback-status ${getStatusClass(feedback.status)}`}>
                  {feedback.status}
                </span>
                <span className="feedback-rating">★ {feedback.rating}/5</span>
              </div>
              <p className="feedback-description">{feedback.description}</p>
              {feedback.reply && (
                <div className="feedback-reply">
                  <span className="reply-label">Admin Reply:</span>
                  {feedback.reply}
                </div>
              )}
              <div className="feedback-actions">
                <button
                  className="btn-small btn-edit"
                  onClick={() => setEditing(feedback)}
                  disabled={feedback.status && feedback.status !== 'Pending'}
                  title={
                    feedback.status !== 'Pending' ? 'Editing allowed only while Pending' : 'Edit'
                  }
                >
                  <FiEdit2 /> Edit
                </button>
                <button
                  className="btn-small btn-duplicate"
                  onClick={() => handleDuplicate(feedback)}
                  title="Duplicate"
                >
                  <FiPlus /> Duplicate
                </button>
                <button
                  className="btn-small btn-copy"
                  onClick={() => handleCopy(feedback)}
                  title="Copy"
                >
                  <FiCopy /> Copy
                </button>
                <button 
                  className="btn-small btn-delete"
                  onClick={() => handleDelete(feedback.id)}
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
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
          <button 
            disabled={page === totalPages - 1}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}

      <EditFeedbackModal
        isOpen={!!editing}
        initialValue={editing}
        onClose={() => setEditing(null)}
        onSave={handleEditSave}
      />
    </div>
  );
};

export default MyFeedbackPage;
