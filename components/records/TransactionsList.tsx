'use client'

import { useState } from 'react'
import { Link } from '@/i18n/routing'
import { 
  ArrowLeft, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  Receipt, 
  Calendar, 
  Sprout, 
  FileText,
  Filter,
  Eye,
  X
} from 'lucide-react'
import { TransactionItem } from '@/app/actions/records'

interface TransactionsListProps {
  transactions: TransactionItem[]
}

export default function TransactionsList({ transactions }: TransactionsListProps) {
  const [filter, setFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL')
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)

  const filtered = transactions.filter((t) => {
    if (filter === 'IN') return t.direction === 'IN'
    if (filter === 'OUT') return t.direction === 'OUT'
    return true
  })

  // Calculate totals
  const totalIn = transactions
    .filter((t) => t.direction === 'IN')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  const totalOut = transactions
    .filter((t) => t.direction === 'OUT')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  const net = totalIn - totalOut

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/records" className="p-2 hover:bg-emerald-50 rounded-xl border border-emerald-100 transition text-emerald-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-emerald-950">Past Transactions</h1>
            <p className="text-emerald-700 text-sm mt-0.5">Comprehensive financial ledger for your farm.</p>
          </div>
        </div>

        <Link
          href="/records/transaction"
          className="bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Record Transaction
        </Link>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Money In */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block mb-1">
              Total Money In (Revenue)
            </span>
            <span className="text-2xl font-extrabold text-emerald-700">
              + ₹{totalIn.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Total Money Out */}
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block mb-1">
              Total Money Out (Expenses)
            </span>
            <span className="text-2xl font-extrabold text-rose-600">
              - ₹{totalOut.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Net Profit / Balance */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
              Net Farm Cash Flow
            </span>
            <span className={`text-2xl font-extrabold ${net >= 0 ? 'text-emerald-900' : 'text-rose-700'}`}>
              {net >= 0 ? `+ ₹${net.toLocaleString('en-IN')}` : `- ₹${Math.abs(net).toLocaleString('en-IN')}`}
            </span>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${net >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 mr-1" />
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === 'ALL'
                ? 'bg-emerald-800 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            onClick={() => setFilter('IN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === 'IN'
                ? 'bg-emerald-700 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Income Only
          </button>
          <button
            onClick={() => setFilter('OUT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === 'OUT'
                ? 'bg-rose-700 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Expenses Only
          </button>
        </div>

        <span className="text-xs text-gray-400">
          Showing {filtered.length} entries
        </span>
      </div>

      {/* Transactions Table / List */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Transactions Found</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              {filter !== 'ALL'
                ? 'No transactions found matching this filter.'
                : 'You have not recorded any income or expenses yet.'}
            </p>
            <Link
              href="/records/transaction"
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm transition text-sm"
            >
              <Plus className="w-4 h-4" />
              Record First Transaction
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((tx) => (
              <div
                key={tx.id}
                className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-emerald-50/20 transition"
              >
                {/* Left info */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      tx.direction === 'IN'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {tx.direction === 'IN' ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-gray-950 text-base">
                        {tx.category}
                      </h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          tx.direction === 'IN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tx.direction === 'IN' ? 'Income' : 'Expense'}
                      </span>
                      {tx.source === 'ocr' && (
                        <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-orange-200">
                          <Receipt className="w-3 h-3" />
                          OCR Verified
                        </span>
                      )}
                    </div>

                    {tx.description && (
                      <p className="text-gray-600 text-sm mt-1">{tx.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {tx.transaction_date}
                      </span>
                      {tx.related_crop_name && (
                        <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
                          <Sprout className="w-3.5 h-3.5" />
                          {tx.related_crop_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right amount and receipt link */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center pl-14 md:pl-0">
                  <span
                    className={`text-xl font-extrabold ${
                      tx.direction === 'IN' ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {tx.direction === 'IN' ? '+' : '-'} ₹{Number(tx.amount).toLocaleString('en-IN')}
                  </span>

                  {tx.receipt_image_url && (
                    <button
                      type="button"
                      onClick={() => setSelectedReceipt(tx.receipt_image_url || null)}
                      className="text-xs text-orange-700 hover:text-orange-900 font-semibold flex items-center gap-1 mt-1 underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Receipt
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receipt Image Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                Scanned Receipt Attachment
              </h4>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 hover:bg-gray-200 rounded-lg text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-[75vh] overflow-auto flex items-center justify-center bg-gray-900/5">
              <img src={selectedReceipt} alt="Receipt preview" className="max-w-full rounded-xl object-contain shadow-sm" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
