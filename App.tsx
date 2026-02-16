import React, { useState, useEffect, useCallback } from 'react';
import { generateShortlist } from './services/geminiService';
import { ShortlistResult, Requirement } from './types';
import VendorTable from './components/VendorTable';
import { LoaderIcon, PlusIcon, TrashIcon, DownloadIcon, HistoryIcon, SearchIcon, AlertTriangleIcon } from './components/Icons';

function App() {
  // Input State
  const [need, setNeed] = useState('');
  const [region, setRegion] = useState('');
  const [budget, setBudget] = useState('');
  const [requirements, setRequirements] = useState<Requirement[]>([
    { id: '1', text: '' },
    { id: '2', text: '' },
    { id: '3', text: '' },
  ]);

  // App State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<ShortlistResult | null>(null);
  const [history, setHistory] = useState<ShortlistResult[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar toggle

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('vendorScoutHistory');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveToHistory = (result: ShortlistResult) => {
    const newHistory = [result, ...history].slice(0, 5); // Keep last 5
    setHistory(newHistory);
    localStorage.setItem('vendorScoutHistory', JSON.stringify(newHistory));
  };

  const handleAddRequirement = () => {
    setRequirements([...requirements, { id: Date.now().toString(), text: '' }]);
  };

  const handleRemoveRequirement = (id: string) => {
    if (requirements.length > 1) {
      setRequirements(requirements.filter(r => r.id !== id));
    }
  };

  const handleRequirementChange = (id: string, text: string) => {
    setRequirements(requirements.map(r => r.id === id ? { ...r, text } : r));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!need.trim()) return;

    // Filter empty reqs
    const activeReqs = requirements.map(r => r.text.trim()).filter(Boolean);
    if (activeReqs.length === 0) {
      setError("Please enter at least one requirement.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentResult(null);

    try {
      const resultData = await generateShortlist(need, activeReqs, budget, region);
      
      const fullResult: ShortlistResult = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        need,
        region,
        budget,
        requirements: activeReqs,
        vendors: resultData.vendors || [],
        summary: resultData.summary || "Analysis complete.",
        sources: resultData.sources || []
      };

      setCurrentResult(fullResult);
      saveToHistory(fullResult);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadHistory = (item: ShortlistResult) => {
    setNeed(item.need);
    setRegion(item.region);
    setBudget(item.budget);
    setRequirements(item.requirements.map((r, i) => ({ id: i.toString(), text: r })));
    setCurrentResult(item);
    setSidebarOpen(false);
  };

  const exportMarkdown = () => {
    if (!currentResult) return;
    
    const { need, vendors, summary, region, budget } = currentResult;
    let md = `# Vendor Shortlist: ${need}\n\n`;
    md += `**Date:** ${new Date(currentResult.timestamp).toLocaleDateString()}\n`;
    md += `**Region:** ${region || 'Global'} | **Budget:** ${budget || 'N/A'}\n\n`;
    md += `## Executive Summary\n${summary}\n\n`;
    md += `## Vendor Comparison\n\n`;
    
    md += `| Vendor | Price | Features | Risks |\n`;
    md += `| --- | --- | --- | --- |\n`;
    
    vendors.forEach(v => {
      md += `| **${v.name}** | ${v.priceRange} | ${v.matchedFeatures.join('<br>')} | ${v.risksLimits.join('<br>')} |\n`;
    });

    md += `\n## Verdicts\n`;
    vendors.forEach(v => {
      md += `- **${v.name}**: ${v.verdict}\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shortlist-${need.replace(/\s+/g, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
        <h1 className="font-bold text-xl text-indigo-700">VendorScout AI</h1>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-600">
          <HistoryIcon />
        </button>
      </div>

      {/* Sidebar (History) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-100 h-16 flex items-center">
          <div className="font-bold text-xl text-indigo-700 flex items-center gap-2">
            <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-lg">V</span>
            VendorScout
          </div>
        </div>
        
        <div className="p-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Recent Shortlists</h2>
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No history yet.</p>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleLoadHistory(item)}
                  className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                    currentResult?.id === item.id 
                      ? 'bg-indigo-50 text-indigo-700 font-medium' 
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="truncate">{item.need}</div>
                  <div className="text-xs text-slate-400 mt-1">{new Date(item.timestamp).toLocaleDateString()}</div>
                </button>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen relative">
        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-32">
          
          {/* Input Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Create New Shortlist</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">What are you looking for?</label>
                  <input
                    type="text"
                    value={need}
                    onChange={(e) => setNeed(e.target.value)}
                    placeholder="e.g. Email delivery service for marketing, Vector database for small team"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-800 placeholder-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Budget (Optional)</label>
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. $500/mo, Enterprise"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Region (Optional)</label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g. India, EU, Global"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-800"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-slate-700">Key Requirements (5-8 recommended)</label>
                  <button type="button" onClick={handleAddRequirement} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    <PlusIcon className="w-3 h-3" /> Add Requirement
                  </button>
                </div>
                <div className="space-y-3">
                  {requirements.map((req, index) => (
                    <div key={req.id} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-10 flex items-center justify-center text-slate-400 text-sm font-medium">{index + 1}</span>
                      <input
                        type="text"
                        value={req.text}
                        onChange={(e) => handleRequirementChange(req.id, e.target.value)}
                        placeholder={`Requirement ${index + 1}`}
                        className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-slate-800 text-sm"
                      />
                      {requirements.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveRequirement(req.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`
                    px-8 py-3 rounded-lg bg-indigo-600 text-white font-semibold shadow-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all
                    disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2
                  `}
                >
                  {isLoading ? (
                    <>
                      <LoaderIcon className="w-5 h-5" />
                      Researching Market...
                    </>
                  ) : (
                    <>
                      <SearchIcon className="w-5 h-5" />
                      Build Shortlist
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 flex items-center gap-3">
               <AlertTriangleIcon className="w-6 h-6 flex-shrink-0" />
               <p>{error}</p>
            </div>
          )}

          {/* Results Section */}
          {currentResult && (
            <div className="animate-fade-in-up">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Shortlist: {currentResult.need}</h2>
                    <p className="text-slate-500 mt-1 text-sm">Generated on {new Date(currentResult.timestamp).toLocaleString()}</p>
                </div>
                <button 
                  onClick={exportMarkdown}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm flex items-center gap-2 shadow-sm transition-all"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Export Report
                </button>
              </div>

              {/* Executive Summary */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-8">
                <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wide mb-2">Executive Summary</h3>
                <p className="text-indigo-900/80 leading-relaxed">{currentResult.summary}</p>
              </div>

              {/* Vendor Table */}
              <VendorTable vendors={currentResult.vendors} sources={currentResult.sources} />
              
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;