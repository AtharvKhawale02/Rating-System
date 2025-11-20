import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (formData.name.length < 20 || formData.name.length > 60) {
      setError('Name must be between 20 and 60 characters');
      return false;
    }

    if (formData.address.length > 400) {
      setError('Address must not exceed 400 characters');
      return false;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,16}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must be 8-16 characters with at least one uppercase letter and one special character');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/signup', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/user/stores');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name (20-60 characters)</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            minLength="20"
            maxLength="60"
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Password (8-16 chars, 1 uppercase, 1 special)</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="8"
            maxLength="16"
          />
        </div>
        <div className="form-group">
          <label>Address (max 400 characters)</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            maxLength="400"
          />
        </div>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
      <div className="link" onClick={() => navigate('/login')}>
        Already have an account? Login
      </div>
    </div>
  );
}

export default Signup;
