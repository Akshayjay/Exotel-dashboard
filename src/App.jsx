import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- FIREBASE IMPORTS ---
import { db } from './firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot } from 'firebase/firestore';

ChartJS.register(ArcElement, Tooltip, Legend);

// --- ANIMATION HELPER ---
const CountUp = ({ to, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isNaN(to) || to === null) {
      setCount(0); return;
    }
    let start = 0;
    const end = parseFloat(to);
    const isDecimal = end % 1 !== 0; 
    const duration = 1200; 
    const increment = end / (duration / 16); 

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(isDecimal ? Number(end.toFixed(2)) : Math.round(end)); 
        clearInterval(timer);
      } else {
        setCount(isDecimal ? Number(start.toFixed(2)) : Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [to]);

  return (
    <span className="text-blue-600 font-extrabold text-5xl">
      {prefix}{count.toLocaleString('en-IN')}{suffix}
    </span>
  );
};

// --- THE MAIN APPLICATION ---
export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  // --- NEW: GLOBAL SCRATCHPAD STATE ---
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [scratchpadText, setScratchpadText] = useState(() => localStorage.getItem('globalScratchpad') || '');

  // Auto-save scratchpad to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('globalScratchpad', scratchpadText);
  }, [scratchpadText]);

  const pageBg = "min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8 font-sans text-slate-800 w-full";
  const buttonClass = "w-full bg-blue-600 text-white font-semibold py-3 rounded-xl shadow-sm hover:bg-blue-700 hover:shadow-md transition-all duration-200 disabled:opacity-50";
  const buttonSecondaryClass = "w-full bg-white text-slate-800 font-semibold py-3 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all duration-200";
  const inputClass = "w-full p-4 bg-white/80 backdrop-blur-sm border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all";

  // --- HOME DASHBOARD ---
  const HomeDashboard = () => (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 lg:p-12 font-sans text-slate-800 relative overflow-hidden flex flex-col w-full">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>
      <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-pink-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>

      <div className="relative z-10 w-full">
        <header className="mb-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-slate-200/50 pb-8">
          <div>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight">
              Simplylife <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Dashboard</span>
            </h1>
            <p className="text-slate-500 font-medium mt-3 text-lg">Professional suite for data, analytics, and productivity.</p>
          </div>
          <div className="text-sm font-bold text-emerald-700 bg-emerald-100/80 backdrop-blur-sm px-5 py-2.5 rounded-full border border-emerald-200 shadow-sm flex items-center gap-3">
            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
            Cloud Connected
          </div>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          <div onClick={() => setCurrentPage('la-pool')} className="bg-white/60 backdrop-blur-md p-8 rounded-[2rem] border border-slate-200/50 cursor-pointer hover:bg-white hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-500"></div>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mb-6 text-white font-bold text-2xl shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">LA</div>
            <h2 className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">LA Pool</h2>
            <p className="text-slate-500 text-sm mt-3 leading-relaxed font-medium flex-1">Calculate required allocations using active Part-A and Part-B inputs.</p>
          </div>

          <div onClick={() => setCurrentPage('cpm-calculator')} className="bg-white/60 backdrop-blur-md p-8 rounded-[2rem] border border-slate-200/50 cursor-pointer hover:bg-white hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-50 to-pink-50 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-500"></div>
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-400 rounded-2xl flex items-center justify-center mb-6 text-white font-bold text-2xl shadow-lg shadow-purple-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">CP</div>
            <h2 className="text-2xl font-bold text-slate-800 group-hover:text-purple-600 transition-colors">CPM & Channels</h2>
            <p className="text-slate-500 text-sm mt-3 leading-relaxed font-medium flex-1">Calculate CPM and Streaming Channels needed for your campaigns.</p>
          </div>

          <div onClick={() => setCurrentPage('gp-overview')} className="bg-white/60 backdrop-blur-md p-8 rounded-[2rem] border border-slate-200/50 cursor-pointer hover:bg-white hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-500"></div>
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mb-6 text-white font-bold text-2xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">GP</div>
            <h2 className="text-2xl font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">GP Overview</h2>
            <p className="text-slate-500 text-sm mt-3 leading-relaxed font-medium flex-1">Input accounts, track SKUs, view dynamic charts, and export PDF reports.</p>
          </div>

          <div onClick={() => setCurrentPage('task-manager')} className="bg-slate-900/90 backdrop-blur-md p-8 rounded-[2rem] border border-slate-800 cursor-pointer hover:bg-slate-900 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden flex flex-col h-full">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/40 transition-all duration-500"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/30 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 border border-indigo-400/30">TM</div>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-black tracking-widest uppercase border border-indigo-500/30 backdrop-blur-sm">Private Sync</span>
            </div>
            <h2 className="text-2xl font-bold text-white group-hover:text-indigo-300 transition-colors">Task Manager</h2>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed font-medium flex-1">Persistent cloud-synced to-do list tagged securely to your email.</p>
          </div>
        </div>
      </div>
    </div>
  );

  // --- TOOL: CPM Calculator ---
  const CPMCalculator = () => {
    const [campaignHours, setCampaignHours] = useState(''); const [callDuration, setCallDuration] = useState(''); const [pickupRate, setPickupRate] = useState(''); const [callsPerDay, setCallsPerDay] = useState(''); const [results, setResults] = useState(null);
    const handleCalculate = () => {
      const hours = Number(campaignHours); const duration = Number(callDuration); const rate = Number(pickupRate); const calls = Number(callsPerDay);
      if (!hours || !duration || !rate || !calls) { alert("Please fill in all fields with valid numbers."); return; }
      const cpmNeeded = Math.ceil(calls / (hours * 60)); const streamingChannels = cpmNeeded * (rate / 100) * (duration / 60);
      setResults({ cpm: cpmNeeded, channels: streamingChannels });
    };

    return (
      <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button onClick={() => setCurrentPage('home')} className="text-slate-500 hover:text-purple-600 mb-8 flex items-center font-bold text-lg transition-colors group"><span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard</button>
        <div className="w-full bg-white/70 backdrop-blur-xl p-8 lg:p-12 rounded-[2rem] shadow-xl shadow-purple-500/5 border border-white">
          <div className="mb-10 border-b border-slate-200/50 pb-6"><h1 className="text-4xl font-bold text-slate-900 mb-2">CPM & Streaming Channels</h1><p className="text-slate-500 text-lg">Calculate your campaign connectivity requirements instantly.</p></div>
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Campaign Hours</label><input type="number" value={campaignHours} onChange={(e) => setCampaignHours(e.target.value)} className={inputClass} placeholder="e.g. 8" /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Calls Per Day</label><input type="number" value={callsPerDay} onChange={(e) => setCallsPerDay(e.target.value)} className={inputClass} placeholder="e.g. 5000" /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Avg Call Duration (s)</label><input type="number" value={callDuration} onChange={(e) => setCallDuration(e.target.value)} className={inputClass} placeholder="e.g. 120" /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Pickup Rate (%)</label><input type="number" value={pickupRate} onChange={(e) => setPickupRate(e.target.value)} className={inputClass} placeholder="e.g. 15" /></div>
            </div>
            <div className="max-w-md"><button onClick={handleCalculate} className={buttonClass}>Calculate Requirements</button></div>
            {results && (
              <div className="mt-8 pt-8 border-t border-slate-200/50 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in zoom-in duration-500">
                <div className="p-10 bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 rounded-3xl flex flex-col justify-center shadow-inner"><p className="text-sm font-bold text-blue-600/80 mb-2 uppercase tracking-widest">CPM Needed</p><CountUp to={results.cpm} /></div>
                <div className="p-10 bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50 rounded-3xl flex flex-col justify-center shadow-inner"><p className="text-sm font-bold text-purple-600/80 mb-2 uppercase tracking-widest">Streaming Channels</p><span className="text-purple-600 font-extrabold text-5xl"><CountUp to={results.channels} /></span></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- TOOL: LA Pool Calculator ---
  const LAPoolCalculator = () => {
    const [partAAllocations, setPartAAllocations] = useState(''); const [partBAllocations, setPartBAllocations] = useState(''); const [finalResult, setFinalResult] = useState(null);
    const handleCalculate = () => {
      const a = Number(partAAllocations); const b = Number(partBAllocations);
      if (isNaN(a) || isNaN(b) || (partAAllocations === '' && partBAllocations === '')) { setFinalResult(null); alert("Please enter valid numbers."); return; }
      setFinalResult(Math.ceil(1.3 * (a + b)));
    };

    return (
      <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button onClick={() => setCurrentPage('home')} className="text-slate-500 hover:text-blue-600 mb-8 flex items-center font-bold text-lg transition-colors group"><span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard</button>
        <div className="w-full bg-white/70 backdrop-blur-xl p-8 lg:p-12 rounded-[2rem] shadow-xl shadow-blue-500/5 border border-white">
          <div className="mb-10 border-b border-slate-200/50 pb-6"><h1 className="text-4xl font-bold text-slate-900">LA Pool Allocation</h1></div>
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Active allocations of <span className="text-blue-600">Part-A</span>?</label><input type="number" value={partAAllocations} onChange={(e) => setPartAAllocations(e.target.value)} className={inputClass} /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Allocations of <span className="text-blue-600">Part-B</span>?</label><input type="number" value={partBAllocations} onChange={(e) => setPartBAllocations(e.target.value)} className={inputClass} /></div>
            </div>
            <div className="max-w-md"><button onClick={handleCalculate} className={buttonClass}>Calculate Required Allocation</button></div>
            {finalResult !== null && (
              <div className="mt-8 pt-8 border-t border-slate-200/50 animate-in fade-in zoom-in duration-500"><p className="text-sm font-bold text-blue-600/80 mb-3 uppercase tracking-widest">Final Result</p><div className="px-12 py-8 inline-block bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 rounded-3xl shadow-inner"><CountUp to={finalResult} /></div></div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- TOOL: GP Overview ---
  const GPOverview = () => {
    const [view, setView] = useState('entry'); const [records, setRecords] = useState([]); const [entity, setEntity] = useState(''); const [accountSid, setAccountSid] = useState(''); const [skuInputs, setSkuInputs] = useState([{ id: 1, name: '', gp: '' }]); const [lastMonthData, setLastMonthData] = useState({}); const [showComparisonResult, setShowComparisonResult] = useState(false);

    const addSkuRow = () => setSkuInputs([...skuInputs, { id: Date.now(), name: '', gp: '' }]);
    const removeSkuRow = (id) => setSkuInputs(skuInputs.filter(sku => sku.id !== id));
    const updateSku = (id, field, value) => setSkuInputs(skuInputs.map(sku => sku.id === id ? { ...sku, [field]: value } : sku));

    const saveCurrentForm = () => {
      if (!entity || !accountSid) { alert("Please provide Entity and Account SID."); return false; }
      const validSkus = skuInputs.filter(s => s.name.trim() !== '' && s.gp !== '');
      if (validSkus.length === 0) { alert("Please add at least one valid SKU."); return false; }
      const newRecords = validSkus.map(s => ({ entity, accountSid, sku: s.name, gp: parseFloat(s.gp) })); setRecords([...records, ...newRecords]); return true;
    };

    const handleSaveAndNext = () => { if (saveCurrentForm()) { setAccountSid(''); setSkuInputs([{ id: Date.now(), name: '', gp: '' }]); } };
    const handleCalculate = () => { if (entity && accountSid && skuInputs[0].name && skuInputs[0].gp) { saveCurrentForm(); } setView('summary'); };

    const totalGP = records.reduce((sum, r) => sum + r.gp, 0);
    const entityGroups = records.reduce((acc, r) => {
      if (!acc[r.entity]) acc[r.entity] = { total: 0, sids: {} };
      if (!acc[r.entity].sids[r.accountSid]) acc[r.entity].sids[r.accountSid] = 0;
      acc[r.entity].sids[r.accountSid] += r.gp; acc[r.entity].total += r.gp; return acc;
    }, {});

    const pieLabels = Object.keys(entityGroups); const pieDataValues = Object.values(entityGroups).map(ent => ent.total);
    const bgColors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6'];
    const pieData = { labels: pieLabels, datasets: [{ data: pieDataValues, backgroundColor: bgColors.slice(0, pieLabels.length), borderWidth: 0 }] };

    const handleLastMonthChange = (sid, value) => setLastMonthData({ ...lastMonthData, [sid]: parseFloat(value) || 0 });

    const exportToPDF = () => {
      if (records.length === 0) { alert("No data to export."); return; }
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(15, 23, 42); doc.text("GP Overview Report", 14, 22);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(100, 116, 139); doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(16, 185, 129); doc.text(`Total Overall GP: ${totalGP.toLocaleString('en-IN')} INR`, 14, 45);

      const chartCanvas = document.getElementById('gp-pie-chart'); let currentY = 55; 
      if (chartCanvas) { doc.setFontSize(12); doc.setTextColor(15, 23, 42); doc.text("Entity Contribution Breakdown:", 14, currentY); const chartImg = chartCanvas.toDataURL("image/png", 1.0); doc.addImage(chartImg, 'PNG', 14, currentY + 5, 80, 80); currentY = 150; }

      const tableRows = [];
      Object.entries(entityGroups).forEach(([entName, entData]) => {
        tableRows.push([{ content: entName, colSpan: 2, styles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' } }]);
        Object.entries(entData.sids).forEach(([sid, gp]) => { tableRows.push([`SID: ${sid}`, `${gp.toLocaleString('en-IN')} INR`]); });
      });
      autoTable(doc, { startY: currentY, head: [['Account Description', 'Gross Profit (GP)']], body: tableRows, theme: 'grid', headStyles: { fillColor: [16, 185, 129], textColor: 255 }, styles: { fontSize: 10, cellPadding: 5 } });
      doc.save('GP_Overview_Report.pdf');
    };

    return (
      <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center mb-8 border-b border-slate-200/50 pb-4">
          <button onClick={() => setCurrentPage('home')} className="text-slate-500 hover:text-emerald-600 flex items-center font-bold text-lg transition-colors group"><span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard</button>
          {records.length > 0 && view === 'entry' && (<span className="text-sm font-bold text-emerald-700 bg-emerald-100/80 backdrop-blur-sm px-4 py-2 rounded-full border border-emerald-200">{records.length} SKUs Logged</span>)}
        </div>

        {view === 'entry' && (
          <div className="w-full bg-white/70 backdrop-blur-xl p-8 lg:p-12 rounded-[2rem] shadow-xl shadow-emerald-500/5 border border-white">
            <h2 className="text-4xl font-bold text-slate-900 mb-8">Data Entry Engine</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Entity Name</label><input type="text" value={entity} onChange={(e)=>setEntity(e.target.value)} className={inputClass} placeholder="e.g. Corp India" /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Account SID</label><input type="text" value={accountSid} onChange={(e)=>setAccountSid(e.target.value)} className={inputClass} placeholder="e.g. ACC-1234" /></div>
            </div>
            <div className="mb-10 p-8 bg-slate-50/80 border border-slate-200/50 rounded-3xl">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6"><h3 className="font-bold text-xl text-slate-800">SKU Details</h3><button onClick={addSkuRow} className="text-sm text-emerald-600 font-bold hover:underline bg-emerald-50 px-4 py-2 rounded-lg">+ Add Another SKU</button></div>
              <div className="space-y-6">
                {skuInputs.map((sku) => (
                  <div key={sku.id} className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="flex-1 w-full"><label className="block text-xs font-bold text-slate-500 mb-2">SKU Name</label><input type="text" value={sku.name} onChange={(e) => updateSku(sku.id, 'name', e.target.value)} className={inputClass} placeholder="e.g. Premium Plan" /></div>
                    <div className="flex-1 w-full"><label className="block text-xs font-bold text-slate-500 mb-2">GP Amount (₹)</label><input type="number" value={sku.gp} onChange={(e) => updateSku(sku.id, 'gp', e.target.value)} className={inputClass} placeholder="0" /></div>
                    {skuInputs.length > 1 && (<button onClick={() => removeSkuRow(sku.id)} className="p-4 mb-1 text-red-500 hover:bg-red-100 rounded-xl transition-colors font-bold bg-red-50">✕ Remove</button>)}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 max-w-xl">
              <button onClick={handleSaveAndNext} className={buttonSecondaryClass}>Save & Add Next SID</button>
              <button onClick={handleCalculate} className={`${buttonClass} !bg-emerald-600 hover:!bg-emerald-700`}>Finish & Calculate GP</button>
            </div>
          </div>
        )}

        {view === 'summary' && (
          <div className="w-full space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-12 rounded-[2rem] shadow-xl flex flex-col justify-center items-center text-center">
                <h3 className="text-emerald-100 font-bold text-xl uppercase tracking-widest mb-4">Total Overall GP</h3><div className="text-6xl md:text-7xl font-black">₹{totalGP.toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[2rem] shadow-xl shadow-emerald-500/5 border border-white flex flex-col items-center">
                <h3 className="font-bold text-slate-900 mb-6 w-full text-left text-2xl">Entity Contribution</h3><div className="w-full max-w-sm aspect-square"><Pie id="gp-pie-chart" data={pieData} options={{ maintainAspectRatio: false }} /></div>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-xl p-8 lg:p-12 rounded-[2rem] shadow-xl shadow-emerald-500/5 border border-white">
              <h2 className="text-3xl font-bold text-slate-900 border-b border-slate-200/50 pb-6 mb-8">Entity & Account Breakdown</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {Object.entries(entityGroups).map(([entName, entData]) => (
                  <div key={entName} className="bg-slate-50/80 p-8 rounded-3xl border border-slate-200/50 h-full">
                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-6 mb-6">
                      <h3 className="text-2xl font-bold text-slate-900">{entName}</h3><span className="font-black text-emerald-600 text-xl bg-emerald-100/50 px-5 py-2 rounded-full border border-emerald-200">₹{entData.total.toLocaleString('en-IN')}</span>
                    </div>
                    <ul className="space-y-4">
                      {Object.entries(entData.sids).map(([sid, gp]) => (
                        <li key={sid} className="flex justify-between items-center text-slate-700 pl-4 border-l-4 border-emerald-400 ml-2">
                          <span className="font-bold text-lg">SID: <span className="text-slate-900">{sid}</span></span>
                          <span className="bg-white px-4 py-2 rounded-xl font-mono text-base border border-slate-200 shadow-sm text-slate-800 font-bold">₹{gp.toLocaleString('en-IN')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-6 mt-12 pt-8 border-t border-slate-200/50 max-w-2xl">
                <button onClick={() => setView('compare')} className={`${buttonClass} !bg-slate-800 hover:!bg-slate-900`}>Compare vs. Last Month</button>
                <button onClick={exportToPDF} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 text-lg">📄 Download PDF</button>
              </div>
            </div>
          </div>
        )}

        {view === 'compare' && (
          <div className="w-full bg-white/70 backdrop-blur-xl p-8 lg:p-12 rounded-[2rem] shadow-xl shadow-emerald-500/5 border border-white animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 border-b border-slate-200/50 pb-8">
              <h2 className="text-3xl font-bold text-slate-900">Historical Comparison</h2>
              <button onClick={() => setView('summary')} className="text-slate-600 font-bold text-sm bg-slate-100 hover:bg-slate-200 px-6 py-3 rounded-xl transition-colors">← Back to Summary</button>
            </div>
            <div className="overflow-x-auto w-full rounded-2xl border border-slate-200/50 bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/50 text-sm uppercase tracking-widest text-slate-500">
                    <th className="p-6 font-bold whitespace-nowrap">Entity</th><th className="p-6 font-bold whitespace-nowrap">Account SID</th><th className="p-6 font-bold whitespace-nowrap">Current Month GP</th><th className="p-6 font-bold whitespace-nowrap">Last Month GP</th>
                    {showComparisonResult && <th className="p-6 font-bold whitespace-nowrap">Net Growth (₹)</th>}{showComparisonResult && <th className="p-6 font-bold whitespace-nowrap">Growth (%)</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(entityGroups).map(([entName, entData]) => (
                    Object.entries(entData.sids).map(([sid, currentGp]) => {
                      const lastM = lastMonthData[sid] || 0; const diff = currentGp - lastM; const pct = lastM === 0 ? 100 : ((diff / lastM) * 100); const isPositive = diff >= 0;
                      return (
                        <tr key={sid} className="hover:bg-slate-50 transition-colors">
                          <td className="p-6 font-bold text-slate-900 whitespace-nowrap">{entName}</td><td className="p-6 text-slate-500 font-mono text-sm whitespace-nowrap">{sid}</td><td className="p-6 font-mono font-bold text-slate-800 whitespace-nowrap text-lg">₹{currentGp.toLocaleString('en-IN')}</td>
                          <td className="p-6 whitespace-nowrap">
                            {!showComparisonResult ? (<input type="number" value={lastMonthData[sid] || ''} onChange={(e) => handleLastMonthChange(sid, e.target.value)} className={`${inputClass} !py-2 !px-4 w-40 font-mono`} placeholder="0" />) : (<span className="font-mono text-slate-500 font-bold text-lg">₹{lastM.toLocaleString('en-IN')}</span>)}
                          </td>
                          {showComparisonResult && (<td className={`p-6 font-mono font-black whitespace-nowrap text-lg ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>{isPositive ? '+' : ''}{diff.toLocaleString('en-IN')}</td>)}
                          {showComparisonResult && (<td className={`p-6 font-mono font-black whitespace-nowrap text-lg ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>{isPositive ? '↑' : '↓'} {pct.toFixed(2)}%</td>)}
                        </tr>
                      );
                    })
                  ))}
                </tbody>
              </table>
            </div>
            {!showComparisonResult ? (<div className="mt-10 max-w-sm"><button onClick={() => setShowComparisonResult(true)} className={`${buttonClass} !bg-slate-800 hover:!bg-slate-900`}>Execute Comparison</button></div>) : (
              <div className="mt-10 flex flex-col sm:flex-row gap-6 max-w-2xl"><button onClick={() => setShowComparisonResult(false)} className={buttonSecondaryClass}>Edit Last Month Data</button><button onClick={() => { setRecords([]); setView('entry'); setShowComparisonResult(false); }} className="px-8 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors w-full border border-red-100">Clear All & Restart</button></div>
            )}
          </div>
        )}
      </div>
    );
  };

  // --- TOOL: FIREBASE CLOUD TASK MANAGER ---
  const TaskManager = () => {
    const [loginEmail, setLoginEmail] = useState('');
    const [activeUser, setActiveUser] = useState(() => localStorage.getItem('activeCloudUser') || null);
    const [tasks, setTasks] = useState([]);
    
    const [subject, setSubject] = useState(''); const [taskSid, setTaskSid] = useState(''); const [priority, setPriority] = useState('medium'); const [deadline, setDeadline] = useState(''); const [notes, setNotes] = useState('');
    
    const [searchTerm, setSearchTerm] = useState(''); 
    const [showHistory, setShowHistory] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all'); 
    
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [editingId, setEditingId] = useState(null); const [editNotes, setEditNotes] = useState(''); const [editDeadline, setEditDeadline] = useState('');

    useEffect(() => {
      if (!activeUser) return;
      const q = query(collection(db, 'tasks'), where('userEmail', '==', activeUser));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tasksArray = []; querySnapshot.forEach((doc) => { tasksArray.push({ id: doc.id, ...doc.data() }); }); setTasks(tasksArray);
      });
      return () => unsubscribe(); 
    }, [activeUser]);

    const handleLogin = (e) => { e.preventDefault(); if (loginEmail.trim()) { const email = loginEmail.trim().toLowerCase(); setActiveUser(email); localStorage.setItem('activeCloudUser', email); } };
    const handleLogout = () => { setActiveUser(null); setLoginEmail(''); setTasks([]); localStorage.removeItem('activeCloudUser'); };
    
    const handleAddTask = async (e) => {
      e.preventDefault(); if (!subject.trim() || !taskSid.trim()) return;
      try { await addDoc(collection(db, 'tasks'), { userEmail: activeUser, subject, accountSid: taskSid, priority, deadline, notes, completed: false, createdAt: new Date().toISOString() }); setSubject(''); setTaskSid(''); setPriority('medium'); setDeadline(''); setNotes(''); } 
      catch (error) { alert("Failed to save. Check Firebase!"); }
    };
    
    const toggleComplete = async (id, currentStatus) => { try { await updateDoc(doc(db, 'tasks', id), { completed: !currentStatus }); } catch (error) {} };
    
    const confirmDelete = async () => {
      if (taskToDelete) { try { await deleteDoc(doc(db, 'tasks', taskToDelete)); setTaskToDelete(null); } catch (error) {} }
    };

    const startEditing = (task) => { setEditingId(task.id); setEditNotes(task.notes); setEditDeadline(task.deadline); };
    const saveEdit = async (id) => { try { await updateDoc(doc(db, 'tasks', id), { notes: editNotes, deadline: editDeadline }); setEditingId(null); } catch (error) {} };

    const getTodayString = () => {
      const d = new Date(); const month = `${d.getMonth() + 1}`.padStart(2, '0'); const day = `${d.getDate()}`.padStart(2, '0');
      return `${d.getFullYear()}-${month}-${day}`;
    };

    const filteredTasks = tasks.filter(t => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!(t.subject.toLowerCase().includes(term) || (t.accountSid && t.accountSid.toLowerCase().includes(term)) || (t.notes && t.notes.toLowerCase().includes(term)))) return false;
      }
      if (activeFilter === 'urgent' && t.priority !== 'urgent') return false;
      if (activeFilter === 'today' && t.deadline !== getTodayString()) return false;
      return true;
    });

    const priorityWeights = { urgent: 4, high: 3, medium: 2, low: 1 };
    const activeTasks = filteredTasks.filter(t => !t.completed).sort((a, b) => priorityWeights[b.priority] - priorityWeights[a.priority]);
    const completedTasks = filteredTasks.filter(t => t.completed).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const getPriorityColor = (level) => {
      switch(level) { case 'urgent': return 'bg-red-100 text-red-700 border-red-200'; case 'high': return 'bg-orange-100 text-orange-700 border-orange-200'; case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200'; case 'low': return 'bg-slate-100 text-slate-600 border-slate-200'; default: return 'bg-slate-100 text-slate-600'; }
    };

    if (!activeUser) {
      return (
        <div className="w-full animate-in fade-in duration-500">
          <button onClick={() => setCurrentPage('home')} className="text-slate-500 hover:text-indigo-600 mb-8 flex items-center font-bold text-lg transition-colors group"><span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard</button>
          <div className="max-w-md mx-auto bg-white/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 border border-white mt-10">
            <h1 className="text-4xl font-black text-slate-900 mb-2">Private Access</h1><p className="text-slate-500 mb-10 text-base font-medium">Log in to sync your tasks across devices instantly.</p>
            <form onSubmit={handleLogin} className="space-y-6">
              <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={inputClass} placeholder="e.g. akshay@workspace.com" required />
              <button type="submit" className={`${buttonClass} !bg-indigo-600 hover:!bg-indigo-700 !py-4 text-lg`}>Connect to Cloud</button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        
        {taskToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white/90 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-white max-w-md w-full text-center animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"><span className="text-red-500 text-3xl">⚠️</span></div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Delete this task?</h3>
              <p className="text-slate-500 mb-8">This action cannot be undone. The task will be permanently removed from the cloud.</p>
              <div className="flex gap-4 w-full">
                <button onClick={() => setTaskToDelete(null)} className={buttonSecondaryClass}>Cancel</button>
                <button onClick={confirmDelete} className={`${buttonClass} !bg-red-500 hover:!bg-red-600`}>Yes, Delete</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-200/50 pb-6">
          <button onClick={() => setCurrentPage('home')} className="text-slate-500 hover:text-indigo-600 flex items-center font-bold text-lg transition-colors group"><span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard</button>
          <div className="flex items-center gap-4 bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-slate-200/50">
            <span className="text-sm font-bold text-slate-600">Logged in: <strong className="text-indigo-600">{activeUser}</strong></span>
            <button onClick={handleLogout} className="text-xs text-red-600 hover:text-white font-bold px-4 py-2 bg-red-50 hover:bg-red-500 rounded-full transition-colors">Logout</button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 w-full">
          <div className="xl:col-span-1">
            <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl shadow-indigo-500/5 border border-white sticky top-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-200/50 pb-4">Create Cloud Task</h2>
              <form onSubmit={handleAddTask} className="space-y-5">
                <div><label className="block text-sm font-bold text-slate-700 mb-2">Subject / Ticket ID</label><input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} placeholder="e.g. Server Migration" required /></div>
                <div><label className="block text-sm font-bold text-slate-700 mb-2">Account SID</label><input type="text" value={taskSid} onChange={(e) => setTaskSid(e.target.value)} className={inputClass} placeholder="e.g. ACC-123" required /></div>
                <div><label className="block text-sm font-bold text-slate-700 mb-2">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select>
                </div>
                <div><label className="block text-sm font-bold text-slate-700 mb-2">Deadline</label><input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} /></div>
                <div><label className="block text-sm font-bold text-slate-700 mb-2">Notes & Updates</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} resize-none h-32`} placeholder="Add initial context here..."></textarea></div>
                <button type="submit" className={`${buttonClass} !bg-indigo-600 hover:!bg-indigo-700`}>Add to Cloud Sync</button>
              </form>
            </div>
          </div>

          <div className="xl:col-span-3 flex flex-col h-[85vh]">
            <div className="mb-4"><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputClass} !py-5 text-lg shadow-md border-transparent bg-white`} placeholder="🔍 Search tasks by Subject, SID, or Notes..." /></div>
            
            <div className="flex flex-wrap gap-3 mb-6">
              <button onClick={() => setActiveFilter('all')} className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${activeFilter === 'all' ? 'bg-slate-800 text-white shadow-md' : 'bg-white/60 text-slate-600 hover:bg-white border border-slate-200'}`}>All Tasks</button>
              <button onClick={() => setActiveFilter('urgent')} className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${activeFilter === 'urgent' ? 'bg-red-500 text-white shadow-md shadow-red-500/20' : 'bg-white/60 text-red-600 hover:bg-white border border-red-200/50'}`}>🔥 Urgent Only</button>
              <button onClick={() => setActiveFilter('today')} className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${activeFilter === 'today' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-white/60 text-blue-600 hover:bg-white border border-blue-200/50'}`}>📅 Due Today</button>
            </div>

            <div className="flex gap-8 mb-6 border-b border-slate-200/50 pb-2">
              <button onClick={() => setShowHistory(false)} className={`text-xl font-bold transition-colors pb-3 ${!showHistory ? 'text-indigo-600 border-b-4 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>Priority Board ({activeTasks.length})</button>
              <button onClick={() => setShowHistory(true)} className={`text-xl font-bold transition-colors pb-3 ${showHistory ? 'text-emerald-600 border-b-4 border-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>Completed ({completedTasks.length})</button>
            </div>

            <div className="overflow-y-auto pr-4 space-y-5 pb-10 flex-1 custom-scrollbar">
              {!showHistory ? (
                activeTasks.length === 0 ? ( <div className="bg-white/50 backdrop-blur-sm border-2 border-dashed border-slate-300 rounded-[2rem] p-16 text-center text-slate-500 font-medium text-lg">{searchTerm || activeFilter !== 'all' ? "No tasks match your current filters." : "Your cloud queue is empty."}</div> ) : (
                  activeTasks.map(task => (
                    <div key={task.id} className="bg-white/90 backdrop-blur-md p-8 rounded-[2rem] border border-white shadow-xl shadow-slate-200/50 hover:shadow-indigo-500/10 transition-all duration-300">
                      <div className="flex gap-6 items-start">
                        <div className="pt-1"><input type="checkbox" checked={task.completed} onChange={() => toggleComplete(task.id, task.completed)} className="w-7 h-7 cursor-pointer accent-emerald-500" /></div>
                        <div className="flex-1 w-full">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-3">
                            <div><h3 className="text-2xl font-bold text-slate-900 leading-tight">{task.subject}</h3><p className="text-sm font-mono font-bold text-indigo-500 mt-2 bg-indigo-50 inline-block px-3 py-1 rounded-md">SID: {task.accountSid}</p></div>
                            <span className={`text-xs font-black uppercase px-4 py-2 rounded-xl border ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                          </div>
                          
                          {editingId !== task.id ? (
                            <>
                              <div className="text-sm text-slate-500 font-bold mb-4 mt-2 border-b border-slate-100 pb-3">Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No Deadline'}</div>
                              {task.notes && (<div className="bg-slate-50 p-5 rounded-2xl text-base text-slate-700 border border-slate-100 mb-5 whitespace-pre-wrap">{task.notes}</div>)}
                              <div className="flex gap-4">
                                <button onClick={() => startEditing(task)} className="text-sm text-indigo-600 font-bold hover:underline bg-indigo-50 px-5 py-2.5 rounded-xl">Edit / Add Update</button>
                                <button onClick={() => setTaskToDelete(task.id)} className="text-sm text-red-500 font-bold hover:underline bg-red-50 px-5 py-2.5 rounded-xl">Delete</button>
                              </div>
                            </>
                          ) : (
                            <div className="mt-5 bg-slate-50 p-6 rounded-3xl border border-slate-200/50 space-y-5">
                              <div className="max-w-xs"><div><label className="block text-sm font-bold text-slate-700 mb-2">Update Deadline</label><input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} className={inputClass} /></div></div>
                              <div><label className="block text-sm font-bold text-slate-700 mb-2">Add Updates/Notes</label><textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className={`${inputClass} resize-none h-40`} /></div>
                              <div className="flex gap-4 max-w-md">
                                <button onClick={() => saveEdit(task.id)} className={`${buttonClass} !bg-emerald-600 hover:!bg-emerald-700`}>Save Edit</button>
                                <button onClick={() => setEditingId(null)} className={buttonSecondaryClass}>Cancel</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : (
                completedTasks.length === 0 ? ( <div className="bg-white/50 backdrop-blur-sm border-2 border-dashed border-slate-300 rounded-[2rem] p-16 text-center text-slate-500 font-medium text-lg">{searchTerm || activeFilter !== 'all' ? "No completed tasks match your filters." : "You haven't completed any cloud tasks yet."}</div> ) : (
                  completedTasks.map(task => (
                    <div key={task.id} className="bg-slate-50/80 p-8 rounded-[2rem] border border-slate-200/50 opacity-70 hover:opacity-100 transition-opacity duration-300">
                      <div className="flex gap-6 items-start">
                        <div className="pt-1"><input type="checkbox" checked={task.completed} onChange={() => toggleComplete(task.id, task.completed)} className="w-7 h-7 cursor-pointer accent-slate-400" /></div>
                        <div className="flex-1 w-full">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-3">
                             <div><h3 className="text-2xl font-bold text-slate-600 line-through leading-tight">{task.subject}</h3><p className="text-sm font-mono font-bold text-slate-400 mt-2 bg-slate-200 inline-block px-3 py-1 rounded-md">SID: {task.accountSid}</p></div>
                            <span className="text-xs font-black uppercase px-4 py-2 rounded-xl border bg-slate-200 text-slate-500 border-slate-300">Completed</span>
                          </div>
                          {task.notes && (<div className="bg-white p-5 rounded-2xl text-base text-slate-500 border border-slate-200 mb-5 whitespace-pre-wrap mt-3">{task.notes}</div>)}
                          <div className="flex gap-3"><button onClick={() => setTaskToDelete(task.id)} className="text-sm text-red-500 font-bold hover:underline bg-red-50 px-5 py-2.5 rounded-xl">Delete Permanently</button></div>
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen font-sans text-slate-800 relative w-full bg-slate-50 overflow-x-hidden selection:bg-blue-200 selection:text-blue-900">
      
      {/* GLOBAL ANIMATED BACKGROUND */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-blue-300/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-pulse pointer-events-none z-0"></div>
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-purple-300/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 pointer-events-none z-0"></div>
      <div className="fixed -bottom-40 left-1/4 w-[600px] h-[600px] bg-emerald-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 pointer-events-none z-0"></div>

      {/* --- NEW: GLOBAL SCRATCHPAD FAB & PANEL --- */}
      <div className="fixed bottom-8 right-8 z-50">
        <button 
          onClick={() => setIsScratchpadOpen(!isScratchpadOpen)} 
          className={`flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all duration-300 ${isScratchpadOpen ? 'bg-slate-800 rotate-90' : 'bg-blue-600 hover:bg-blue-700 hover:scale-110'}`}
        >
          <span className="text-2xl text-white">{isScratchpadOpen ? '✕' : '📝'}</span>
        </button>
      </div>

      <div className={`fixed top-0 right-0 h-full w-full md:w-96 bg-white/80 backdrop-blur-3xl shadow-[rgba(0,0,0,0.1)_0px_0px_50px] z-40 transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] border-l border-white/50 ${isScratchpadOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8 h-full flex flex-col pt-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-slate-900">Quick Notes</h2>
          </div>
          <textarea
            value={scratchpadText}
            onChange={(e) => setScratchpadText(e.target.value)}
            placeholder="Jot down quick notes, SIDs, or numbers here. &#10;&#10;Everything is auto-saved to your browser instantly..."
            className="flex-1 w-full bg-slate-50/50 border border-slate-200/50 rounded-3xl p-6 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-700 leading-relaxed text-lg"
          />
          <div className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-slate-400 bg-slate-100/50 py-3 rounded-xl border border-slate-200/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Auto-saved locally
          </div>
        </div>
      </div>
      {/* --- END GLOBAL SCRATCHPAD --- */}

      {/* GLOBAL CONTENT WRAPPER */}
      <div className="relative z-10 w-full min-h-screen p-4 md:p-8 lg:p-12 xl:p-16">
        {currentPage === 'home' && <HomeDashboard />}
        {currentPage === 'la-pool' && <LAPoolCalculator />}
        {currentPage === 'cpm-calculator' && <CPMCalculator />}
        {currentPage === 'gp-overview' && <GPOverview />}
        {currentPage === 'task-manager' && <TaskManager />}
      </div>
    </div>
  );
}
