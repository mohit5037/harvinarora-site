import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { getAuthState } from '../auth'
import { useNavigate } from 'react-router-dom'
import { supabase, type ExpenseRow, type ExtraBudgetRow } from '../supabaseClient'

// Starting date for the budget tracker (Jan 22, 2026)
const START_DATE = new Date('2026-01-22T00:00:00')
const DAILY_BUDGET = 7500

export default function Expenses() {
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = useState(false)
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [extraBudgets, setExtraBudgets] = useState<ExtraBudgetRow[]>([])
  const [amount, setAmount] = useState('')
  const [name, setName] = useState('')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [budgetNote, setBudgetNote] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmittingBudget, setIsSubmittingBudget] = useState(false)

  useEffect(() => {
    getAuthState().then(s => {
      if (!s.isAdmin) {
        navigate('/login')
        return
      }
      setIsAdmin(true)
      refresh()
    })
  }, [navigate])

  function refresh() {
    supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching expenses:', error)
          return
        }
        setExpenses((data as ExpenseRow[]) || [])
      })
    
    supabase
      .from('extra_budgets')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching extra budgets:', error)
          return
        }
        setExtraBudgets((data as ExtraBudgetRow[]) || [])
      })
  }

  // Calculate daily budget based on days since start
  function calculateDailyBudget(): number {
    const now = new Date()
    const diffTime = now.getTime() - START_DATE.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include today
    return Math.max(0, diffDays * DAILY_BUDGET)
  }

  // Calculate total extra budget added
  function calculateExtraBudget(): number {
    return extraBudgets.reduce((sum, b) => sum + Number(b.amount), 0)
  }

  // Calculate total budget (daily + extra)
  function calculateTotalBudget(): number {
    return calculateDailyBudget() + calculateExtraBudget()
  }

  // Calculate total spent
  function calculateTotalSpent(): number {
    return expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
  }

  // Calculate balance
  function calculateBalance(): number {
    return calculateTotalBudget() - calculateTotalSpent()
  }

  // Get days count
  function getDaysCount(): number {
    const now = new Date()
    const diffTime = now.getTime() - START_DATE.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  async function onAddExpense(e: FormEvent) {
    e.preventDefault()
    
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setMessage('Please enter a valid amount')
      return
    }
    if (!name.trim()) {
      setMessage('Please enter an expense name')
      return
    }

    setIsSubmitting(true)
    const { error } = await supabase.from('expenses').insert({
      amount: parsedAmount,
      name: name.trim(),
    })

    if (error) {
      setMessage('Failed to add expense: ' + error.message)
    } else {
      setMessage('Expense added successfully!')
      setAmount('')
      setName('')
      refresh()
    }
    setIsSubmitting(false)
  }

  async function onDeleteExpense(id: string) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) {
      setMessage('Failed to delete expense')
    } else {
      refresh()
    }
  }

  async function onAddBudget(e: FormEvent) {
    e.preventDefault()
    
    const parsedAmount = parseFloat(budgetAmount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setMessage('Please enter a valid budget amount')
      return
    }

    setIsSubmittingBudget(true)
    const { error } = await supabase.from('extra_budgets').insert({
      amount: parsedAmount,
      note: budgetNote.trim() || null,
    })

    if (error) {
      setMessage('Failed to add budget: ' + error.message)
    } else {
      setMessage('Extra budget added successfully!')
      setBudgetAmount('')
      setBudgetNote('')
      refresh()
    }
    setIsSubmittingBudget(false)
  }

  async function onDeleteBudget(id: string) {
    const { error } = await supabase.from('extra_budgets').delete().eq('id', id)
    if (error) {
      setMessage('Failed to delete budget entry')
    } else {
      refresh()
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  if (!isAdmin) return null

  const balance = calculateBalance()
  const dailyBudget = calculateDailyBudget()
  const extraBudget = calculateExtraBudget()
  const totalBudget = calculateTotalBudget()
  const totalSpent = calculateTotalSpent()
  const daysCount = getDaysCount()

  return (
    <section className="expenses-page">
      <h2 className="text-2xl font-bold mb-6">Expenses Tracker</h2>
      
      {message && (
        <div className="expenses-message mb-4 text-sm text-slate-700 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2">
          {message}
          <button 
            onClick={() => setMessage(null)} 
            className="ml-2 text-slate-500 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Balance Card */}
      <div className="expenses-balance-card rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm mb-6">
        <div className="text-sm text-slate-600 mb-1">Available Balance</div>
        <div className={`text-4xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {formatCurrency(balance)}
        </div>
        <div className="expenses-balance-details mt-4 grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
          <div className="expenses-balance-item">
            <div className="text-slate-500">Days</div>
            <div className="font-semibold text-slate-800">{daysCount}</div>
          </div>
          <div className="expenses-balance-item">
            <div className="text-slate-500">Daily Budget</div>
            <div className="font-semibold text-slate-800">{formatCurrency(dailyBudget)}</div>
          </div>
          <div className="expenses-balance-item">
            <div className="text-slate-500">Extra Budget</div>
            <div className="font-semibold text-emerald-600">{formatCurrency(extraBudget)}</div>
          </div>
          <div className="expenses-balance-item">
            <div className="text-slate-500">Total Budget</div>
            <div className="font-semibold text-slate-800">{formatCurrency(totalBudget)}</div>
          </div>
          <div className="expenses-balance-item">
            <div className="text-slate-500">Total Spent</div>
            <div className="font-semibold text-slate-800">{formatCurrency(totalSpent)}</div>
          </div>
        </div>
        <div className="expenses-budget-note mt-3 text-xs text-slate-500">
          Daily: {formatCurrency(DAILY_BUDGET)}/day since {START_DATE.toLocaleDateString('en-IN')}
        </div>
      </div>

      {/* Forms Row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Add Extra Budget Form */}
        <form onSubmit={onAddBudget} className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 sm:p-6 shadow-sm">
          <h3 className="font-semibold mb-4 text-emerald-800">Add Extra Budget</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <input
              type="number"
              step="1"
              min="0"
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Amount (₹)"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
            />
            <input
              type="text"
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400"
              placeholder="Note (optional)"
              value={budgetNote}
              onChange={(e) => setBudgetNote(e.target.value)}
            />
            <button 
              type="submit"
              disabled={isSubmittingBudget}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingBudget ? 'Adding...' : 'Add Budget'}
            </button>
          </div>
        </form>

        {/* Add Expense Form */}
        <form onSubmit={onAddExpense} className="expenses-form rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Add Expense</h3>
          <div className="expenses-form-fields grid sm:grid-cols-3 gap-3">
            <input
              type="number"
              step="0.01"
              min="0"
              className="expenses-input-amount rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="Amount (₹)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <input
              type="text"
              className="expenses-input-name rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="Expense Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button 
              type="submit"
              disabled={isSubmitting}
              className="expenses-submit-btn px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>

      {/* Extra Budgets List */}
      {extraBudgets.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 sm:p-6 shadow-sm mb-6">
          <h3 className="font-semibold mb-4 text-emerald-800">Extra Budget History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-emerald-200">
                  <th className="py-3 pr-4">Date & Time</th>
                  <th className="py-3 pr-4">Note</th>
                  <th className="py-3 pr-4 text-right">Amount</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {extraBudgets.map((budget) => (
                  <tr key={budget.id} className="border-t border-emerald-100 hover:bg-emerald-50">
                    <td className="py-3 pr-4 text-slate-600">
                      {formatDate(budget.created_at)}
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-800">
                      {budget.note || '-'}
                    </td>
                    <td className="py-3 pr-4 text-right font-semibold text-emerald-600">
                      +{formatCurrency(Number(budget.amount))}
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => onDeleteBudget(budget.id)}
                        className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="expenses-list rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Expense History</h3>
        {expenses.length === 0 ? (
          <div className="text-sm text-slate-500">No expenses recorded yet</div>
        ) : (
          <div className="expenses-table-container overflow-x-auto">
            <table className="expenses-table min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-3 pr-4">Date & Time</th>
                  <th className="py-3 pr-4">Expense</th>
                  <th className="py-3 pr-4 text-right">Amount</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="expenses-row border-t border-slate-100 hover:bg-slate-50">
                    <td className="py-3 pr-4 text-slate-600">
                      {formatDate(expense.created_at)}
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-800">
                      {expense.name}
                    </td>
                    <td className="py-3 pr-4 text-right font-semibold text-red-600">
                      -{formatCurrency(Number(expense.amount))}
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(expense.id)}
                        className="expenses-delete-btn text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
