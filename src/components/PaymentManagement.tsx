import React from 'react';
import { 
  CreditCard, 
  Search, 
  Plus, 
  ArrowDownCircle, 
  ArrowUpCircle,
  Receipt,
  Filter,
  CheckCircle2,
  X,
  TrendingUp
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function PaymentManagement() {
  const [loans, setLoans] = React.useState<any[]>([]);
  const [selectedLoan, setSelectedLoan] = React.useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
  const [paymentMode, setPaymentMode] = React.useState('Cash');
  const [transactionId, setTransactionId] = React.useState('');
  const [isDuplicateTx, setIsDuplicateTx] = React.useState(false);

  React.useEffect(() => {
    fetch('/api/loans')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch loans');
        return res.json();
      })
      .then(setLoans)
      .catch(err => console.error('Error fetching loans:', err));
  }, []);

  const checkDuplicateTransaction = async (txId: string) => {
    if (!txId) {
      setIsDuplicateTx(false);
      return;
    }
    try {
      const res = await fetch(`/api/payments/check-transaction/${txId}`);
      if (!res.ok) throw new Error('Failed to check transaction');
      const data = await res.json();
      if (data.exists) {
        setIsDuplicateTx(true);
        alert('Duplicate Transaction ID detected! Please verify.');
      } else {
        setIsDuplicateTx(false);
      }
    } catch (err) {
      console.error('Error checking transaction:', err);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-dark">Payment Management</h1>
          <p className="text-gray-500 mt-1">Record collections and settlements</p>
        </div>
        <button 
          onClick={() => {
            setIsPaymentModalOpen(true);
            setPaymentMode('Cash');
            setTransactionId('');
            setIsDuplicateTx(false);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          New Payment Entry
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Payments List */}
        <div className="lg:col-span-2 card">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-lg">Transaction History</h3>
            <button className="text-sm text-primary font-medium hover:underline">View All</button>
          </div>
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <ArrowDownCircle size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Interest Payment - LN-123456</p>
                    <p className="text-xs text-gray-500">05 Mar 2026 • Cash</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">+ ₹1,250</p>
                  <p className="text-[10px] text-gray-400">Ref: PAY-789</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <div className="card p-6 bg-primary text-white">
            <p className="text-xs font-medium text-white/70 uppercase tracking-wider">Today's Collection</p>
            <h4 className="text-3xl font-bold mt-1">₹12,450</h4>
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-300">
              <TrendingUp size={14} />
              <span>15% increase from yesterday</span>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-lg mb-4">Payment Modes</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  Cash
                </div>
                <span className="font-bold text-sm">₹8,500</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  UPI / QR
                </div>
                <span className="font-bold text-sm">₹3,950</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  Bank Transfer
                </div>
                <span className="font-bold text-sm">₹0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 w-full max-w-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Record Payment</h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <form className="space-y-6" onSubmit={async (e) => {
              e.preventDefault();
              if (isDuplicateTx) {
                alert('Cannot submit with duplicate Transaction ID');
                return;
              }
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              try {
                const res = await fetch('/api/payments', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data)
                });
                if (res.ok) {
                  setIsPaymentModalOpen(false);
                  window.location.reload();
                } else {
                  const errData = await res.json();
                  alert(errData.error || 'Failed to record payment');
                }
              } catch (err) {
                console.error('Error recording payment:', err);
                alert('Network error while recording payment');
              }
            }}>
              <div className="space-y-1">
                <label className="text-sm font-medium">Select Loan</label>
                <select name="loan_id" required className="input-field">
                  <option value="">Choose loan...</option>
                  {loans.map(l => (
                    <option key={l.id} value={l.id}>{l.loan_number} - {l.customer_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Amount Received (₹)</label>
                  <input name="amount" type="number" required className="input-field" placeholder="0.00" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Payment Date</label>
                  <input name="date" type="date" required className="input-field" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Payment Mode</label>
                  <select 
                    name="mode" 
                    className="input-field"
                    value={paymentMode}
                    onChange={(e) => {
                      setPaymentMode(e.target.value);
                      if (e.target.value === 'Cash') {
                        setTransactionId('');
                        setIsDuplicateTx(false);
                      }
                    }}
                  >
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Bank Transfer</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Payment Type</label>
                  <select name="type" className="input-field">
                    <option value="interest">Interest Only</option>
                    <option value="part_principal">Part Principal</option>
                    <option value="full_settlement">Full Settlement</option>
                    <option value="penalty">Penalty Only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className={cn(
                  "text-sm font-medium transition-opacity",
                  paymentMode === 'Cash' ? "opacity-50" : "opacity-100"
                )}>
                  Transaction ID (for UPI/Bank)
                </label>
                <input 
                  name="transaction_id" 
                  className={cn(
                    "input-field transition-all",
                    paymentMode === 'Cash' ? "bg-gray-100 cursor-not-allowed opacity-50 grayscale" : "bg-white",
                    isDuplicateTx ? "border-rose-500 ring-rose-500" : ""
                  )} 
                  placeholder={paymentMode === 'Cash' ? "N/A for Cash" : "Enter Transaction ID"}
                  disabled={paymentMode === 'Cash'}
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  onBlur={(e) => checkDuplicateTransaction(e.target.value)}
                />
                {isDuplicateTx && <p className="text-[10px] text-rose-500 font-bold">This Transaction ID already exists!</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Remarks</label>
                <input name="remarks" className="input-field" placeholder="Optional notes" />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isDuplicateTx}
                  className="btn-primary px-8 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 size={18} />
                  Confirm Payment
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
