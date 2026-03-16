import React from 'react';
import { motion } from 'motion/react';
import { Lock, User, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onLogin: (id: string, pass: string) => boolean;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [id, setId] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin(id, password)) {
      setError('');
    } else {
      setError('Invalid ID or Password');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      >
        <div className="bg-[#2C5AA0] p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-blue-100 text-sm mt-2">Gold & Silver Girvi Management System</p>
          <div className="mt-4 inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] text-white/80 font-medium">
            Use ID: admin | Pass: 12345
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100 italic">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin ID</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2C5AA0] focus:border-transparent outline-none transition-all"
                placeholder="Enter ID"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2C5AA0] focus:border-transparent outline-none transition-all"
                placeholder="Enter Password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#2C5AA0] hover:bg-[#1e407a] text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all transform active:scale-[0.98]"
          >
            Sign In
          </button>
        </form>

        <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Secure Access Only • Unauthorized Access Prohibited
          </p>
        </div>
      </motion.div>

      {/* Footer requested by user */}
      <footer className="mt-12 text-center">
        <p className="text-sm text-gray-500">
          Powered by <span className="font-bold text-[#2C5AA0] bg-blue-50 px-2 py-1 rounded">Digital Communiuqe</span>
        </p>
      </footer>
    </div>
  );
}
