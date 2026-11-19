import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import AcceptInvite from './pages/AcceptInvite'
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Incomes from './pages/Incomes';
import Budgets from './pages/Budgets';
import Family from './pages/Family';
import SavingsGoals from './pages/SavingsGoals';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/accept-invite/:token" element={<AcceptInvite />} />
        <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/expenses"      element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
        <Route path="/incomes"       element={<ProtectedRoute><Incomes /></ProtectedRoute>} />
        <Route path="/budgets"       element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
        <Route path="/family"        element={<ProtectedRoute><Family /></ProtectedRoute>} />
        <Route path="/savings"       element={<ProtectedRoute><SavingsGoals /></ProtectedRoute>} />
        <Route path="/analytics"     element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      </Routes>
    </Router>
  )
}

export default App
