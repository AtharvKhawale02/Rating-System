import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import UserStores from './components/UserStores';
import AdminDashboard from './components/AdminDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import ChangePassword from './components/ChangePassword';
import './index.css';

function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route
          path="/user/stores"
          element={
            <PrivateRoute allowedRoles={['user']}>
              <UserStores />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/user/change-password"
          element={
            <PrivateRoute allowedRoles={['user']}>
              <ChangePassword />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/owner/dashboard"
          element={
            <PrivateRoute allowedRoles={['owner']}>
              <OwnerDashboard />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/owner/change-password"
          element={
            <PrivateRoute allowedRoles={['owner']}>
              <ChangePassword />
            </PrivateRoute>
          }
        />
        
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
