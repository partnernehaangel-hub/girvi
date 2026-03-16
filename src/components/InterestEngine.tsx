import React from 'react';
import { 
  Calculator, 
  Search, 
  History, 
  ArrowRight, 
  Calendar, 
  HandCoins,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, differenceInDays } from 'date-fns';

export default function InterestEngine() {
  const [loanId, setLoanId] = React.useState('');
  const [loanData, setLoanData] = React.useState<any>(null);
  const [calculation, setCalculation] = React.useState<any>(null);
  const [numInstallments, setNumInstallments] = React.useState(12);
  const [schedule, setSchedule] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const calculateInterest = () => {
    if (!loanData) return;

    const today = new Date();
    const startDate = new Date(loanData.start_date);
    const maturityDate = new Date(loanData.maturity_date);

    // Combine payments and top-ups into a timeline of principal changes
    const transactions = [
      ...(loanData.payments || [])
        .filter((p: any) => p.type === 'principal' || p.type === 'full_settlement')
        .map((p: any) => ({ date: new Date(p.date), amount: -p.amount })),
      ...(loanData.top_ups || [])
        .map((t: any) => ({ date: new Date(t.date), amount: t.amount }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate initial principal (current amount minus all top-ups plus all principal payments)
    let initialPrincipal = loanData.amount;
    (loanData.top_ups || []).forEach((t: any) => initialPrincipal -= t.amount);
    (loanData.payments || []).forEach((p: any) => {
      if (p.type === 'principal' || p.type === 'full_settlement') initialPrincipal += p.amount;
    });

    let lastDate = startDate;
    let runningPrincipal = initialPrincipal;
    let accruedInterest = 0;

    transactions.forEach(tx => {
      const days = differenceInDays(tx.date, lastDate);
      if (days > 0) {
        accruedInterest += (runningPrincipal * (loanData.interest_rate / 100) * days) / 30;
      }
      runningPrincipal += tx.amount;
      lastDate = tx.date;
    });

    // Final segment from last transaction to today
    const finalDays = differenceInDays(today, lastDate);
    if (finalDays > 0) {
      accruedInterest += (runningPrincipal * (loanData.interest_rate / 100) * finalDays) / 30;
    }

    // Penalty calculation if overdue
    let penalty = 0;
    if (today > maturityDate) {
      const overdueDays = differenceInDays(today, maturityDate);
      penalty = (runningPrincipal * (loanData.penalty_rate / 100) * overdueDays) / 30;
    }

    const total = Math.round(runningPrincipal + accruedInterest + penalty);

    setCalculation({
      days: differenceInDays(today, startDate),
      interest: Math.round(accruedInterest),
      penalty: Math.round(penalty),
      total,
      currentPrincipal: runningPrincipal
    });

    generateSchedule(total);
  };

  const generateSchedule = (totalAmount: number) => {
    const perInstallment = totalAmount / numInstallments;
    const newSchedule = [];
    const today = new Date();

    for (let i = 1; i <= numInstallments; i++) {
      const dueDate = new Date(today);
      dueDate.setMonth(today.getMonth() + i);
      newSchedule.push({
        installment: i,
        dueDate,
        amount: Math.round(perInstallment)
      });
    }
    setSchedule(newSchedule);
  };

  const fetchLoan = () => {
    if (!loanId) return;
    setLoading(true);
    fetch(`/api/loans/${loanId}`)
      .then(res => {
        if (!res.ok) throw new Error('Loan not found');
        return res.json();
      })
      .then(data => {
        setLoanData(data);
        setCalculation(null);
        setSchedule([]);
      })
      .catch(err => {
        alert(err.message);
        setLoanData(null);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-dark tracking-tight">Interest Calculation Engine</h1>
          <p className="text-gray-500 mt-1">Automated interest, penalty, and installment planning</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
          <TrendingUp size={16} className="text-primary" />
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Live Engine Active</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Lookup & Info */}
        <div className="lg:col-span-4 space-y-6">
          <section className="card p-6 space-y-4 shadow-sm border-t-4 border-primary">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Search size={20} className="text-primary" />
              Lookup Loan
            </h3>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loan ID or Number</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. 1" 
                  value={loanId}
                  onChange={(e) => setLoanId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchLoan()}
                />
                <button 
                  onClick={fetchLoan}
                  disabled={loading}
                  className="btn-primary px-6 disabled:opacity-50"
                >
                  {loading ? '...' : 'Fetch'}
                </button>
              </div>
            </div>
          </section>

          <AnimatePresence mode="wait">
            {loanData && (
              <motion.section 
                key="loan-details"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="card p-6 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Loan Details</h3>
                  <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">Active</span>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Customer</span>
                      <span className="font-bold">{loanData.customer_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Principal</span>
                      <span className="font-bold">₹{(loanData.amount ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Rate</span>
                      <span className="font-bold text-primary">{loanData.interest_rate}% / month</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border border-gray-100 rounded-xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Start Date</p>
                      <p className="text-sm font-bold mt-1">
                        {loanData.start_date ? format(new Date(loanData.start_date), 'dd MMM yyyy') : 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-100 rounded-xl">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Maturity</p>
                      <p className="text-sm font-bold mt-1 text-rose-500">
                        {loanData.maturity_date ? format(new Date(loanData.maturity_date), 'dd MMM yyyy') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Installment Plan</label>
                      <span className="text-xs font-bold text-primary">{numInstallments} Months</span>
                    </div>
                    <input 
                      type="range" 
                      className="w-full accent-primary" 
                      value={numInstallments}
                      onChange={(e) => setNumInstallments(Number(e.target.value))}
                      min="1"
                      max="60"
                    />
                  </div>

                  <button 
                    onClick={calculateInterest}
                    className="w-full btn-secondary py-3 flex items-center justify-center gap-2 group"
                  >
                    <Calculator size={18} className="group-hover:rotate-12 transition-transform" />
                    Calculate & Plan
                  </button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Results & Schedule */}
        <div className="lg:col-span-8 space-y-8">
          {!calculation ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl p-12 bg-gray-50/30">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm mb-6">
                <Calculator size={40} className="opacity-20" />
              </div>
              <h4 className="text-lg font-bold text-gray-500">No Calculation Active</h4>
              <p className="text-sm text-center max-w-xs mt-2">Select a loan from the lookup panel and click calculate to generate interest breakdown and installment plans.</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              {/* Top Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6 bg-primary text-white relative overflow-hidden">
                  <TrendingUp size={80} className="absolute -right-4 -bottom-4 opacity-10" />
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Accrued Interest</p>
                  <h4 className="text-3xl font-bold mt-2">₹{(calculation.interest ?? 0).toLocaleString()}</h4>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-medium bg-white/10 w-fit px-2 py-1 rounded">
                    <Calendar size={12} />
                    {calculation.days} Days Accrued
                  </div>
                </div>
                <div className={`card p-6 text-white relative overflow-hidden ${calculation.penalty > 0 ? 'bg-rose-500' : 'bg-gray-800'}`}>
                  <AlertTriangle size={80} className="absolute -right-4 -bottom-4 opacity-10" />
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Penalty Charges</p>
                  <h4 className="text-3xl font-bold mt-2">₹{(calculation.penalty ?? 0).toLocaleString()}</h4>
                  <p className="text-[10px] mt-4 text-white/50">{calculation.penalty > 0 ? 'Overdue penalty applied' : 'No penalty currently'}</p>
                </div>
                <div className="card p-6 bg-secondary text-primary relative overflow-hidden border border-primary/10">
                  <HandCoins size={80} className="absolute -right-4 -bottom-4 opacity-10" />
                  <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Total Payable</p>
                  <h4 className="text-3xl font-bold mt-2">₹{(calculation.total ?? 0).toLocaleString()}</h4>
                  <p className="text-[10px] mt-4 text-primary/50">Principal + Interest + Penalty</p>
                </div>
              </div>

              {/* Detailed Breakdown & Plan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="card p-8 space-y-6">
                  <h3 className="font-bold text-xl flex items-center gap-2">
                    <History size={22} className="text-primary" />
                    Calculation Breakdown
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <TrendingUp size={14} className="text-gray-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-600">Current Principal</span>
                      </div>
                      <span className="font-bold">₹{calculation.currentPrincipal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <TrendingUp size={14} className="text-primary" />
                        </div>
                        <span className="text-sm font-medium text-gray-600">Interest ({calculation.days} days)</span>
                      </div>
                      <span className="font-bold">₹{calculation.interest.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                          <AlertTriangle size={14} className="text-rose-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-600">Penalty Charges</span>
                      </div>
                      <span className="font-bold text-rose-500">₹{calculation.penalty.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4">
                      <span className="text-lg font-bold text-text-dark">Grand Total</span>
                      <span className="text-2xl font-bold text-primary">₹{calculation.total.toLocaleString()}</span>
                    </div>
                  </div>
                </section>

                <section className="card p-8 space-y-6 bg-emerald-50/30 border border-emerald-100">
                  <h3 className="font-bold text-xl flex items-center gap-2">
                    <HandCoins size={22} className="text-emerald-500" />
                    Installment Planner
                  </h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-2xl shadow-sm border border-emerald-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Duration</p>
                        <p className="text-xl font-bold text-emerald-600 mt-1">{numInstallments} Mo</p>
                      </div>
                      <div className="p-4 bg-white rounded-2xl shadow-sm border border-emerald-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Monthly EMI</p>
                        <p className="text-xl font-bold text-emerald-600 mt-1">₹{Math.round(calculation.total / numInstallments).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                      <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                        This simulation calculates equal monthly installments based on the current total outstanding. Interest is frozen at the time of calculation for this plan.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button className="flex-1 btn-primary py-3 text-sm">Apply Plan</button>
                      <button className="px-4 py-3 border border-emerald-200 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-colors">
                        <History size={18} />
                      </button>
                    </div>
                  </div>
                </section>
              </div>

              {/* Schedule Table */}
              {schedule.length > 0 && (
                <section className="card overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Calendar size={20} className="text-primary" />
                      Projected Payment Schedule
                    </h3>
                    <button className="text-xs font-bold text-primary uppercase tracking-widest hover:underline">Download PDF</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                        <tr>
                          <th className="px-8 py-4">Installment</th>
                          <th className="px-8 py-4">Due Date</th>
                          <th className="px-8 py-4">Amount</th>
                          <th className="px-8 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {schedule.map((item) => (
                          <tr key={item.installment} className="text-sm hover:bg-gray-50/50 transition-colors">
                            <td className="px-8 py-5 font-bold text-gray-400">#{item.installment.toString().padStart(2, '0')}</td>
                            <td className="px-8 py-5 font-medium text-gray-600">{format(item.dueDate, 'dd MMM yyyy')}</td>
                            <td className="px-8 py-5 font-bold text-text-dark">₹{item.amount.toLocaleString()}</td>
                            <td className="px-8 py-5">
                              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-wider">Scheduled</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
