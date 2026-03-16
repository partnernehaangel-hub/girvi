import React from 'react';
import { 
  BarChart3, 
  FileText, 
  Download, 
  Share2, 
  Filter,
  ArrowRight,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { exportToPDF, exportToExcel } from '../lib/exportUtils';

const COLORS = ['#2C5AA0', '#E6C200', '#10b981', '#f43f5e'];

export default function Reports() {
  const [loans, setLoans] = React.useState<any[]>([]);
  const [payments, setPayments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch('/api/loans').then(res => res.json()),
      fetch('/api/payments').then(res => res.json())
    ]).then(([loansData, paymentsData]) => {
      setLoans(loansData);
      setPayments(paymentsData);
      setLoading(false);
    });
  }, []);

  const generateActiveLoansReport = () => {
    const headers = ['Loan #', 'Customer', 'Amount', 'Interest', 'Maturity'];
    const data = loans
      .filter(l => l.status === 'active')
      .map(l => [
        l.loan_number,
        l.customer_name,
        `₹${l.amount.toLocaleString()}`,
        `${l.interest_rate}%`,
        format(new Date(l.maturity_date), 'dd MMM yyyy')
      ]);
    
    exportToPDF('Active Loans Report', headers, data, 'Active_Loans_Report');
  };

  const generateInterestCollectionReport = () => {
    const headers = ['Date', 'Loan #', 'Customer', 'Interest Paid'];
    const data = payments
      .filter(p => p.type === 'interest')
      .map(p => [
        format(new Date(p.date), 'dd MMM yyyy'),
        p.loan_number || 'N/A',
        p.customer_name || 'N/A',
        `₹${p.amount.toLocaleString()}`
      ]);
    
    exportToPDF('Interest Collection Report', headers, data, 'Interest_Collection_Report');
  };

  const exportAllToExcel = () => {
    const combinedData = loans.map(l => ({
      'Loan Number': l.loan_number,
      'Customer': l.customer_name,
      'Principal': l.amount,
      'Interest Rate': l.interest_rate,
      'Start Date': l.start_date,
      'Maturity Date': l.maturity_date,
      'Status': l.status
    }));
    exportToExcel(combinedData, 'Full_Loan_Database');
  };

  const assetData = [
    { name: 'Gold', value: loans.filter(l => l.items?.some((i: any) => i.type.toLowerCase().includes('gold'))).length || 400 },
    { name: 'Silver', value: loans.filter(l => l.items?.some((i: any) => i.type.toLowerCase().includes('silver'))).length || 300 },
    { name: 'Diamond', value: 100 },
    { name: 'Other', value: 50 },
  ];

  const totalInterest = payments
    .filter(p => p.type === 'interest')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalDisbursed = loans.reduce((sum, l) => sum + l.amount, 0);
  
  const principalRecovered = payments
    .filter(p => p.type === 'principal' || p.type === 'full_settlement')
    .reduce((sum, p) => sum + p.amount, 0);

  const generateReleasedItemsReport = async () => {
    try {
      const res = await fetch('/api/reports/released-items');
      const releasedLoans = await res.json();
      
      const headers = ['Loan #', 'Customer', 'Amount', 'Closed Date'];
      const data = releasedLoans.map((l: any) => [
        l.loan_number,
        l.customer_name,
        `₹${l.amount.toLocaleString()}`,
        format(new Date(l.updated_at), 'dd MMM yyyy')
      ]);
      
      exportToPDF('Released Items Report', headers, data, 'Released_Items_Report');
    } catch (err) {
      console.error(err);
      alert('Failed to generate released items report');
    }
  };

  const generateDayBookReport = async () => {
    try {
      const res = await fetch('/api/reports/day-book');
      const transactions = await res.json();
      
      const headers = ['Time', 'Type', 'Reference', 'Amount'];
      const data = transactions.map((t: any) => [
        format(new Date(t.time), 'HH:mm'),
        t.type,
        t.ref,
        `₹${t.amount.toLocaleString()}`
      ]);
      
      exportToPDF(`Day Book Report - ${format(new Date(), 'dd MMM yyyy')}`, headers, data, 'Day_Book_Report');
    } catch (err) {
      console.error(err);
      alert('Failed to generate day book report');
    }
  };

  const reportTypes = [
    { id: 'active', title: 'Active Loans Report', description: 'Detailed list of all currently active Girvi loans.', icon: FileText, action: generateActiveLoansReport },
    { id: 'interest', title: 'Interest Collection', description: 'Summary of interest collected in the current period.', icon: BarChart3, action: generateInterestCollectionReport },
    { id: 'released', title: 'Released Items', description: 'History of items released back to customers.', icon: Download, action: generateReleasedItemsReport },
    { id: 'daybook', title: 'Day Book', description: 'Daily transaction summary of all cash flows.', icon: Share2, action: generateDayBookReport },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-text-dark">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Generate and export business intelligence reports</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-200 rounded-lg flex items-center gap-2 hover:bg-gray-50 font-medium">
            <Filter size={18} />
            Date Range
          </button>
          <button 
            onClick={exportAllToExcel}
            className="btn-primary flex items-center gap-2"
          >
            <Download size={18} />
            Export All (Excel)
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Selection */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportTypes.map((report, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.02 }}
              onClick={report.action}
              className="card p-6 flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <report.icon size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{report.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm font-bold text-primary">
                Generate Report
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Distribution Chart */}
        <div className="card p-6">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <PieChartIcon size={20} className="text-primary" />
            Asset Distribution
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {assetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            {assetData.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-bold">{item.value} Items</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity / Audit Summary */}
      <div className="card">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-lg">Audit Summary (All Time)</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-1">
              <p className="text-gray-500 text-sm">Total Interest Collected</p>
              <h4 className="text-3xl font-bold text-emerald-600">₹{totalInterest.toLocaleString()}</h4>
            </div>
            <div className="text-center space-y-1 border-x border-gray-100">
              <p className="text-gray-500 text-sm">Total Loans Disbursed</p>
              <h4 className="text-3xl font-bold text-primary">₹{totalDisbursed.toLocaleString()}</h4>
            </div>
            <div className="text-center space-y-1">
              <p className="text-gray-500 text-sm">Principal Recovered</p>
              <h4 className="text-3xl font-bold text-secondary">₹{principalRecovered.toLocaleString()}</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
