import React from 'react';
import { 
  Search, 
  UserPlus, 
  Filter, 
  MoreVertical, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  X, 
  Camera, 
  Upload, 
  FileText, 
  UserMinus, 
  List, 
  BookOpen, 
  CheckCircle2,
  Users,
  Printer,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { exportToPDF, printTable } from '../lib/exportUtils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const submenus = [
  { id: 'add', label: 'Add New Customer', icon: UserPlus },
  { id: 'kyc', label: 'KYC Verification', icon: ShieldCheck },
  { id: 'list', label: 'Customer List', icon: List },
  { id: 'ledger', label: 'Customer Ledger', icon: BookOpen },
  { id: 'blacklist', label: 'Blacklisted / Defaulters', icon: UserMinus },
];

const CameraCapture = ({ onCapture, onClose }: { onCapture: (base64: string) => void, onClose: () => void }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
      onClose();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg');
      onCapture(base64);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Capture Photo</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          <div className="aspect-video bg-black rounded-2xl overflow-hidden relative">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="mt-6 flex gap-4">
            <button 
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={capture}
              className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              <Camera size={20} />
              Capture
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FileUpload = ({ label, name, onFileChange }: { label: string, name: string, onFileChange: (name: string, value: string) => void }) => {
  const [preview, setPreview] = React.useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = React.useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        onFileChange(name, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-4">
        <div 
          onClick={() => setIsCameraOpen(true)}
          className="relative w-24 h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center overflow-hidden bg-gray-50 hover:border-primary transition-all group cursor-pointer"
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center text-gray-400 group-hover:text-primary">
              <Camera size={20} />
              <span className="text-[10px] mt-1">Capture</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="relative">
            <input 
              type="file" 
              onChange={handleFile}
              className="hidden" 
              id={`file-${name}`}
            />
            <label 
              htmlFor={`file-${name}`}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer transition-all"
            >
              <Upload size={16} />
              Upload Document
            </label>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">JPG, PNG or PDF (Max 2MB)</p>
        </div>
      </div>
      {isCameraOpen && (
        <CameraCapture 
          onCapture={(base64) => {
            setPreview(base64);
            onFileChange(name, base64);
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
    </div>
  );
};

export default function CustomerManagement() {
  const [activeTab, setActiveTab] = React.useState('list');
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState('');
  const [formData, setFormData] = React.useState<any>({
    attachments: []
  });
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);
  const [customerLoans, setCustomerLoans] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [viewingDoc, setViewingDoc] = React.useState<{ title: string, url: string } | null>(null);

  React.useEffect(() => {
    setIsLoading(true);
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        setCustomers(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  React.useEffect(() => {
    if (selectedCustomer) {
      fetch(`/api/loans?customerId=${selectedCustomer.id}`)
        .then(res => res.json())
        .then(setCustomerLoans);
    }
  }, [selectedCustomer]);

  const handleFileChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const finalData = { ...formData, ...Object.fromEntries(data.entries()) };
    
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData)
      });
      if (res.ok) {
        alert('Customer added successfully!');
        setActiveTab('list');
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.mobile.includes(search);
    if (activeTab === 'blacklist') return matchesSearch && c.status === 'blacklisted';
    if (activeTab === 'kyc') return matchesSearch; // Show all for KYC verification
    return matchesSearch;
  });

  const handlePrintCustomers = () => {
    const headers = ['ID', 'Name', 'Mobile', 'Address', 'Status'];
    const data = customers.map(c => [
      `CUST-${c.id.toString().padStart(4, '0')}`,
      c.name,
      c.mobile,
      c.address || 'N/A',
      c.status
    ]);
    printTable('Customer List', headers, data);
  };

  const handleDownloadCustomers = () => {
    const headers = ['ID', 'Name', 'Mobile', 'Address', 'Status'];
    const data = customers.map(c => [
      `CUST-${c.id.toString().padStart(4, '0')}`,
      c.name,
      c.mobile,
      c.address || 'N/A',
      c.status
    ]);
    exportToPDF('Customer List', headers, data, 'Customer_List');
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-dark">Customer Management</h1>
          <p className="text-gray-500 mt-1">KYC, Ledgers, and Defaulter Tracking</p>
        </div>
        <div className="flex flex-wrap gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          {submenus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => {
                setActiveTab(menu.id);
                if (menu.id !== 'ledger') setSelectedCustomer(null);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === menu.id 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-primary"
              )}
            >
              <menu.icon size={16} />
              {menu.label}
            </button>
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'add' && (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card p-8"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <UserPlus className="text-primary" />
                Register New Customer
              </h2>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Customer ID</p>
                <p className="text-lg font-bold text-primary">AUTO-GEN</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-3">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    Basic Information
                  </h3>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Customer Full Name</label>
                  <input name="name" required className="input-field" placeholder="e.g. Rajesh Kumar" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Mobile Number</label>
                  <input name="mobile" required className="input-field" placeholder="e.g. 9876543210" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Nominee Name</label>
                  <input name="nominee" className="input-field" placeholder="e.g. Sneha Kumar" />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="text-sm font-medium">Full Address</label>
                  <textarea name="address" className="input-field h-24" placeholder="Enter full permanent address"></textarea>
                </div>
              </div>

              {/* KYC Documents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={14} />
                    Identity Proofs
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Aadhaar Number</label>
                      <input name="aadhaar" className="input-field" placeholder="12-digit Aadhaar" />
                    </div>
                    <FileUpload label="Aadhaar Capture / Upload" name="aadhaar_proof" onFileChange={handleFileChange} />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">PAN Number (Optional)</label>
                      <input name="pan" className="input-field" placeholder="10-digit PAN" />
                    </div>
                    <FileUpload label="PAN Capture / Upload" name="pan_proof" onFileChange={handleFileChange} />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Camera size={14} />
                    Biometrics & Verification
                  </h3>
                  <FileUpload label="Live Photo Capture" name="photo" onFileChange={handleFileChange} />
                  <FileUpload label="Signature Capture" name="signature" onFileChange={handleFileChange} />
                  <FileUpload label="Nominee ID Proof" name="nominee_proof" onFileChange={handleFileChange} />
                </div>
              </div>

              {/* Additional Attachments */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} />
                  Other Attachments (Utility Bills, etc.)
                </h3>
                <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-primary transition-all cursor-pointer bg-gray-50">
                  <Upload size={32} />
                  <p className="mt-2 font-medium">Click or drag files to upload additional proofs</p>
                  <p className="text-xs">PDF, JPG, PNG supported</p>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-8 border-t border-gray-100">
                <button type="button" onClick={() => setActiveTab('list')} className="px-8 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="btn-primary px-12 py-3 flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  Complete Registration
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {(activeTab === 'list' || activeTab === 'blacklist' || activeTab === 'kyc') && (
          <motion.div
            key="customer-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Search & Filter */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by name or mobile..." 
                  className="input-field pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrintCustomers}
                  className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
                  title="Print List"
                >
                  <Printer size={18} />
                </button>
                <button 
                  onClick={handleDownloadCustomers}
                  className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
                  title="Download PDF"
                >
                  <Download size={18} />
                </button>
                <button className="px-4 py-2 border border-gray-200 rounded-lg flex items-center gap-2 hover:bg-gray-50">
                  <Filter size={18} />
                  Filters
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-full py-20 text-center text-gray-500">Loading customers...</div>
              ) : filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <motion.div 
                    key={customer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-6 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg overflow-hidden">
                          {customer.photo ? (
                            <img src={customer.photo} alt={customer.name} className="w-full h-full object-cover" />
                          ) : (
                            customer.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{customer.name}</h3>
                          <p className="text-xs text-gray-500">ID: CUST-{customer.id.toString().padStart(4, '0')}</p>
                        </div>
                      </div>
                      <button className="p-1 hover:bg-gray-100 rounded-md">
                        <MoreVertical size={18} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={14} />
                        {customer.mobile}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={14} />
                        <span className="truncate">{customer.address || 'No address provided'}</span>
                      </div>
                    </div>

                    {activeTab === 'kyc' && (
                      <div className="grid grid-cols-4 gap-2 py-2">
                        <button 
                          onClick={() => customer.aadhaar_proof && setViewingDoc({ title: 'Aadhaar Proof', url: customer.aadhaar_proof })}
                          className={cn("h-2 rounded-full transition-all", customer.aadhaar_proof ? "bg-emerald-500 hover:bg-emerald-600 cursor-pointer" : "bg-gray-200 cursor-not-allowed")} 
                          title="Aadhaar" 
                        />
                        <button 
                          onClick={() => customer.pan_proof && setViewingDoc({ title: 'PAN Proof', url: customer.pan_proof })}
                          className={cn("h-2 rounded-full transition-all", customer.pan_proof ? "bg-emerald-500 hover:bg-emerald-600 cursor-pointer" : "bg-gray-200 cursor-not-allowed")} 
                          title="PAN" 
                        />
                        <button 
                          onClick={() => customer.photo && setViewingDoc({ title: 'Customer Photo', url: customer.photo })}
                          className={cn("h-2 rounded-full transition-all", customer.photo ? "bg-emerald-500 hover:bg-emerald-600 cursor-pointer" : "bg-gray-200 cursor-not-allowed")} 
                          title="Photo" 
                        />
                        <button 
                          onClick={() => customer.signature && setViewingDoc({ title: 'Signature', url: customer.signature })}
                          className={cn("h-2 rounded-full transition-all", customer.signature ? "bg-emerald-500 hover:bg-emerald-600 cursor-pointer" : "bg-gray-200 cursor-not-allowed")} 
                          title="Signature" 
                        />
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                      <div className={cn(
                        "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                        customer.status === 'blacklisted' ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {customer.status === 'blacklisted' ? <UserMinus size={12} /> : <ShieldCheck size={12} />}
                        {customer.status === 'blacklisted' ? 'Blacklisted' : 'KYC Verified'}
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setActiveTab('ledger');
                        }}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        View Ledger
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center space-y-4 bg-white rounded-2xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                    <Users size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">No Customers Found</h3>
                    <p className="text-gray-500">Try adjusting your search or filters.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'ledger' && (
          <motion.div
            key="ledger-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {!selectedCustomer ? (
              <div className="card p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                  <BookOpen size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Select a Customer</h3>
                  <p className="text-gray-500">Please select a customer from the list to view their ledger.</p>
                </div>
                <button onClick={() => setActiveTab('list')} className="btn-primary px-6 py-2">Go to Customer List</button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="card p-6 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center text-2xl font-bold">
                      {selectedCustomer.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedCustomer.name}</h2>
                      <p className="text-gray-500">CUST-{selectedCustomer.id.toString().padStart(4, '0')} • {selectedCustomer.mobile}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedCustomer(null)} className="text-sm text-gray-400 hover:text-gray-600">Change Customer</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="card p-6 bg-primary text-white">
                    <p className="text-primary-foreground/70 text-sm font-medium">Total Loan Amount</p>
                    <h3 className="text-3xl font-bold mt-1">₹{customerLoans.reduce((sum, l) => sum + (l.amount ?? 0), 0).toLocaleString()}</h3>
                  </div>
                  <div className="card p-6">
                    <p className="text-gray-500 text-sm font-medium">Active Loans</p>
                    <h3 className="text-3xl font-bold mt-1 text-text-dark">{customerLoans.filter(l => l.status === 'active').length}</h3>
                  </div>
                  <div className="card p-6">
                    <p className="text-gray-500 text-sm font-medium">Last Payment</p>
                    <h3 className="text-3xl font-bold mt-1 text-text-dark">₹0</h3>
                  </div>
                </div>

                <div className="card overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg">Transaction History</h3>
                    <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                      <Upload size={14} />
                      Export Statement
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                          <th className="px-6 py-4 font-bold">Date</th>
                          <th className="px-6 py-4 font-bold">Type</th>
                          <th className="px-6 py-4 font-bold">Reference</th>
                          <th className="px-6 py-4 font-bold">Debit (₹)</th>
                          <th className="px-6 py-4 font-bold">Credit (₹)</th>
                          <th className="px-6 py-4 font-bold">Balance (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {customerLoans.map((loan) => (
                          <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm">{new Date(loan.start_date).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase">Loan Disbursement</span>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium">{loan.loan_number}</td>
                            <td className="px-6 py-4 text-sm font-bold text-rose-600">{(loan.amount ?? 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm">0</td>
                            <td className="px-6 py-4 text-sm font-bold">{(loan.amount ?? 0).toLocaleString()}</td>
                          </tr>
                        ))}
                        {customerLoans.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No transactions found for this customer.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {viewingDoc && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{viewingDoc.title}</h3>
                <button 
                  onClick={() => setViewingDoc(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-auto bg-gray-100 rounded-xl flex items-center justify-center p-4">
                {viewingDoc.url.startsWith('data:application/pdf') ? (
                  <iframe src={viewingDoc.url} className="w-full h-full min-h-[600px]" />
                ) : (
                  <img src={viewingDoc.url} alt={viewingDoc.title} className="max-w-full max-h-full object-contain shadow-lg" />
                )}
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <a 
                  href={viewingDoc.url} 
                  download={viewingDoc.title.replace(/\s+/g, '_')}
                  className="btn-primary px-6 py-2 flex items-center gap-2"
                >
                  <Download size={18} />
                  Download
                </a>
                <button 
                  onClick={() => setViewingDoc(null)}
                  className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Remove duplicated cn definition at the end

