import React from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Shield, 
  Scale, 
  Signature,
  CheckCircle2,
  ArrowRight,
  Upload,
  Plus,
  X,
  Search,
  FileUp,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { exportToPDF } from '../lib/exportUtils';

const docTemplates = [
  { id: 'loan_agreement', title: 'Loan Agreement', icon: FileText, category: 'Mandatory' },
  { id: 'girvi_receipt', title: 'Girvi Pledge Receipt', icon: Receipt, category: 'Mandatory' },
  { id: 'kyc_sheet', title: 'KYC Declaration', icon: Shield, category: 'Compliance' },
  { id: 'valuation_sheet', title: 'Item Valuation Sheet', icon: Scale, category: 'Internal' },
  { id: 'indemnity_form', title: 'Customer Indemnity', icon: Signature, category: 'Legal' },
  { id: 'release_letter', title: 'Release Letter', icon: CheckCircle2, category: 'Post-Loan' },
];

export default function LegalDocs() {
  const [documents, setDocuments] = React.useState<any[]>([]);
  const [loans, setLoans] = React.useState<any[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<any>(null);
  const [selectedLoanId, setSelectedLoanId] = React.useState('');
  const [uploadData, setUploadData] = React.useState({
    title: '',
    type: 'other',
    loan_id: '',
    file: null as File | null
  });

  React.useEffect(() => {
    fetchDocs();
    fetchLoans();
  }, []);

  const fetchDocs = () => {
    fetch('/api/documents')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch documents');
        return res.json();
      })
      .then(setDocuments)
      .catch(err => console.error('Error fetching docs:', err));
  };

  const fetchLoans = () => {
    fetch('/api/loans')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch loans');
        return res.json();
      })
      .then(setLoans)
      .catch(err => console.error('Error fetching loans:', err));
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const loan = loans.find(l => l.id.toString() === uploadData.loan_id);
        
        const res = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            loan_id: uploadData.loan_id || null,
            customer_id: loan?.customer_id || null,
            title: uploadData.title,
            type: uploadData.type,
            source: 'uploaded',
            file_data: base64
          })
        });

        if (res.ok) {
          setIsUploadModalOpen(false);
          setUploadData({ title: '', type: 'other', loan_id: '', file: null });
          fetchDocs();
        } else {
          const err = await res.json();
          alert('Upload failed: ' + (err.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('An error occurred during upload');
      }
    };
    reader.readAsDataURL(uploadData.file);
  };

  const handleGenerateDoc = async () => {
    if (!selectedLoanId || !selectedTemplate) return;

    const loan = loans.find(l => l.id.toString() === selectedLoanId);
    if (!loan) return;

    // Generate PDF content
    const title = `${selectedTemplate.title} - ${loan.loan_number}`;
    const headers = ['Field', 'Value'];
    const data = [
      ['Loan Number', loan.loan_number],
      ['Customer Name', loan.customer_name],
      ['Principal Amount', `₹${loan.amount.toLocaleString()}`],
      ['Interest Rate', `${loan.interest_rate}% / month`],
      ['Start Date', format(new Date(loan.start_date), 'dd MMM yyyy')],
      ['Maturity Date', format(new Date(loan.maturity_date), 'dd MMM yyyy')],
      ['Status', loan.status],
    ];

    // In a real app, we'd have specific templates for each doc type
    // For now, we generate a generic but professional summary PDF
    exportToPDF(title, headers, data, title.replace(/\s+/g, '_'));

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loan_id: selectedLoanId,
          customer_id: loan.customer_id,
          title: title,
          type: selectedTemplate.id,
          source: 'generated',
          file_data: 'GENERATED_PDF_CONTENT'
        })
      });

      if (res.ok) {
        setIsGenerateModalOpen(false);
        setSelectedLoanId('');
        fetchDocs();
      } else {
        const err = await res.json();
        alert('Failed to save generated document: ' + (err.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('An error occurred while saving the document');
    }
  };

  const downloadDoc = (doc: any) => {
    if (doc.source === 'generated') {
      // Re-generate the PDF for download if it was generated
      const headers = ['Field', 'Value'];
      const data = [
        ['Loan Number', doc.loan_number || 'N/A'],
        ['Customer Name', doc.customer_name || 'N/A'],
        ['Document Type', doc.type.replace('_', ' ').toUpperCase()],
        ['Generated Date', format(new Date(doc.created_at), 'dd MMM yyyy')],
      ];
      exportToPDF(doc.title, headers, data, doc.title.replace(/\s+/g, '_'));
      return;
    }
    
    if (!doc.file_data) return;
    
    const link = document.createElement('a');
    link.href = doc.file_data;
    link.download = doc.title;
    link.click();
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-text-dark">Legal Documentation</h1>
          <p className="text-gray-500 mt-1">Generate and manage legally compliant agreements</p>
        </div>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Upload size={18} />
          Upload Document
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {docTemplates.map((doc) => (
          <motion.div 
            key={doc.id}
            whileHover={{ y: -5 }}
            className="card p-6 flex flex-col justify-between group"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <doc.icon size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                  {doc.category}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-lg">{doc.title}</h3>
                <p className="text-xs text-gray-500 mt-1">Auto-fills with customer and loan data</p>
              </div>
            </div>
            
            <div className="mt-8 flex gap-2">
              <button 
                onClick={() => {
                  setSelectedTemplate(doc);
                  setIsGenerateModalOpen(true);
                }}
                className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Generate
              </button>
              <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-primary transition-all">
                <Printer size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Document Archive */}
      <div className="card">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-lg">Document Archive</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search documents..." 
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Document Name</th>
                <th className="px-6 py-4 font-bold">Type</th>
                <th className="px-6 py-4 font-bold">Loan Ref</th>
                <th className="px-6 py-4 font-bold">Customer</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        doc.source === 'generated' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                      )}>
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{doc.title}</p>
                        <p className="text-[10px] text-gray-400 uppercase">{doc.source}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-gray-500 capitalize">{doc.type.replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-primary">{doc.loan_number || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium">{doc.customer_name || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {format(new Date(doc.created_at), 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => downloadDoc(doc)}
                        className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-primary transition-all"
                      >
                        <Download size={16} />
                      </button>
                      <button className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-primary transition-all">
                        <Printer size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {documents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center text-gray-400">
                      <FileUp size={48} className="mb-4 opacity-20" />
                      <p>No documents found in archive</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">Upload Document</h3>
                <button onClick={() => setIsUploadModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleFileUpload} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Document Title</label>
                  <input 
                    required
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Aadhaar Card, Signed Agreement"
                    value={uploadData.title}
                    onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Document Type</label>
                  <select 
                    className="input-field"
                    value={uploadData.type}
                    onChange={(e) => setUploadData({...uploadData, type: e.target.value})}
                  >
                    <option value="id_proof">ID Proof</option>
                    <option value="address_proof">Address Proof</option>
                    <option value="loan_agreement">Loan Agreement</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Link to Loan (Optional)</label>
                  <select 
                    className="input-field"
                    value={uploadData.loan_id}
                    onChange={(e) => setUploadData({...uploadData, loan_id: e.target.value})}
                  >
                    <option value="">None</option>
                    {loans.map(loan => (
                      <option key={loan.id} value={loan.id}>{loan.loan_number} - {loan.customer_name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Select File</label>
                  <input 
                    required
                    type="file" 
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    onChange={(e) => setUploadData({...uploadData, file: e.target.files?.[0] || null})}
                  />
                </div>
                <button type="submit" className="w-full btn-primary py-3 mt-4">
                  Upload to Archive
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Generate Modal */}
      <AnimatePresence>
        {isGenerateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">Generate {selectedTemplate?.title}</h3>
                <button onClick={() => setIsGenerateModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="p-4 bg-primary/5 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-white rounded-lg text-primary shadow-sm">
                    {selectedTemplate && <selectedTemplate.icon size={24} />}
                  </div>
                  <div>
                    <p className="font-bold">{selectedTemplate?.title}</p>
                    <p className="text-xs text-gray-500">Will be pre-filled with loan details</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Select Loan</label>
                  <select 
                    className="input-field"
                    value={selectedLoanId}
                    onChange={(e) => setSelectedLoanId(e.target.value)}
                  >
                    <option value="">Select a loan...</option>
                    {loans.map(loan => (
                      <option key={loan.id} value={loan.id}>{loan.loan_number} - {loan.customer_name}</option>
                    ))}
                  </select>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                  <Shield className="text-amber-600 flex-shrink-0" size={20} />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    By generating this document, you confirm that all customer information is verified and legally accurate.
                  </p>
                </div>

                <button 
                  onClick={handleGenerateDoc}
                  disabled={!selectedLoanId}
                  className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Document
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
