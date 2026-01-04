import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Transactions from './pages/Transactions'
import Budgets from './pages/Budgets'
import Investments from './pages/Investments'

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <h1>Personal Finance Dashboard</h1>
          <ul className="nav-menu">
            <li><NavLink to="/">Dashboard</NavLink></li>
            <li><NavLink to="/accounts">Accounts</NavLink></li>
            <li><NavLink to="/transactions">Transactions</NavLink></li>
            <li><NavLink to="/budgets">Budgets</NavLink></li>
            <li><NavLink to="/investments">Investments</NavLink></li>
          </ul>
        </nav>

        <div className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/investments" element={<Investments />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
