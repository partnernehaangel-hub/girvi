import React from 'react';
import { Play, Database, AlertCircle, CheckCircle2, Terminal, Save, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function SQLEditor() {
  const [query, setQuery] = React.useState('SELECT * FROM customers LIMIT 10;');
  const [result, setResult] = React.useState<any[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [history, setHistory] = React.useState<string[]>([]);

  const executeQuery = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        if (!history.includes(query)) {
          setHistory([query, ...history].slice(0, 10));
        }
      } else {
        setError(data.error || 'Failed to execute query');
      }
    } catch (err) {
      setError('Network error while executing query');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-text-dark">SQL Query Editor</h1>
          <p className="text-gray-500 mt-1">Direct database access for advanced management</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setQuery('')}
            className="px-4 py-2 border border-gray-200 rounded-lg flex items-center gap-2 hover:bg-gray-50 font-medium"
          >
            <Trash2 size={18} />
            Clear
          </button>
          <button 
            onClick={executeQuery}
            disabled={loading || !query.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Play size={18} />
            {loading ? 'Executing...' : 'Run Query'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {/* Editor Area */}
          <div className="card overflow-hidden border-2 border-primary/10">
            <div className="bg-gray-900 p-3 flex items-center gap-2 text-gray-400 text-xs font-mono">
              <Terminal size={14} />
              SQL EDITOR
            </div>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-64 p-6 font-mono text-sm bg-gray-800 text-emerald-400 outline-none resize-none"
              placeholder="Enter your SQL query here..."
            />
          </div>

          {/* Results Area */}
          <div className="card min-h-[400px] overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Database size={16} className="text-primary" />
                Query Results
              </h3>
              {result && <span className="text-[10px] font-bold text-gray-400 uppercase">{result.length} Rows Returned</span>}
            </div>
            
            <div className="overflow-x-auto">
              {error && (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={24} />
                  </div>
                  <h4 className="font-bold text-rose-600">SQL Error</h4>
                  <p className="text-sm text-gray-500 mt-1 font-mono">{error}</p>
                </div>
              )}

              {result && result.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider">
                    <tr>
                      {Object.keys(result[0]).map((key) => (
                        <th key={key} className="px-6 py-4 font-bold border-b border-gray-100">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        {Object.values(row).map((val: any, j) => (
                          <td key={j} className="px-6 py-4 text-xs text-gray-600 font-mono">
                            {val === null ? <span className="text-gray-300 italic">NULL</span> : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : result && result.length === 0 ? (
                <div className="p-20 text-center">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 className="font-bold text-emerald-600">Success</h4>
                  <p className="text-sm text-gray-500 mt-1">Query executed successfully, but returned no rows.</p>
                </div>
              ) : !loading && !error && (
                <div className="p-20 text-center text-gray-400 italic">
                  Run a query to see results here.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-bold text-sm mb-4 uppercase tracking-wider text-gray-400">Query History</h3>
            <div className="space-y-2">
              {history.map((h, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(h)}
                  className="w-full text-left p-3 text-xs font-mono bg-gray-50 hover:bg-primary/5 rounded-lg border border-gray-100 truncate transition-all"
                  title={h}
                >
                  {h}
                </button>
              ))}
              {history.length === 0 && <p className="text-xs text-gray-400 italic">No history yet</p>}
            </div>
          </div>

          <div className="card p-6 bg-amber-50 border-amber-100">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-600 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-amber-800">Danger Zone</h4>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Direct SQL access allows you to modify or delete any data. Use with extreme caution. Always verify your WHERE clauses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
