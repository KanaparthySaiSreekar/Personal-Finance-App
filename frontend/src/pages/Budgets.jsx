import React, { useState, useEffect } from 'react'
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../services/api'

function Budgets() {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [formData, setFormData] = useState({
    category: '',
    amount: 0,
    period: 'monthly'
  })

  useEffect(() => {
    loadBudgets()
  }, [])

  const loadBudgets = async () => {
    try {
      setLoading(true)
      const response = await getBudgets()
      setBudgets(response.data)
    } catch (error) {
      console.error('Error loading budgets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount)
      }

      if (editingBudget) {
        await updateBudget(editingBudget.id, submitData)
      } else {
        await createBudget(submitData)
      }
      setShowModal(false)
      setEditingBudget(null)
      resetForm()
      loadBudgets()
    } catch (error) {
      console.error('Error saving budget:', error)
      alert('Failed to save budget')
    }
  }

  const handleEdit = (budget) => {
    setEditingBudget(budget)
    setFormData({
      category: budget.category,
      amount: budget.amount,
      period: budget.period
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await deleteBudget(id)
        loadBudgets()
      } catch (error) {
        console.error('Error deleting budget:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      category: '',
      amount: 0,
      period: 'monthly'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return '#ef4444'
    if (percentage >= 80) return '#f59e0b'
    return '#10b981'
  }

  if (loading) {
    return <div className="loading">Loading budgets...</div>
  }

  return (
    <div>
      <div className="flex-between mb-2">
        <h1>Budgets</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Budget
        </button>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {budgets.map((budget) => (
          <div key={budget.id} className="card">
            <div className="flex-between mb-2">
              <h3>{budget.category}</h3>
              <div className="flex gap-1">
                <button className="btn btn-secondary" onClick={() => handleEdit(budget)}>
                  Edit
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(budget.id)}>
                  Delete
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Spent: {formatCurrency(budget.spent)}</span>
                <span>Budget: {formatCurrency(budget.amount)}</span>
              </div>
              <div style={{
                width: '100%',
                height: '20px',
                backgroundColor: '#e5e7eb',
                borderRadius: '10px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(budget.percentage_used, 100)}%`,
                  height: '100%',
                  backgroundColor: getProgressColor(budget.percentage_used),
                  transition: 'width 0.3s'
                }} />
              </div>
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>
                  Remaining: {formatCurrency(budget.remaining)}
                </span>
                <span style={{
                  fontWeight: '600',
                  color: getProgressColor(budget.percentage_used)
                }}>
                  {budget.percentage_used.toFixed(1)}%
                </span>
              </div>
            </div>

            <div style={{
              fontSize: '0.9rem',
              color: '#666',
              textTransform: 'capitalize'
            }}>
              Period: {budget.period}
            </div>
          </div>
        ))}

        {budgets.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            No budgets found. Click "Add Budget" to create one.
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingBudget ? 'Edit Budget' : 'Add Budget'}</h2>
              <button className="close-btn" onClick={() => {
                setShowModal(false)
                setEditingBudget(null)
                resetForm()
              }}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category *</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Groceries, Entertainment, Transportation"
                  required
                  disabled={!!editingBudget}
                />
                {editingBudget && (
                  <small style={{ color: '#666' }}>Category cannot be changed when editing</small>
                )}
              </div>

              <div className="form-group">
                <label>Budget Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Period *</label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">
                  {editingBudget ? 'Update' : 'Create'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowModal(false)
                  setEditingBudget(null)
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

export default Budgets
