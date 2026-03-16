import React from 'react';
import { 
  Plus, 
  Search, 
  Gem, 
  HandCoins, 
  Calendar, 
  ArrowRight,
  ChevronRight,
  Info,
  Calculator,
  TrendingUp,
  X,
  Printer,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { exportToPDF, printTable } from '../lib/exportUtils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function LoanManagement() {
  const [loans, setLoans] = React.useState<any[]>([]);
  const [selectedLoanDetail, setSelectedLoanDetail] = React.useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = React.useState(false);
  const [selectedLoan, setSelectedLoan] = React.useState<any>(null);
  const [topUpAmount, setTopUpAmount] = React.useState('');
  const [topUpDate, setTopUpDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [topUpRemarks, setTopUpRemarks] = React.useState('');
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [items, setItems] = React.useState<any[]>([
    { type: 'Gold Ornament', purity: '22K', gross_weight: 10.5, net_weight: 10.2, wastage: 0, market_rate: 6500, valuation: 66300, packet_number: 'PKT-001', locker_location: 'Locker A-1', photos: [] }
  ]);

  const fetchLoans = () => {
    fetch('/api/loans').then(res => res.json()).then(setLoans);
  };

  React.useEffect(() => {
    fetchLoans();
    fetch('/api/customers').then(res => res.json()).then(setCustomers);
  }, []);

  const handleApproveClosure = async (loanId: number, approve: boolean) => {
    if (!confirm(`Are you sure you want to ${approve ? 'approve' : 'reject'} this closure request?`)) return;
    
    try {
      const res = await fetch('/api/admin/approve-closure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId, approve })
      });
      if (res.ok) {
        setSelectedLoanDetail(null);
        fetchLoans();
      }
    } catch (error) {
      console.error('Error approving closure:', error);
    }
  };

  const addItem = () => {
    setItems([...items, { type: 'Gold Ornament', purity: '22K', gross_weight: 0, net_weight: 0, wastage: 0, market_rate: 0, valuation: 0, packet_number: '', locker_location: '', photos: [] }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-calculate valuation if weights or rates change
    if (field === 'net_weight' || field === 'market_rate') {
      newItems[index].valuation = Number(newItems[index].net_weight) * Number(newItems[index].market_rate);
    }
    
    setItems(newItems);
  };

  const handlePrintLoans = () => {
    const headers = ['Loan #', 'Customer', 'Amount', 'Rate', 'Maturity', 'Status'];
    const data = loans.map(l => [
      l.loan_number,
      l.customer_name,
      `₹${l.amount.toLocaleString()}`,
      `${l.interest_rate}%`,
      format(new Date(l.maturity_date), 'dd MMM yyyy'),
      l.status
    ]);
    printTable('Active Loans List', headers, data);
  };

  const handleDownloadLoans = () => {
    const headers = ['Loan #', 'Customer', 'Amount', 'Rate', 'Maturity', 'Status'];
    const data = loans.map(l => [
      l.loan_number,
      l.customer_name,
      `₹${l.amount.toLocaleString()}`,
      `${l.interest_rate}%`,
      format(new Date(l.maturity_date), 'dd MMM yyyy'),
      l.status
    ]);
    exportToPDF('Active Loans List', headers, data, 'Active_Loans_List');
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-dark">Loan Management</h1>
          <p className="text-gray-500 mt-1">Create and manage Girvi loans</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Create New Loan
        </button>
      </header>

      {/* Active Loans Table */}
      <div className="card">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-lg">Active Loans</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-4">
              <button 
                onClick={handlePrintLoans}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                title="Print List"
              >
                <Printer size={18} />
              </button>
              <button 
                onClick={handleDownloadLoans}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                title="Download PDF"
              >
                <Download size={18} />
              </button>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="Search loans..." className="input-field pl-9 py-1.5 text-sm" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Loan Details</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Interest</th>
                <th className="px-6 py-4 font-semibold">Maturity</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/5 text-primary rounded-lg">
                        <HandCoins size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{loan.loan_number}</p>
                        <p className="text-xs text-gray-500">{format(new Date(loan.start_date), 'dd MMM yyyy')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium">{loan.customer_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold">₹{(loan.amount ?? 0).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm">{loan.interest_rate}% / month</p>
                    <p className="text-xs text-gray-500">{loan.interest_type}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-gray-400" />
                      {format(new Date(loan.maturity_date), 'dd MMM yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      loan.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                    )}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          setSelectedLoan(loan);
                          setIsTopUpModalOpen(true);
                        }}
                        className="p-2 hover:bg-primary/10 rounded-lg text-gray-400 hover:text-primary transition-all"
                        title="Top Up Loan"
                      >
                        <TrendingUp size={18} />
                      </button>
                      <button 
                        onClick={() => setSelectedLoanDetail(loan)}
                        className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-primary transition-all"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Up Modal */}
      <AnimatePresence>
        {isTopUpModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Top Up Loan</h2>
                  <p className="text-gray-500 text-sm">Add principal to {selectedLoan?.loan_number}</p>
                </div>
                <button onClick={() => setIsTopUpModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">Current Principal</p>
                  <p className="text-2xl font-bold text-text-dark">₹{selectedLoan?.amount.toLocaleString()}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Top Up Amount (₹)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="Enter amount"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={topUpDate}
                    onChange={(e) => setTopUpDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Remarks</label>
                  <textarea 
                    className="input-field min-h-[80px]" 
                    placeholder="Reason for top up..."
                    value={topUpRemarks}
                    onChange={(e) => setTopUpRemarks(e.target.value)}
                  ></textarea>
                </div>

                <button 
                  onClick={async () => {
                    if (!topUpAmount || Number(topUpAmount) <= 0) return alert("Please enter a valid amount");
                    
                    try {
                      const res = await fetch(`/api/loans/${selectedLoan.id}/top-up`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          amount: Number(topUpAmount),
                          date: topUpDate,
                          remarks: topUpRemarks
                        })
                      });
                      
                      if (res.ok) {
                        setIsTopUpModalOpen(false);
                        setTopUpAmount('');
                        setTopUpRemarks('');
                        fetch('/api/loans').then(res => res.json()).then(setLoans);
                      } else {
                        const err = await res.json();
                        alert("Top up failed: " + err.error);
                      }
                    } catch (error) {
                      alert("An error occurred during top up");
                    }
                  }}
                  className="w-full btn-primary py-3 mt-4"
                >
                  Confirm Top Up
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Loan Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 w-full max-w-4xl my-8"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold">Create New Girvi Loan</h2>
                <p className="text-gray-500 text-sm">Fill in the details to generate a new loan agreement</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <form className="space-y-8" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data: any = Object.fromEntries(formData.entries());
              
              data.items = items;
              console.log("Submitting loan data:", data);

              try {
                const res = await fetch('/api/loans', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data)
                });
                
                if (res.ok) {
                  setIsAddModalOpen(false);
                  fetch('/api/loans').then(res => res.json()).then(setLoans);
                } else {
                  const err = await res.json();
                  alert("Failed to create loan: " + (err.error || "Unknown error"));
                }
              } catch (error) {
                console.error("Submission error:", error);
                alert("An error occurred during loan creation.");
              }
            }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Section 1: Customer & Basic Info */}
                <div className="space-y-4 md:col-span-1">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <Info size={14} />
                    Customer Info
                  </h3>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">Select Customer</label>
                    <select name="customer_id" required className="input-field">
                      <option value="">Choose a customer...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.mobile})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">Loan Amount (₹)</label>
                    <input name="amount" type="number" required className="input-field" placeholder="0.00" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">Disbursement Mode</label>
                    <select name="disbursement_mode" className="input-field">
                      <option>Cash</option>
                      <option>UPI</option>
                      <option>Bank Transfer</option>
                    </select>
                  </div>
                </div>

                {/* Section 2: Interest Terms */}
                <div className="space-y-4 md:col-span-1">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <Calculator size={14} />
                    Interest Terms
                  </h3>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">Monthly Interest (%)</label>
                    <input name="interest_rate" type="number" step="0.01" required className="input-field" placeholder="1.5" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">Interest Type</label>
                    <select name="interest_type" className="input-field">
                      <option value="simple">Simple Interest</option>
                      <option value="compounded">Monthly Compounded</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">Interest Cycle</label>
                    <select name="cycle" className="input-field">
                      <option>Monthly</option>
                      <option>Daily</option>
                      <option>Weekly</option>
                    </select>
                  </div>
                </div>

                {/* Section 3: Dates & Penalties */}
                <div className="space-y-4 md:col-span-1">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <Calendar size={14} />
                    Schedule
                  </h3>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">Start Date</label>
                    <input name="start_date" type="date" required className="input-field" defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">Maturity Date</label>
                    <input name="maturity_date" type="date" required className="input-field" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500">Penalty Rate (% after maturity)</label>
                    <input name="penalty_rate" type="number" step="0.01" className="input-field" placeholder="2.0" />
                  </div>
                </div>
              </div>

              {/* Item Entry Section */}
              <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <Gem size={18} className="text-secondary" />
                    Pledged Items
                  </h3>
                  <button 
                    type="button" 
                    onClick={addItem}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    + Add Item
                  </button>
                </div>
                
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Item Type</label>
                          <input 
                            value={item.type} 
                            onChange={(e) => updateItem(index, 'type', e.target.value)}
                            className="w-full text-sm border-none bg-gray-50 rounded px-2 py-1 focus:ring-1 focus:ring-primary"
                            placeholder="e.g. Gold Chain"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Purity</label>
                          <select 
                            value={item.purity} 
                            onChange={(e) => updateItem(index, 'purity', e.target.value)}
                            className="w-full text-sm border-none bg-gray-50 rounded px-2 py-1 focus:ring-1 focus:ring-primary"
                          >
                            <option>24K</option>
                            <option>22K</option>
                            <option>20K</option>
                            <option>18K</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Net Weight (g)</label>
                          <input 
                            type="number"
                            value={item.net_weight} 
                            onChange={(e) => updateItem(index, 'net_weight', e.target.value)}
                            className="w-full text-sm border-none bg-gray-50 rounded px-2 py-1 focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Market Rate (₹/g)</label>
                          <input 
                            type="number"
                            value={item.market_rate} 
                            onChange={(e) => updateItem(index, 'market_rate', e.target.value)}
                            className="w-full text-sm border-none bg-gray-50 rounded px-2 py-1 focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                        <div className="text-sm font-bold text-emerald-600">
                          Valuation: ₹{(item.valuation ?? 0).toLocaleString()}
                        </div>
                        {items.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeItem(index)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="btn-primary px-10 flex items-center gap-2">
                  Generate Agreement & Disburse
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Loan Details Modal */}
      <AnimatePresence>
        {selectedLoanDetail && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 w-full max-w-4xl my-8"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold">Loan Details: {selectedLoanDetail.loan_number}</h2>
                  <p className="text-gray-500 text-sm">Customer: {selectedLoanDetail.customer_name}</p>
                </div>
                <button onClick={() => setSelectedLoanDetail(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Loan Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Principal:</span>
                        <span className="font-bold">₹{selectedLoanDetail.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Interest Rate:</span>
                        <span className="font-bold">{selectedLoanDetail.interest_rate}% / month</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Start Date:</span>
                        <span className="font-bold">{format(new Date(selectedLoanDetail.start_date), 'dd MMM yyyy')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Maturity Date:</span>
                        <span className="font-bold">{format(new Date(selectedLoanDetail.maturity_date), 'dd MMM yyyy')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Status:</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          selectedLoanDetail.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                        )}>
                          {selectedLoanDetail.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Pledged Items</h3>
                    <div className="space-y-3">
                      {selectedLoanDetail.items?.map((item: any) => (
                        <div key={item.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <Gem size={18} className="text-primary" />
                            </div>
                            <div>
                              <p className="font-bold text-sm">{item.type}</p>
                              <p className="text-xs text-gray-500">{item.purity} • {item.net_weight}g</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm text-emerald-600">₹{item.valuation.toLocaleString()}</p>
                            <p className="text-[10px] text-gray-400">{item.packet_number}</p>
                          </div>
                        </div>
                      ))}
                      {(!selectedLoanDetail.items || selectedLoanDetail.items.length === 0) && (
                        <p className="text-sm text-gray-400 italic">No items linked to this loan.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  onClick={() => setSelectedLoanDetail(null)}
                  className="px-8 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedLoanDetail.closure_requested === 1 && (
                  <>
                    <button 
                      onClick={() => handleApproveClosure(selectedLoanDetail.id, false)}
                      className="px-8 py-2 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 font-bold"
                    >
                      Reject Closure
                    </button>
                    <button 
                      onClick={() => handleApproveClosure(selectedLoanDetail.id, true)}
                      className="px-8 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-100"
                    >
                      Approve Closure
                    </button>
                  </>
                )}
                {!selectedLoanDetail.closure_requested && selectedLoanDetail.status === 'active' && (
                  <button 
                    onClick={() => {
                      setSelectedLoan(selectedLoanDetail);
                      setSelectedLoanDetail(null);
                      setIsTopUpModalOpen(true);
                    }}
                    className="btn-primary px-8 py-2 flex items-center gap-2"
                  >
                    <TrendingUp size={18} />
                    Top Up Loan
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
