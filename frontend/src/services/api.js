import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Accounts
export const getAccounts = () => api.get('/accounts')
export const getAccount = (id) => api.get(`/accounts/${id}`)
export const createAccount = (data) => api.post('/accounts', data)
export const updateAccount = (id, data) => api.put(`/accounts/${id}`, data)
export const deleteAccount = (id) => api.delete(`/accounts/${id}`)

// Transactions
export const getTransactions = (params) => api.get('/transactions', { params })
export const getTransaction = (id) => api.get(`/transactions/${id}`)
export const createTransaction = (data) => api.post('/transactions', data)
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data)
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`)
export const getCategories = () => api.get('/transactions/categories/list')

// Budgets
export const getBudgets = () => api.get('/budgets')
export const getBudget = (id) => api.get(`/budgets/${id}`)
export const createBudget = (data) => api.post('/budgets', data)
export const updateBudget = (id, data) => api.put(`/budgets/${id}`, data)
export const deleteBudget = (id) => api.delete(`/budgets/${id}`)

// Investments
export const getInvestments = (params) => api.get('/investments', { params })
export const getInvestment = (id) => api.get(`/investments/${id}`)
export const createInvestment = (data) => api.post('/investments', data)
export const updateInvestment = (id, data) => api.put(`/investments/${id}`, data)
export const deleteInvestment = (id) => api.delete(`/investments/${id}`)
export const refreshInvestmentPrice = (id) => api.post(`/investments/${id}/refresh-price`)
export const getPortfolioSummary = () => api.get('/investments/portfolio/summary')

// Analytics
export const getNetWorth = () => api.get('/analytics/net-worth')
export const getCashFlow = (params) => api.get('/analytics/cash-flow', { params })
export const getSpendingByCategory = (params) => api.get('/analytics/spending-by-category', { params })
export const getIncomeVsExpensesTrend = (params) => api.get('/analytics/income-vs-expenses-trend', { params })
export const getAccountBalances = () => api.get('/analytics/account-balances')
export const getDashboardSummary = () => api.get('/analytics/dashboard-summary')

export default api
