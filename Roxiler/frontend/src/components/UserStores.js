import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function UserStores() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [filters, setFilters] = useState({ name: '', address: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [selectedStore, setSelectedStore] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [stores, filters, sortConfig]);

  const fetchStores = async () => {
    try {
      const response = await api.get('/user/stores');
      setStores(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch stores');
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...stores];

    if (filters.name) {
      filtered = filtered.filter(store =>
        store.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.address) {
      filtered = filtered.filter(store =>
        store.address.toLowerCase().includes(filters.address.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredStores(filtered);
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const openRatingModal = (store) => {
    setSelectedStore(store);
    setRating(store.userRating || 0);
    setHoverRating(0);
    setError('');
    setSuccess('');
  };

  const submitRating = async () => {
    if (rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5');
      return;
    }

    try {
      await api.post(`/user/stores/${selectedStore.id}/rating`, { rating });
      setSuccess('Rating submitted successfully!');
      setTimeout(() => {
        setSelectedStore(null);
        fetchStores();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit rating');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div>
      <nav className="navbar">
        <h1>Store Ratings - User</h1>
        <div>
          <button onClick={() => navigate('/user/change-password')} style={{marginRight: '1rem'}}>
            Change Password
          </button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="container">
        <div className="table-container">
          <h2>All Stores</h2>
          
          <div className="filters">
            <input
              type="text"
              placeholder="Search by name..."
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Search by address..."
              value={filters.address}
              onChange={(e) => setFilters({ ...filters, address: e.target.value })}
            />
          </div>

          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')}>
                  Store Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('address')}>
                  Address {sortConfig.key === 'address' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('overallRating')}>
                  Overall Rating {sortConfig.key === 'overallRating' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th>Your Rating</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStores.map(store => (
                <tr key={store.id}>
                  <td>{store.name}</td>
                  <td>{store.address}</td>
                  <td>{store.overallRating}</td>
                  <td>{store.userRating ? `${store.userRating} ⭐` : 'Not rated'}</td>
                  <td>
                    <button 
                      className="btn btn-small"
                      onClick={() => openRatingModal(store)}
                    >
                      {store.userRating ? 'Modify Rating' : 'Submit Rating'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStore && (
        <div className="modal">
          <div className="modal-content">
            <h3>{selectedStore.userRating ? 'Modify Rating' : 'Submit Rating'}</h3>
            <p><strong>Store:</strong> {selectedStore.name}</p>
            
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            <div style={{textAlign: 'center', margin: '2rem 0'}}>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p style={{marginTop: '1rem'}}>
                {rating > 0 ? `Selected: ${rating} stars` : 'Select a rating'}
              </p>
            </div>

            <div className="modal-buttons">
              <button 
                className="btn btn-secondary btn-small"
                onClick={() => setSelectedStore(null)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-small"
                onClick={submitRating}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserStores;
