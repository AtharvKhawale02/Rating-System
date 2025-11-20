import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });
  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState({ name: '', email: '', address: '', role: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddStore, setShowAddStore] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', address: '', role: 'user' });
  const [newStore, setNewStore] = useState({ name: '', email: '', address: '', ownerId: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'stores') fetchStores();
    if (activeTab === 'users') fetchUsers();
  }, [activeTab, filters, sortConfig]);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setStats(response.data);
    } catch (err) {
      setError('Failed to fetch dashboard data');
    }
  };

  const fetchStores = async () => {
    try {
      const params = new URLSearchParams({
        ...filters,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction
      });
      const response = await api.get(`/admin/stores?${params}`);
      setStores(response.data);
    } catch (err) {
      setError('Failed to fetch stores');
    }
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        ...filters,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction
      });
      const response = await api.get(`/admin/users?${params}`);
      setUsers(response.data);
    } catch (err) {
      setError('Failed to fetch users');
    }
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/admin/users', newUser);
      setSuccess('User added successfully!');
      setNewUser({ name: '', email: '', password: '', address: '', role: 'user' });
      setShowAddUser(false);
      fetchUsers();
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add user');
    }
  };

  const handleAddStore = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/admin/stores', newStore);
      setSuccess('Store added successfully!');
      setNewStore({ name: '', email: '', address: '', ownerId: '' });
      setShowAddStore(false);
      fetchStores();
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add store');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div>
      <nav className="navbar">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout}>Logout</button>
      </nav>

      <div className="container">
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <div style={{marginBottom: '2rem'}}>
          <button 
            className={`btn btn-small ${activeTab === 'dashboard' ? '' : 'btn-secondary'}`}
            onClick={() => setActiveTab('dashboard')}
            style={{marginRight: '1rem'}}
          >
            Dashboard
          </button>
          <button 
            className={`btn btn-small ${activeTab === 'stores' ? '' : 'btn-secondary'}`}
            onClick={() => setActiveTab('stores')}
            style={{marginRight: '1rem'}}
          >
            Stores
          </button>
          <button 
            className={`btn btn-small ${activeTab === 'users' ? '' : 'btn-secondary'}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="dashboard-cards">
            <div className="dashboard-card">
              <h3>Total Users</h3>
              <p>{stats.totalUsers}</p>
            </div>
            <div className="dashboard-card">
              <h3>Total Stores</h3>
              <p>{stats.totalStores}</p>
            </div>
            <div className="dashboard-card">
              <h3>Total Ratings</h3>
              <p>{stats.totalRatings}</p>
            </div>
          </div>
        )}

        {activeTab === 'stores' && (
          <div className="table-container">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h2>All Stores</h2>
              <button className="btn btn-small" onClick={() => setShowAddStore(true)}>
                Add New Store
              </button>
            </div>

            <div className="filters">
              <input
                type="text"
                placeholder="Filter by name..."
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Filter by email..."
                value={filters.email}
                onChange={(e) => setFilters({ ...filters, email: e.target.value })}
              />
              <input
                type="text"
                placeholder="Filter by address..."
                value={filters.address}
                onChange={(e) => setFilters({ ...filters, address: e.target.value })}
              />
            </div>

            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')}>
                    Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('email')}>
                    Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('address')}>
                    Address {sortConfig.key === 'address' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('rating')}>
                    Rating {sortConfig.key === 'rating' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {stores.map(store => (
                  <tr key={store.id}>
                    <td>{store.name}</td>
                    <td>{store.email}</td>
                    <td>{store.address}</td>
                    <td>{store.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="table-container">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h2>All Users</h2>
              <button className="btn btn-small" onClick={() => setShowAddUser(true)}>
                Add New User
              </button>
            </div>

            <div className="filters">
              <input
                type="text"
                placeholder="Filter by name..."
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Filter by email..."
                value={filters.email}
                onChange={(e) => setFilters({ ...filters, email: e.target.value })}
              />
              <input
                type="text"
                placeholder="Filter by address..."
                value={filters.address}
                onChange={(e) => setFilters({ ...filters, address: e.target.value })}
              />
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')}>
                    Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('email')}>
                    Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('address')}>
                    Address {sortConfig.key === 'address' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('role')}>
                    Role {sortConfig.key === 'role' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.address}</td>
                    <td>{user.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showAddUser && (
          <div className="modal">
            <div className="modal-content">
              <h3>Add New User</h3>
              <form onSubmit={handleAddUser}>
                <div className="form-group">
                  <label>Name (20-60 characters)</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    required
                    minLength="20"
                    maxLength="60"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password (8-16 chars, 1 uppercase, 1 special)</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    minLength="8"
                    maxLength="16"
                  />
                </div>
                <div className="form-group">
                  <label>Address (max 400 characters)</label>
                  <input
                    type="text"
                    value={newUser.address}
                    onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                    required
                    maxLength="400"
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="user">User</option>
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="modal-buttons">
                  <button type="button" className="btn btn-secondary btn-small" onClick={() => setShowAddUser(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-small">
                    Add User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAddStore && (
          <div className="modal">
            <div className="modal-content">
              <h3>Add New Store</h3>
              <form onSubmit={handleAddStore}>
                <div className="form-group">
                  <label>Store Name (20-60 characters)</label>
                  <input
                    type="text"
                    value={newStore.name}
                    onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                    required
                    minLength="20"
                    maxLength="60"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={newStore.email}
                    onChange={(e) => setNewStore({ ...newStore, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Address (max 400 characters)</label>
                  <input
                    type="text"
                    value={newStore.address}
                    onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                    required
                    maxLength="400"
                  />
                </div>
                <div className="form-group">
                  <label>Owner ID</label>
                  <input
                    type="number"
                    value={newStore.ownerId}
                    onChange={(e) => setNewStore({ ...newStore, ownerId: e.target.value })}
                    required
                  />
                  <small>Enter the user ID of the store owner</small>
                </div>
                <div className="modal-buttons">
                  <button type="button" className="btn btn-secondary btn-small" onClick={() => setShowAddStore(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-small">
                    Add Store
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
