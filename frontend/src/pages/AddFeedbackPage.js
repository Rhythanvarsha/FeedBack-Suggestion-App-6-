import React, { useEffect, useMemo, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiStar, FiTag } from 'react-icons/fi';
import { feedbackService } from '../services/api';
import AuthContext from '../context/AuthContext';
import './Feedback.css';

const AddFeedbackPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const draftKey = useMemo(() => (user?.id ? `feedback_draft_${user.id}` : null), [user?.id]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Website',
    rating: 5
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = ['Website', 'Mobile App', 'Service', 'Support', 'Other'];

  useEffect(() => {
    if (!draftKey) return;

    const incomingDraft = location.state?.draft;
    if (incomingDraft) {
      setFormData((prev) => ({ ...prev, ...incomingDraft }));
      localStorage.setItem(draftKey, JSON.stringify({ ...formData, ...incomingDraft }));
      return;
    }

    try {
      const stored = localStorage.getItem(draftKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          setFormData((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey) return;
    const handle = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(formData));
      } catch {
        // ignore
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [draftKey, formData]);

  const clearDraft = () => {
    if (!draftKey) return;
    localStorage.removeItem(draftKey);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await feedbackService.submitFeedback(
        formData.title,
        formData.description,
        formData.category,
        formData.rating,
        user.id,
        user.email
      );
      clearDraft();
      navigate('/my-feedback');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-container">
      <div className="feedback-header">
        <h1>Submit Feedback</h1>
        <p>Help us improve by sharing your feedback and suggestions</p>
      </div>

      <div className="feedback-form-wrapper">
        <div className="feedback-card">
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="form-group">
              <label htmlFor="title">
                <FiMessageSquare /> Feedback Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Give a short title for your feedback"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your feedback in detail..."
                rows="6"
                required
              ></textarea>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">
                  <FiTag /> Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="rating">
                  <FiStar /> Rating (1-5)
                </label>
                <select
                  id="rating"
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                >
                  {[1, 2, 3, 4, 5].map(r => (
                    <option key={r} value={r}>{r} Stars</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
            <button
              type="button"
              className="btn btn-submit"
              onClick={() => {
                clearDraft();
                setFormData({ title: '', description: '', category: 'Website', rating: 5 });
              }}
              disabled={loading}
              style={{ marginTop: 10, background: '#e0e0e0', color: '#333' }}
            >
              Clear Draft
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddFeedbackPage;
