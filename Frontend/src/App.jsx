import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Incomes from './pages/Incomes';
function App() {

  return (
<Router>
  <Routes>
    <Route path="/" element={<Auth/>}/>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/expenses" element={<Expenses/>}/>
    <Route path='/incomes' element={<Incomes/>}/>
  </Routes>
</Router>
  )
}

export default App
