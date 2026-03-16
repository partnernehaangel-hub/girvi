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
  Save
} from 'lucide-react';
import { motion } from 'motion/react';

const sections = [
  { id: 'general', title: 'General Settings', icon: Globe, description: 'Branch info, currency, and localization' },
  { id: 'interest', title: 'Interest Rate Table', icon: CreditCard, description: 'Manage standard and penalty rates' },
  { id: 'users', title: 'User Management', icon: UserCog, description: 'Role-based access and staff accounts' },
  { id: 'notifications', title: 'Notification Templates', icon: BellRing, description: 'Customize SMS and WhatsApp messages' },
  { id: 'security', title: 'Security & Compliance', icon: Shield, description: 'Audit logs and data encryption' },
  { id: 'backup', title: 'Backup & Export', icon: Database, description: 'Cloud sync and manual data exports' },
];

export default function Settings() {
  const [activeSection, setActiveSection] = React.useState('general');

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-dark">System Settings</h1>
          <p className="text-gray-500 mt-1">Configure your Girvi Management platform</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Save size={18} />
          Save All Changes
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
                  <input className="input-field" defaultValue="Digital Communique - Main Branch" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Contact Number</label>
                  <input className="input-field" defaultValue="+91 98765 43210" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium">Branch Address</label>
                  <textarea className="input-field h-24">123, Gold Plaza, MG Road, Mumbai, Maharashtra - 400001</textarea>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Financial Year Start</label>
                  <input type="date" className="input-field" defaultValue="2025-04-01" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Currency Symbol</label>
                  <input className="input-field" defaultValue="₹" />
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
                    <input type="number" step="0.1" className="w-20 input-field text-center font-bold" defaultValue="1.5" />
                    <span className="font-bold text-gray-500">% / Mo</span>
                  </div>
                </div>
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-rose-700">Penalty Interest Rate</h4>
                    <p className="text-xs text-rose-500">Applied after loan maturity date</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" step="0.1" className="w-20 input-field text-center font-bold text-rose-700 border-rose-200" defaultValue="2.0" />
                    <span className="font-bold text-rose-500">% / Mo</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400">Interest Calculation Logic</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
                      <input type="radio" name="logic" defaultChecked className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-bold text-sm">Actual Days / 30</p>
                        <p className="text-xs text-gray-500">Standard Simple Interest</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
                      <input type="radio" name="logic" className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-bold text-sm">Monthly Compounding</p>
                        <p className="text-xs text-gray-500">Interest on interest monthly</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection !== 'general' && activeSection !== 'interest' && (
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

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
