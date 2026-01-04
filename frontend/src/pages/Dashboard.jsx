import React, { useState, useEffect } from 'react'
import { getDashboardSummary, getIncomeVsExpensesTrend } from '../services/api'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0']

function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [trend, setTrend] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const [summaryRes, trendRes] = await Promise.all([
        getDashboardSummary(),
        getIncomeVsExpensesTrend({ months: 6 })
      ])
      setSummary(summaryRes.data)
      setTrend(trendRes.data.trend || [])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading) {
    return <div className="loading">Loading dashboard...</div>
  }

  if (!summary) {
    return <div className="error">Failed to load dashboard data</div>
  }

  const { net_worth, current_month_cash_flow, current_month_spending } = summary

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Dashboard</h1>

      {/* Key Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Net Worth</h3>
          <div className={`stat-value ${net_worth.net_worth >= 0 ? 'stat-positive' : 'stat-negative'}`}>
            {formatCurrency(net_worth.net_worth)}
          </div>
        </div>

        <div className="stat-card">
          <h3>Total Assets</h3>
          <div className="stat-value stat-positive">
            {formatCurrency(net_worth.total_assets)}
          </div>
        </div>

        <div className="stat-card">
          <h3>Total Liabilities</h3>
          <div className="stat-value stat-negative">
            {formatCurrency(net_worth.total_liabilities)}
          </div>
        </div>

        <div className="stat-card">
          <h3>Monthly Cash Flow</h3>
          <div className={`stat-value ${current_month_cash_flow.net_cash_flow >= 0 ? 'stat-positive' : 'stat-negative'}`}>
            {formatCurrency(current_month_cash_flow.net_cash_flow)}
          </div>
        </div>

        <div className="stat-card">
          <h3>Monthly Income</h3>
          <div className="stat-value stat-positive">
            {formatCurrency(current_month_cash_flow.total_income)}
          </div>
        </div>

        <div className="stat-card">
          <h3>Monthly Expenses</h3>
          <div className="stat-value stat-negative">
            {formatCurrency(current_month_cash_flow.total_expenses)}
          </div>
        </div>
      </div>

      {/* Income vs Expenses Trend */}
      <div className="card">
        <h2>Income vs Expenses Trend (6 Months)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
            <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
            <Line type="monotone" dataKey="net" stroke="#667eea" strokeWidth={2} name="Net" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Spending by Category */}
      {current_month_spending.categories && current_month_spending.categories.length > 0 && (
        <div className="card">
          <h2>Spending by Category (This Month)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={current_month_spending.categories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category} (${percentage.toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {current_month_spending.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={current_month_spending.categories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="amount" fill="#667eea" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="card">
        <h2>Quick Stats</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
          <div>
            <p style={{ color: '#666', marginBottom: '0.5rem' }}>Active Accounts</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '600' }}>{summary.account_count}</p>
          </div>
          <div>
            <p style={{ color: '#666', marginBottom: '0.5rem' }}>Transactions This Month</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '600' }}>{summary.current_month_transaction_count}</p>
          </div>
          <div>
            <p style={{ color: '#666', marginBottom: '0.5rem' }}>Total Spending This Month</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '600', color: '#ef4444' }}>
              {formatCurrency(current_month_spending.total_spending)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
