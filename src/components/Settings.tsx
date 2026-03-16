import React from 'react';
import { 
  Settings as SettingsIcon, 
  UserCog, 
  Shield, 
  Database, 
  Globe, 
  BellRing, 
  Smartphone,
  CreditCard,
  ChevronRight,
  Save,
  Users,
  Eye,
  EyeOff,
  Key,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const sections = [
  { id: 'general', title: 'General Settings', icon: Globe, description: 'Branch info, currency, and localization' },
  { id: 'interest', title: 'Interest Rate Table', icon: CreditCard, description: 'Manage standard and penalty rates' },
  { id: 'customers', title: 'Customer Credentials', icon: Users, description: 'Manage Customer Panel IDs and Passwords' },
  { id: 'users', title: 'User Management', icon: UserCog, description: 'Role-based access and staff accounts' },
  { id: 'notifications', title: 'Notification Templates', icon: BellRing, description: 'Customize SMS and WhatsApp messages' },
  { id: 'security', title: 'Security & Compliance', icon: Shield, description: 'Audit logs and data encryption' },
  { id: 'backup', title: 'Backup & Export', icon: Database, description: 'Cloud sync and manual data exports' },
];

export default function Settings() {
  const [activeSection, setActiveSection] = React.useState('general');
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [showPassword, setShowPassword] = React.useState<Record<number, boolean>>({});
  const [loading, setLoading] = React.useState(false);
  const [settings, setSettings] = React.useState<any>({
    branchName: 'Digital Communique - Main Branch',
    contactNumber: '+91 98765 43210',
    branchAddress: '123, Gold Plaza, MG Road, Mumbai, Maharashtra - 400001',
    financialYearStart: '2025-04-01',
    currencySymbol: '₹',
    standardInterestRate: '1.5',
    penaltyInterestRate: '2.0'
  });

  React.useEffect(() => {
    fetchSettings();
  }, []);

  React.useEffect(() => {
    if (activeSection === 'customers') {
      fetchCustomers();
    }
  }, [activeSection]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (Object.keys(data).length > 0) {
          setSettings(prev => ({ ...prev, ...data }));
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Network error while saving settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCredentials = async (customerId: number, username: string, pass: string) => {
    try {
      const res = await fetch('/api/admin/customer-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, username, password: pass })
      });
      if (res.ok) {
        fetchCustomers();
      }
    } catch (error) {
      console.error('Error updating credentials:', error);
    }
  };

  const togglePassword = (id: number) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-dark">System Settings</h1>
          <p className="text-gray-500 mt-1">Configure your Girvi Management platform</p>
        </div>
        <button 
          onClick={handleSaveSettings}
          disabled={loading}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <Save size={18} />
          {loading ? 'Saving...' : 'Save All Changes'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left group",
                activeSection === section.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "bg-white text-gray-600 hover:bg-gray-50"
              )}
            >
              <section.icon size={20} className={cn(
                activeSection === section.id ? "text-white" : "text-gray-400 group-hover:text-primary"
              )} />
              <div className="flex-1">
                <p className="font-bold text-sm">{section.title}</p>
              </div>
              <ChevronRight size={16} className={activeSection === section.id ? "text-white/50" : "text-gray-300"} />
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 card p-8">
          <div className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-2xl font-bold">
              {sections.find(s => s.id === activeSection)?.title}
            </h2>
            <p className="text-gray-500 mt-1">
              {sections.find(s => s.id === activeSection)?.description}
            </p>
          </div>

          <div className="space-y-8">
            {activeSection === 'general' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Branch Name</label>
                  <input 
                    className="input-field" 
                    value={settings.branchName} 
                    onChange={(e) => updateSetting('branchName', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Contact Number</label>
                  <input 
                    className="input-field" 
                    value={settings.contactNumber} 
                    onChange={(e) => updateSetting('contactNumber', e.target.value)}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium">Branch Address</label>
                  <textarea 
                    className="input-field h-24" 
                    value={settings.branchAddress} 
                    onChange={(e) => updateSetting('branchAddress', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Financial Year Start</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={settings.financialYearStart} 
                    onChange={(e) => updateSetting('financialYearStart', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Currency Symbol</label>
                  <input 
                    className="input-field" 
                    value={settings.currencySymbol} 
                    onChange={(e) => updateSetting('currencySymbol', e.target.value)}
                  />
                </div>
              </div>
            )}

            {activeSection === 'interest' && (
              <div className="space-y-6">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold">Standard Interest Rate</h4>
                    <p className="text-xs text-gray-500">Applied to all new Girvi loans by default</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      step="0.1" 
                      className="w-20 input-field text-center font-bold" 
                      value={settings.standardInterestRate} 
                      onChange={(e) => updateSetting('standardInterestRate', e.target.value)}
                    />
                    <span className="font-bold text-gray-500">% / Mo</span>
                  </div>
                </div>
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-rose-700">Penalty Interest Rate</h4>
                    <p className="text-xs text-rose-500">Applied after loan maturity date</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      step="0.1" 
                      className="w-20 input-field text-center font-bold text-rose-700 border-rose-200" 
                      value={settings.penaltyInterestRate} 
                      onChange={(e) => updateSetting('penaltyInterestRate', e.target.value)}
                    />
                    <span className="font-bold text-rose-500">% / Mo</span>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'customers' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Customer Portal Access</h3>
                  <button 
                    onClick={fetchCustomers}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <Database size={14} />
                    Refresh List
                  </button>
                </div>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading customer data...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                          <th className="pb-4 px-2">Customer</th>
                          <th className="pb-4 px-2">Portal ID (Username)</th>
                          <th className="pb-4 px-2">Password</th>
                          <th className="pb-4 px-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {customers.map((customer) => (
                          <tr key={customer.id} className="group hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-2">
                              <p className="font-bold text-gray-900">{customer.name}</p>
                              <p className="text-xs text-gray-500">{customer.mobile}</p>
                            </td>
                            <td className="py-4 px-2">
                              <div className="relative max-w-[160px]">
                                <input 
                                  className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                  defaultValue={customer.username || ''}
                                  onBlur={(e) => {
                                    if (e.target.value !== (customer.username || '')) {
                                      updateCredentials(customer.id, e.target.value, customer.password || '');
                                    }
                                  }}
                                  placeholder="Not Set"
                                />
                              </div>
                            </td>
                            <td className="py-4 px-2">
                              <div className="flex items-center gap-2 max-w-[180px]">
                                <div className="relative flex-1">
                                  <input 
                                    type={showPassword[customer.id] ? 'text' : 'password'}
                                    className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    defaultValue={customer.password || ''}
                                    onBlur={(e) => {
                                      if (e.target.value !== (customer.password || '')) {
                                        updateCredentials(customer.id, customer.username || '', e.target.value);
                                      }
                                    }}
                                    placeholder="Not Set"
                                  />
                                  <button 
                                    onClick={() => togglePassword(customer.id)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                                  >
                                    {showPassword[customer.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                  </button>
                                </div>
                                <button 
                                  onClick={() => {
                                    const randomPass = Math.random().toString(36).slice(-6).toUpperCase();
                                    updateCredentials(customer.id, customer.username || customer.name.split(' ')[0].toLowerCase() + customer.id, randomPass);
                                  }}
                                  className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                  title="Auto-generate"
                                >
                                  <Smartphone size={16} />
                                </button>
                              </div>
                            </td>
                            <td className="py-4 px-2 text-right">
                              {customer.username && customer.password ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase">
                                  <Shield size={10} />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase">
                                  <AlertCircle size={10} />
                                  Pending
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {customers.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-12 text-center text-gray-400 italic">
                              No customers found in the system.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeSection !== 'general' && activeSection !== 'interest' && activeSection !== 'customers' && (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                <SettingsIcon size={48} className="mb-4 opacity-10" />
                <p>Configuration options for {sections.find(s => s.id === activeSection)?.title} coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
