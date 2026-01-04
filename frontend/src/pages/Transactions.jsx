import React, { useState, useEffect } from 'react'
import { getTransactions, createTransaction, deleteTransaction, getAccounts, getCategories } from '../services/api'
import { format } from 'date-fns'

function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filters, setFilters] = useState({
    account_id: '',
    category: '',
    transaction_type: ''
  })
  const [formData, setFormData] = useState({
    account_id: '',
    transaction_type: 'expense',
    amount: 0,
    category: '',
    merchant: '',
    description: '',
    tags: '',
    transaction_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    try {
      setLoading(true)
      const [txnRes, accRes, catRes] = await Promise.all([
        getTransactions(filters),
        getAccounts(),
        getCategories()
      ])
      setTransactions(txnRes.data)
      setAccounts(accRes.data)
      setCategories(catRes.data)
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
        amount: parseFloat(formData.amount),
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        transaction_date: new Date(formData.transaction_date).toISOString()
      }
      await createTransaction(submitData)
      setShowModal(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Error creating transaction:', error)
      alert('Failed to create transaction')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id)
        loadData()
      } catch (error) {
        console.error('Error deleting transaction:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      account_id: '',
      transaction_type: 'expense',
      amount: 0,
      category: '',
      merchant: '',
      description: '',
      tags: '',
      transaction_date: new Date().toISOString().split('T')[0]
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getTotalIncome = () => {
    return transactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const getTotalExpenses = () => {
    return transactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  }

  if (loading) {
    return <div className="loading">Loading transactions...</div>
  }

  return (
    <div>
      <div className="flex-between mb-2">
        <h1>Transactions</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Transaction
        </button>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <h3>Total Income</h3>
          <div className="stat-value stat-positive">{formatCurrency(getTotalIncome())}</div>
        </div>
        <div className="stat-card">
          <h3>Total Expenses</h3>
          <div className="stat-value stat-negative">{formatCurrency(getTotalExpenses())}</div>
        </div>
        <div className="stat-card">
          <h3>Net</h3>
          <div className={`stat-value ${getTotalIncome() - getTotalExpenses() >= 0 ? 'stat-positive' : 'stat-negative'}`}>
            {formatCurrency(getTotalIncome() - getTotalExpenses())}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <h3>Filters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
          <div className="form-group">
            <label>Account</label>
            <select
              value={filters.account_id}
              onChange={(e) => setFilters({ ...filters, account_id: e.target.value })}
            >
              <option value="">All Accounts</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Type</label>
            <select
              value={filters.transaction_type}
              onChange={(e) => setFilters({ ...filters, transaction_type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Account</th>
              <th>Type</th>
              <th>Category</th>
              <th>Merchant</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.id}>
                <td>{format(new Date(txn.transaction_date), 'MMM dd, yyyy')}</td>
                <td>{accounts.find(a => a.id === txn.account_id)?.name || '-'}</td>
                <td style={{ textTransform: 'capitalize' }}>{txn.transaction_type}</td>
                <td>{txn.category || '-'}</td>
                <td>{txn.merchant || '-'}</td>
                <td className={txn.transaction_type === 'income' ? 'stat-positive' : 'stat-negative'}>
                  {txn.transaction_type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                </td>
                <td>
                  <button className="btn btn-danger" onClick={() => handleDelete(txn.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No transactions found. Click "Add Transaction" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add Transaction</h2>
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
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Type *</label>
                <select
                  value={formData.transaction_type}
                  onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                  required
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  list="categories"
                />
                <datalist id="categories">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div className="form-group">
                <label>Merchant</label>
                <input
                  type="text"
                  value={formData.merchant}
                  onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="food, groceries, essential"
                />
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  required
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

export default Transactions
