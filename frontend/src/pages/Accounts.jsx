import React, { useState, useEffect } from 'react'
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../services/api'

function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    account_type: 'checking',
    balance: 0,
    currency: 'USD',
    institution: '',
    account_number: '',
    notes: ''
  })

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const response = await getAccounts()
      setAccounts(response.data)
    } catch (error) {
      console.error('Error loading accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, formData)
      } else {
        await createAccount(formData)
      }
      setShowModal(false)
      setEditingAccount(null)
      resetForm()
      loadAccounts()
    } catch (error) {
      console.error('Error saving account:', error)
    }
  }

  const handleEdit = (account) => {
    setEditingAccount(account)
    setFormData({
      name: account.name,
      account_type: account.account_type,
      balance: account.balance,
      currency: account.currency,
      institution: account.institution || '',
      account_number: account.account_number || '',
      notes: account.notes || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        await deleteAccount(id)
        loadAccounts()
      } catch (error) {
        console.error('Error deleting account:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      account_type: 'checking',
      balance: 0,
      currency: 'USD',
      institution: '',
      account_number: '',
      notes: ''
    })
  }

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const getTotalBalance = () => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0)
  }

  if (loading) {
    return <div className="loading">Loading accounts...</div>
  }

  return (
    <div>
      <div className="flex-between mb-2">
        <h1>Accounts</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Account
        </button>
      </div>

      <div className="card">
        <h3>Total Balance: {formatCurrency(getTotalBalance())}</h3>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Balance</th>
              <th>Institution</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td>{account.name}</td>
                <td style={{ textTransform: 'capitalize' }}>
                  {account.account_type.replace('_', ' ')}
                </td>
                <td className={account.balance >= 0 ? 'stat-positive' : 'stat-negative'}>
                  {formatCurrency(account.balance, account.currency)}
                </td>
                <td>{account.institution || '-'}</td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn btn-secondary" onClick={() => handleEdit(account)}>
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(account.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No accounts found. Click "Add Account" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingAccount ? 'Edit Account' : 'Add Account'}</h2>
              <button className="close-btn" onClick={() => {
                setShowModal(false)
                setEditingAccount(null)
                resetForm()
              }}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Account Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Account Type *</label>
                <select
                  value={formData.account_type}
                  onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                  required
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="investment">Investment</option>
                  <option value="crypto">Crypto</option>
                  <option value="loan">Loan</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Balance *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) })}
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
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                </select>
              </div>

              <div className="form-group">
                <label>Institution</label>
                <input
                  type="text"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">
                  {editingAccount ? 'Update' : 'Create'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowModal(false)
                  setEditingAccount(null)
                  resetForm()
                }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Accounts
