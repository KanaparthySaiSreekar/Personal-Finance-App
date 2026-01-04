import React, { useState, useEffect } from 'react'
import { getInvestments, createInvestment, deleteInvestment, getPortfolioSummary, getAccounts, refreshInvestmentPrice } from '../services/api'

function Investments() {
  const [investments, setInvestments] = useState([])
  const [accounts, setAccounts] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    account_id: '',
    symbol: '',
    name: '',
    asset_type: 'stock',
    exchange: 'US',
    quantity: 0,
    purchase_price: 0,
    currency: 'USD',
    purchase_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [invRes, accRes, summaryRes] = await Promise.all([
        getInvestments(),
        getAccounts(),
        getPortfolioSummary()
      ])
      setInvestments(invRes.data)
      setAccounts(accRes.data)
      setSummary(summaryRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        account_id: parseInt(formData.account_id),
        quantity: parseFloat(formData.quantity),
        purchase_price: parseFloat(formData.purchase_price),
        symbol: formData.symbol.toUpperCase(),
        purchase_date: new Date(formData.purchase_date).toISOString()
      }
      await createInvestment(submitData)
      setShowModal(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Error creating investment:', error)
      alert('Failed to create investment')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this investment?')) {
      try {
        await deleteInvestment(id)
        loadData()
      } catch (error) {
        console.error('Error deleting investment:', error)
      }
    }
  }

  const handleRefreshPrice = async (id) => {
    try {
      await refreshInvestmentPrice(id)
      loadData()
    } catch (error) {
      console.error('Error refreshing price:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      account_id: '',
      symbol: '',
      name: '',
      asset_type: 'stock',
      exchange: 'US',
      quantity: 0,
      purchase_price: 0,
      currency: 'USD',
      purchase_date: new Date().toISOString().split('T')[0]
    })
  }

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  if (loading) {
    return <div className="loading">Loading investments...</div>
  }

  return (
    <div>
      <div className="flex-between mb-2">
        <h1>Investment Portfolio</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Investment
        </button>
      </div>

      {/* Portfolio Summary */}
      {summary && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card">
            <h3>Total Value</h3>
            <div className="stat-value stat-positive">
              {formatCurrency(summary.total_value)}
            </div>
          </div>
          <div className="stat-card">
            <h3>Total Cost</h3>
            <div className="stat-value">
              {formatCurrency(summary.total_cost)}
            </div>
          </div>
          <div className="stat-card">
            <h3>Gain/Loss</h3>
            <div className={`stat-value ${summary.total_gain_loss >= 0 ? 'stat-positive' : 'stat-negative'}`}>
              {summary.total_gain_loss >= 0 ? '+' : ''}{formatCurrency(summary.total_gain_loss)}
            </div>
          </div>
          <div className="stat-card">
            <h3>Return</h3>
            <div className={`stat-value ${summary.total_gain_loss_percentage >= 0 ? 'stat-positive' : 'stat-negative'}`}>
              {summary.total_gain_loss_percentage >= 0 ? '+' : ''}{summary.total_gain_loss_percentage.toFixed(2)}%
            </div>
          </div>
        </div>
      )}

      {/* Holdings Table */}
      <div className="card">
        <h2>Holdings</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Name</th>
              <th>Type</th>
              <th>Exchange</th>
              <th>Quantity</th>
              <th>Purchase Price</th>
              <th>Current Price</th>
              <th>Total Value</th>
              <th>Gain/Loss</th>
              <th>Return %</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {investments.map((inv) => (
              <tr key={inv.id}>
                <td style={{ fontWeight: '600' }}>{inv.symbol}</td>
                <td>{inv.name || '-'}</td>
                <td style={{ textTransform: 'capitalize' }}>
                  {inv.asset_type.replace('_', ' ')}
                </td>
                <td>{inv.exchange}</td>
                <td>{inv.quantity}</td>
                <td>{formatCurrency(inv.purchase_price, inv.currency)}</td>
                <td>{formatCurrency(inv.current_price, inv.currency)}</td>
                <td>{formatCurrency(inv.current_value, inv.currency)}</td>
                <td className={inv.gain_loss >= 0 ? 'stat-positive' : 'stat-negative'}>
                  {inv.gain_loss >= 0 ? '+' : ''}{formatCurrency(inv.gain_loss, inv.currency)}
                </td>
                <td className={inv.gain_loss_percentage >= 0 ? 'stat-positive' : 'stat-negative'}>
                  {inv.gain_loss_percentage >= 0 ? '+' : ''}{inv.gain_loss_percentage.toFixed(2)}%
                </td>
                <td>
                  <div className="flex gap-1">
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleRefreshPrice(inv.id)}
                      title="Refresh price"
                    >
                      ↻
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(inv.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {investments.length === 0 && (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No investments found. Click "Add Investment" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Investment Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add Investment</h2>
              <button className="close-btn" onClick={() => {
                setShowModal(false)
                resetForm()
              }}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Account *</label>
                <select
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                  required
                >
                  <option value="">Select Account</option>
                  {accounts.filter(a => a.account_type === 'investment').map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Symbol *</label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  placeholder="e.g., AAPL, RELIANCE, etc."
                  required
                />
              </div>

              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Apple Inc."
                />
              </div>

              <div className="form-group">
                <label>Asset Type *</label>
                <select
                  value={formData.asset_type}
                  onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                  required
                >
                  <option value="stock">Stock</option>
                  <option value="etf">ETF</option>
                  <option value="mutual_fund">Mutual Fund</option>
                  <option value="crypto">Cryptocurrency</option>
                </select>
              </div>

              <div className="form-group">
                <label>Exchange *</label>
                <select
                  value={formData.exchange}
                  onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
                  required
                >
                  <option value="US">US (NYSE/NASDAQ)</option>
                  <option value="NSE">India - NSE</option>
                  <option value="BSE">India - BSE</option>
                </select>
              </div>

              <div className="form-group">
                <label>Quantity *</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Purchase Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              <div className="form-group">
                <label>Purchase Date</label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">Create</button>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Investments
