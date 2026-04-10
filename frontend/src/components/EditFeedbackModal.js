import React, { useEffect, useState } from 'react';
import { FiX, FiSave } from 'react-icons/fi';
import './EditFeedbackModal.css';

const EditFeedbackModal = ({ isOpen, initialValue, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Website',
    rating: 5,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setSaving(false);
    setFormData({
      title: initialValue?.title || '',
      description: initialValue?.description || '',
      category: initialValue?.category || 'Website',
      rating: initialValue?.rating || 5,
    });
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (e2) {
      setError(e2?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose} role="presentation">
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>Edit Feedback</h3>
          <button className="modal-icon-btn" onClick={onClose} title="Close">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="modal-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="edit-title">Title</label>
            <input
              id="edit-title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-description">Description</label>
            <textarea
              id="edit-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="6"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-category">Category</label>
              <select id="edit-category" name="category" value={formData.category} onChange={handleChange}>
                {['Website', 'Mobile App', 'Service', 'Support', 'Other'].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="edit-rating">Rating</label>
              <select id="edit-rating" name="rating" value={formData.rating} onChange={handleChange}>
                {[1, 2, 3, 4, 5].map((r) => (
                  <option key={r} value={r}>
                    {r} Stars
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-small btn-cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-small btn-save" disabled={saving}>
              <FiSave /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFeedbackModal;

