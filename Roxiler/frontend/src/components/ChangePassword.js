import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function ChangePassword() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,16}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (!validatePassword(formData.newPassword)) {
      setError('Password must be 8-16 characters with at least one uppercase letter and one special character');
      return;
    }

    setLoading(true);

    try {
      const endpoint = user.role === 'owner' ? '/owner/password' : '/user/password';
      await api.put(endpoint, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      setSuccess('Password updated successfully!');
      setTimeout(() => {
        navigate(user.role === 'owner' ? '/owner/dashboard' : '/user/stores');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <nav className="navbar">
        <h1>Change Password</h1>
        <button onClick={() => navigate(user.role === 'owner' ? '/owner/dashboard' : '/user/stores')}>
          Back to Dashboard
        </button>
      </nav>

      <div className="auth-container">
        <h2>Change Your Password</h2>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>New Password (8-16 chars, 1 uppercase, 1 special)</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              minLength="8"
              maxLength="16"
            />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;
