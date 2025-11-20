import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function OwnerDashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/owner/dashboard');
      setDashboardData(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      setLoading(false);
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
        <h1>Store Owner Dashboard</h1>
        <div>
          <button onClick={() => navigate('/owner/change-password')} style={{marginRight: '1rem'}}>
            Change Password
          </button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="container">
        {error && <div className="error">{error}</div>}

        {dashboardData.length === 0 ? (
          <div className="table-container">
            <p>You don't have any stores yet.</p>
          </div>
        ) : (
          dashboardData.map(store => (
            <div key={store.storeId} className="table-container" style={{marginBottom: '2rem'}}>
              <h2>{store.storeName}</h2>
              
              <div className="dashboard-cards">
                <div className="dashboard-card">
                  <h3>Average Rating</h3>
                  <p>{store.averageRating}</p>
                </div>
                <div className="dashboard-card">
                  <h3>Total Ratings</h3>
                  <p>{store.totalRatings}</p>
                </div>
              </div>

              {store.ratings.length > 0 ? (
                <>
                  <h3 style={{marginTop: '1.5rem'}}>User Ratings</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th>User Email</th>
                        <th>Rating</th>
                        <th>Submitted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {store.ratings.map((rating, idx) => (
                        <tr key={idx}>
                          <td>{rating.userName}</td>
                          <td>{rating.userEmail}</td>
                          <td>{rating.rating} ⭐</td>
                          <td>{new Date(rating.submittedAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p style={{marginTop: '1rem'}}>No ratings submitted yet.</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default OwnerDashboard;
