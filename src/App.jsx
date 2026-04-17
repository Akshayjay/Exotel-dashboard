import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- NEW FIREBASE IMPORTS ---
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
    const duration = 1200; 
    const increment = end / (duration / 16); 

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(Math.round(end)); 
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
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

  const pageBg = "min-h-screen bg-slate-50 p-10 font-sans text-slate-800";
  const buttonClass = "w-full bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md transition-all duration-200 disabled:opacity-50";
  const buttonSecondaryClass = "w-full bg-slate-200 text-slate-800 font-semibold py-3 rounded-lg shadow-sm hover:bg-slate-300 transition-all duration-200";
  const inputClass = "w-full p-3 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow";

  // --- COMPONENT: Home Dashboard ---
  const HomeDashboard = () => (
    <div className={pageBg}>
      <header className="mb-10 border-b border-slate-200 pb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">My Workspace</h1>
        <div className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
          Status: Cloud Connected ☁️
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div onClick={() => setCurrentPage('la-pool')} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 cursor-pointer transition-all duration-200 group">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">LA Pool Calculator</h2>
            <span className="text-slate-400 group-hover:text-blue-500 transition-colors">→</span>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">Calculate required allocations using active Part-A and Part-B inputs.</p>
        </div>

        <div onClick={() => setCurrentPage('gp-overview')} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 cursor-pointer transition-all duration-200 group">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">GP Overview</h2>
            <span className="text-slate-400 group-hover:text-blue-500 transition-colors">→</span>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">Input accounts, track SKUs, view charts, and download PDF reports.</p>
        </div>

        <div onClick={() => setCurrentPage('task-manager')} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 cursor-pointer transition-all duration-200 group">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">Task Manager</h2>
            <span className="text-slate-400 group-hover:text-blue-500 transition-colors">→</span>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">Persistent cloud-synced to-do list tagged to your email.</p>
        </div>
      </div>
    </div>
  );

  // --- COMPONENT: LA Pool Calculator ---
  const LAPoolCalculator = () => {
    const [partAAllocations, setPartAAllocations] = useState('');
    const [partBAllocations, setPartBAllocations] = useState('');
    const [finalResult, setFinalResult] = useState(null);

    const handleCalculate = () => {
      const a = Number(partAAllocations);
      const b = Number(partBAllocations);
      if (isNaN(a) || isNaN(b) || (partAAllocations === '' && partBAllocations === '')) {
        setFinalResult(null); alert("Please enter valid numbers."); return;
      }
      setFinalResult(Math.ceil(1.3 * (a + b)));
    };

    return (
      <div className={pageBg}>
        <button onClick={() => setCurrentPage('home')} className="text-slate-500 hover:text-blue-600 mb-8 flex items-center font-medium transition-colors">← Back to Dashboard</button>
        <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">LA Pool Allocation</h1>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Active allocations of <span className="text-blue-600">Part-A</span>?</label>
              <input type="number" value={partAAllocations} onChange={(e) => setPartAAllocations(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Allocations of <span className="text-blue-600">Part-B</span>?</label>
              <input type="number" value={partBAllocations} onChange={(e) => setPartBAllocations(e.target.value)} className={inputClass} />
            </div>
            <button onClick={handleCalculate} className={buttonClass}>Calculate Required Allocation</button>
            {finalResult !== null && (
              <div className="mt-8 pt-8 border-t border-slate-100 text-center animate-fade-in">
                <p className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">Result</p>
                <div className="px-10 py-6 inline-block bg-blue-50 border border-blue-100 rounded-2xl shadow-inner">
                    <CountUp to={finalResult} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- COMPONENT: GP Overview ---
  const GPOverview = () => {
    const [view, setView] = useState('entry');
    const [records, setRecords] = useState([]); 

    const [entity, setEntity] = useState('');
    const [accountSid, setAccountSid] = useState('');
    const [skuInputs, setSkuInputs] = useState([{ id: 1, name: '', gp: '' }]);

    const [lastMonthData, setLastMonthData] = useState({});
    const [showComparisonResult, setShowComparisonResult] = useState(false);

    const addSkuRow = () => setSkuInputs([...skuInputs, { id: Date.now(), name: '', gp: '' }]);
    const removeSkuRow = (id) => setSkuInputs(skuInputs.filter(sku => sku.id !== id));
    const updateSku = (id, field, value) => setSkuInputs(skuInputs.map(sku => sku.id === id ? { ...sku, [field]: value } : sku));

    const saveCurrentForm = () => {
      if (!entity || !accountSid) { alert("Please provide both Entity and Account SID."); return false; }
      const validSkus = skuInputs.filter(s => s.name.trim() !== '' && s.gp !== '');
      if (validSkus.length === 0) { alert("Please add at least one valid SKU with a GP amount."); return false; }

      const newRecords = validSkus.map(s => ({ entity, accountSid, sku: s.name, gp: parseFloat(s.gp) }));
      setRecords([...records, ...newRecords]);
      return true;
    };

    const handleSaveAndNext = () => {
      if (saveCurrentForm()) { setAccountSid(''); setSkuInputs([{ id: Date.now(), name: '', gp: '' }]); }
    };

    const handleCalculate = () => {
      if (entity && accountSid && skuInputs[0].name && skuInputs[0].gp) { saveCurrentForm(); }
      setView('summary');
    };

    const totalGP = records.reduce((sum, r) => sum + r.gp, 0);
    const entityGroups = records.reduce((acc, r) => {
      if (!acc[r.entity]) acc[r.entity] = { total: 0, sids: {} };
      if (!acc[r.entity].sids[r.accountSid]) acc[r.entity].sids[r.accountSid] = 0;
      acc[r.entity].sids[r.accountSid] += r.gp; acc[r.entity].total += r.gp; return acc;
    }, {});

    const pieLabels = Object.keys(entityGroups);
    const pieDataValues = Object.values(entityGroups).map(ent => ent.total);
    const bgColors = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'];
    const pieData = { labels: pieLabels, datasets: [{ data: pieDataValues, backgroundColor: bgColors.slice(0, pieLabels.length), borderWidth: 0 }] };

    const handleLastMonthChange = (sid, value) => setLastMonthData({ ...lastMonthData, [sid]: parseFloat(value) || 0 });

    const exportToPDF = () => {
      if (records.length === 0) { alert("No data to export."); return; }
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(30, 41, 59); 
      doc.text("GP Overview Report", 14, 22);
      
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(100, 116, 139); 
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(37, 99, 235); 
      doc.text(`Total Overall GP: ${totalGP.toLocaleString('en-IN')} INR`, 14, 45);

      const chartCanvas = document.getElementById('gp-pie-chart');
      let currentY = 55; 
      
      if (chartCanvas) {
        doc.setFontSize(12); doc.setTextColor(30, 41, 59); doc.text("Entity Contribution Breakdown:", 14, currentY);
        const chartImg = chartCanvas.toDataURL("image/png", 1.0); doc.addImage(chartImg, 'PNG', 14, currentY + 5, 80, 80); 
        currentY = 150; 
      }

      const tableRows = [];
      Object.entries(entityGroups).forEach(([entName, entData]) => {
        tableRows.push([{ content: entName, colSpan: 2, styles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' } }]);
        Object.entries(entData.sids).forEach(([sid, gp]) => { tableRows.push([`SID: ${sid}`, `${gp.toLocaleString('en-IN')} INR`]); });
      });

      autoTable(doc, {
        startY: currentY, head: [['Account Description', 'Gross Profit (GP)']], body: tableRows,
        theme: 'grid', headStyles: { fillColor: [37, 99, 235], textColor: 255 }, styles: { fontSize: 10, cellPadding: 5 },
      });

      doc.save('GP_Overview_Report.pdf');
    };

    return (
      <div className={pageBg}>
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => setCurrentPage('home')} className="text-slate-500 hover:text-blue-600 flex items-center font-medium transition-colors">← Back to Dashboard</button>
          {records.length > 0 && view === 'entry' && (<span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">{records.length} SKUs Logged</span>)}
        </div>

        {view === 'entry' && (
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Data Entry Engine</h2>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div><label className="block text-sm font-semibold text-slate-700 mb-2">Entity Name</label><input type="text" value={entity} onChange={(e)=>setEntity(e.target.value)} className={inputClass} placeholder="e.g. Corp India" /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-2">Account SID</label><input type="text" value={accountSid} onChange={(e)=>setAccountSid(e.target.value)} className={inputClass} placeholder="e.g. ACC-1234" /></div>
            </div>
            <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex justify-between items-center mb-4"><h3 className="font-semibold text-slate-800">SKU Details</h3><button onClick={addSkuRow} className="text-sm text-blue-600 font-medium hover:underline">+ Add Another SKU</button></div>
              <div className="space-y-4">
                {skuInputs.map((sku) => (
                  <div key={sku.id} className="flex gap-4 items-end">
                    <div className="flex-1"><label className="block text-xs font-medium text-slate-500 mb-1">SKU Name</label><input type="text" value={sku.name} onChange={(e) => updateSku(sku.id, 'name', e.target.value)} className={inputClass} placeholder="e.g. Premium Plan" /></div>
                    <div className="flex-1"><label className="block text-xs font-medium text-slate-500 mb-1">GP Amount (₹)</label><input type="number" value={sku.gp} onChange={(e) => updateSku(sku.id, 'gp', e.target.value)} className={inputClass} placeholder="0" /></div>
                    {skuInputs.length > 1 && (<button onClick={() => removeSkuRow(sku.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent">✕</button>)}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={handleSaveAndNext} className={buttonSecondaryClass}>Save & Add Next SID</button>
              <button onClick={handleCalculate} className={buttonClass}>Finish & Calculate Total GP</button>
            </div>
          </div>
        )}

        {view === 'summary' && (
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-blue-600 text-white p-8 rounded-2xl shadow-sm flex flex-col justify-center items-center text-center">
                <h3 className="text-blue-200 font-medium text-lg uppercase tracking-wider mb-4">Total Overall GP</h3>
                <div className="text-6xl font-bold">₹{totalGP.toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
                <h3 className="font-bold text-slate-900 mb-4 w-full text-left">Entity Contribution</h3>
                <div className="w-64 h-64"><Pie id="gp-pie-chart" data={pieData} options={{ maintainAspectRatio: false }} /></div>
              </div>
            </div>
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Entity & Account Breakdown</h2>
              {Object.entries(entityGroups).map(([entName, entData]) => (
                <div key={entName} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                    <h3 className="text-xl font-bold text-slate-900">{entName}</h3><span className="font-bold text-blue-600 text-lg bg-blue-50 px-4 py-1 rounded-full border border-blue-100">₹{entData.total.toLocaleString('en-IN')}</span>
                  </div>
                  <ul className="space-y-3">
                    {Object.entries(entData.sids).map(([sid, gp]) => (
                      <li key={sid} className="flex justify-between items-center text-slate-700 pl-4 border-l-2 border-slate-200 ml-2">
                        <span className="font-medium text-sm">SID: <span className="text-slate-900">{sid}</span></span>
                        <span className="bg-slate-50 px-3 py-1 rounded font-mono text-sm border border-slate-100 shadow-sm text-slate-700">₹{gp.toLocaleString('en-IN')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex gap-4 pt-4 border-t border-slate-200">
              <button onClick={() => setView('compare')} className={buttonClass}>Compare Growth vs. Last Month</button>
              <button onClick={exportToPDF} className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-lg shadow-sm hover:bg-emerald-700 hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2">📄 Download PDF Report</button>
            </div>
          </div>
        )}

        {view === 'compare' && (
          <div className="max-w-5xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Historical Comparison Engine</h2>
              <button onClick={() => setView('summary')} className="text-slate-500 hover:text-blue-600 font-medium text-sm transition-colors px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50">← Back to Summary</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-sm uppercase tracking-wider text-slate-500">
                    <th className="p-4 font-semibold">Entity</th><th className="p-4 font-semibold">Account SID</th><th className="p-4 font-semibold">Current Month GP</th><th className="p-4 font-semibold">Last Month GP</th>
                    {showComparisonResult && <th className="p-4 font-semibold">Net Growth (₹)</th>}{showComparisonResult && <th className="p-4 font-semibold">Growth (%)</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(entityGroups).map(([entName, entData]) => (
                    Object.entries(entData.sids).map(([sid, currentGp]) => {
                      const lastM = lastMonthData[sid] || 0; const diff = currentGp - lastM; const pct = lastM === 0 ? 100 : ((diff / lastM) * 100); const isPositive = diff >= 0;
                      return (
                        <tr key={sid} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-medium text-slate-900">{entName}</td><td className="p-4 text-slate-600 text-sm">{sid}</td><td className="p-4 font-mono font-medium text-slate-800">₹{currentGp.toLocaleString('en-IN')}</td>
                          <td className="p-4">
                            {!showComparisonResult ? (<input type="number" value={lastMonthData[sid] || ''} onChange={(e) => handleLastMonthChange(sid, e.target.value)} className={`${inputClass} !py-1 !px-2 w-32`} placeholder="0" />) : (<span className="font-mono text-slate-600">₹{lastM.toLocaleString('en-IN')}</span>)}
                          </td>
                          {showComparisonResult && (<td className={`p-4 font-mono font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>{isPositive ? '+' : ''}{diff.toLocaleString('en-IN')}</td>)}
                          {showComparisonResult && (<td className={`p-4 font-mono font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>{isPositive ? '↑' : '↓'} {pct.toFixed(2)}%</td>)}
                        </tr>
                      );
                    })
                  ))}
                </tbody>
              </table>
            </div>
            {!showComparisonResult ? (<div className="mt-8"><button onClick={() => setShowComparisonResult(true)} className={buttonClass}>Execute Comparison Analysis</button></div>) : (
              <div className="mt-8 flex gap-4"><button onClick={() => setShowComparisonResult(false)} className={buttonSecondaryClass}>Edit Last Month Data</button><button onClick={() => { setRecords([]); setView('entry'); setShowComparisonResult(false); }} className="px-6 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors">Clear All & Restart</button></div>
            )}
          </div>
        )}
      </div>
    );
  };

  // --- REWRITTEN COMPONENT: FIREBASE CLOUD TASK MANAGER ---
  const TaskManager = () => {
    const [loginEmail, setLoginEmail] = useState('');
    const [activeUser, setActiveUser] = useState(() => localStorage.getItem('activeCloudUser') || null);
    const [tasks, setTasks] = useState([]);
    
    // Task Form State
    const [subject, setSubject] = useState('');
    const [taskSid, setTaskSid] = useState(''); 
    const [priority, setPriority] = useState('medium');
    const [deadline, setDeadline] = useState('');
    const [notes, setNotes] = useState('');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    
    const [editingId, setEditingId] = useState(null);
    const [editNotes, setEditNotes] = useState('');
    const [editDeadline, setEditDeadline] = useState('');

    // --- FIREBASE REAL-TIME SYNC ---
    useEffect(() => {
      if (!activeUser) return;
      
      // Query Firebase for tasks belonging to the logged-in email
      const q = query(collection(db, 'tasks'), where('userEmail', '==', activeUser));
      
      // onSnapshot listens for real-time updates (cross-device sync!)
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tasksArray = [];
        querySnapshot.forEach((doc) => {
          tasksArray.push({ id: doc.id, ...doc.data() });
        });
        setTasks(tasksArray);
      });

      return () => unsubscribe(); // Cleanup listener when leaving page
    }, [activeUser]);

    // --- FIREBASE HANDLERS ---
    const handleLogin = (e) => {
      e.preventDefault();
      if (loginEmail.trim()) {
        const email = loginEmail.trim().toLowerCase();
        setActiveUser(email);
        localStorage.setItem('activeCloudUser', email); // Just remember who is logged in locally
      }
    };

    const handleLogout = () => {
      setActiveUser(null); setLoginEmail(''); setTasks([]);
      localStorage.removeItem('activeCloudUser');
    };

    // CREATE to Firebase
    const handleAddTask = async (e) => {
      e.preventDefault();
      if (!subject.trim() || !taskSid.trim()) return;

      try {
        await addDoc(collection(db, 'tasks'), {
          userEmail: activeUser, // Tag it to this user
          subject,
          accountSid: taskSid,
          priority,
          deadline,
          notes,
          completed: false,
          createdAt: new Date().toISOString()
        });
        // Clear form on success
        setSubject(''); setTaskSid(''); setPriority('medium'); setDeadline(''); setNotes('');
      } catch (error) {
        console.error("Error adding document: ", error);
        alert("Failed to save task. Check Firebase permissions!");
      }
    };

    // UPDATE Complete Status to Firebase
    const toggleComplete = async (id, currentStatus) => {
      try {
        const taskRef = doc(db, 'tasks', id);
        await updateDoc(taskRef, { completed: !currentStatus });
      } catch (error) { console.error("Error updating: ", error); }
    };

    // DELETE from Firebase
    const deleteTask = async (id) => {
      if (window.confirm("Delete this task permanently from the cloud?")) {
        try {
          await deleteDoc(doc(db, 'tasks', id));
        } catch (error) { console.error("Error deleting: ", error); }
      }
    };

    const startEditing = (task) => { setEditingId(task.id); setEditNotes(task.notes); setEditDeadline(task.deadline); };
    
    // UPDATE Edits to Firebase
    const saveEdit = async (id) => {
      try {
        const taskRef = doc(db, 'tasks', id);
        await updateDoc(taskRef, { notes: editNotes, deadline: editDeadline });
        setEditingId(null);
      } catch (error) { console.error("Error saving edits: ", error); }
    };

    // --- SORTING & FILTERING ---
    const filteredTasks = tasks.filter(t => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (t.subject.toLowerCase().includes(term) || (t.accountSid && t.accountSid.toLowerCase().includes(term)) || (t.notes && t.notes.toLowerCase().includes(term)));
    });

    const priorityWeights = { urgent: 4, high: 3, medium: 2, low: 1 };
    
    const activeTasks = filteredTasks.filter(t => !t.completed).sort((a, b) => priorityWeights[b.priority] - priorityWeights[a.priority]);
    const completedTasks = filteredTasks.filter(t => t.completed).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const getPriorityColor = (level) => {
      switch(level) {
        case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
        case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'low': return 'bg-slate-100 text-slate-600 border-slate-200';
        default: return 'bg-slate-100 text-slate-600';
      }
    };

    // --- RENDER VIEWS ---
    if (!activeUser) {
      return (
        <div className={pageBg}>
          <button onClick={() => setCurrentPage('home')} className="text-slate-500 hover:text-blue-600 mb-8 flex items-center font-medium transition-colors">← Back to Dashboard</button>
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mt-10">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Cloud Task Manager</h1>
            <p className="text-slate-500 mb-6 text-sm">Log in to sync your tasks across devices instantly.</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={inputClass} placeholder="e.g. akshay@workspace.com" required />
              <button type="submit" className={buttonClass}>Connect to Cloud</button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className={pageBg}>
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => setCurrentPage('home')} className="text-slate-500 hover:text-blue-600 flex items-center font-medium transition-colors">← Back to Dashboard</button>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600">Logged in as: <strong className="text-slate-900">{activeUser}</strong></span>
            <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1 bg-red-50 rounded-lg">Logout</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Create Cloud Task</h2>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div><label className="block text-sm font-semibold text-slate-700 mb-1">Subject / Ticket ID</label><input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} placeholder="e.g. Server Migration" required /></div>
                <div><label className="block text-sm font-semibold text-slate-700 mb-1">Account SID</label><input type="text" value={taskSid} onChange={(e) => setTaskSid(e.target.value)} className={inputClass} placeholder="e.g. ACC-123" required /></div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                  </select>
                </div>
                <div><label className="block text-sm font-semibold text-slate-700 mb-1">Deadline</label><input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} /></div>
                <div><label className="block text-sm font-semibold text-slate-700 mb-1">Notes & Updates</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} resize-none h-24`} placeholder="Add initial context here..."></textarea></div>
                <button type="submit" className={buttonClass}>Add to Cloud Sync</button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col h-[85vh]">
            <div className="mb-6"><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputClass} !py-4 text-lg`} placeholder="🔍 Search tasks by Subject, SID, or Notes..." /></div>
            <div className="flex gap-4 mb-4 border-b border-slate-200 pb-2">
              <button onClick={() => setShowHistory(false)} className={`text-lg font-bold transition-colors ${!showHistory ? 'text-slate-900 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>Active Priority Board ({activeTasks.length})</button>
              <button onClick={() => setShowHistory(true)} className={`text-lg font-bold transition-colors ${showHistory ? 'text-slate-900 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>Completed History ({completedTasks.length})</button>
            </div>

            <div className="overflow-y-auto pr-2 space-y-4 pb-10 flex-1 custom-scrollbar">
              {!showHistory ? (
                activeTasks.length === 0 ? (
                  <div className="bg-slate-100 border border-dashed border-slate-300 rounded-xl p-10 text-center text-slate-500">{searchTerm ? "No active tasks match your search." : "Your cloud queue is empty."}</div>
                ) : (
                  activeTasks.map(task => (
                    <div key={task.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex gap-4 items-start">
                        <div className="pt-1"><input type="checkbox" checked={task.completed} onChange={() => toggleComplete(task.id, task.completed)} className="w-5 h-5 cursor-pointer accent-emerald-600" /></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <div><h3 className="text-lg font-bold text-slate-900 leading-tight">{task.subject}</h3><p className="text-xs font-mono text-slate-500 mt-1">SID: {task.accountSid}</p></div>
                            <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                          </div>
                          
                          {editingId !== task.id ? (
                            <>
                              <div className="text-sm text-slate-500 font-medium mb-3 mt-2">Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No Deadline'}</div>
                              {task.notes && (<div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 border border-slate-100 mb-3 whitespace-pre-wrap">{task.notes}</div>)}
                              <div className="flex gap-3">
                                <button onClick={() => startEditing(task)} className="text-sm text-blue-600 font-medium hover:underline">Edit / Add Update</button>
                                <button onClick={() => deleteTask(task.id)} className="text-sm text-red-500 font-medium hover:underline">Delete</button>
                              </div>
                            </>
                          ) : (
                            <div className="mt-3 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Update Deadline</label><input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} className={`${inputClass} !py-2`} /></div>
                              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Add Updates/Notes</label><textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className={`${inputClass} resize-none h-24`} /></div>
                              <div className="flex gap-2">
                                <button onClick={() => saveEdit(task.id)} className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700">Save to Cloud</button>
                                <button onClick={() => setEditingId(null)} className="bg-slate-200 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-300">Cancel</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : (
                completedTasks.length === 0 ? (
                  <div className="bg-slate-100 border border-dashed border-slate-300 rounded-xl p-10 text-center text-slate-500">{searchTerm ? "No completed tasks match your search." : "You haven't completed any cloud tasks yet."}</div>
                ) : (
                  completedTasks.map(task => (
                    <div key={task.id} className="bg-slate-50 p-5 rounded-xl border border-slate-200 opacity-70 hover:opacity-100 transition-opacity duration-200">
                      <div className="flex gap-4 items-start">
                        <div className="pt-1"><input type="checkbox" checked={task.completed} onChange={() => toggleComplete(task.id, task.completed)} className="w-5 h-5 cursor-pointer accent-slate-400" /></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                             <div><h3 className="text-lg font-bold text-slate-600 line-through leading-tight">{task.subject}</h3><p className="text-xs font-mono text-slate-400 mt-1">SID: {task.accountSid}</p></div>
                            <span className="text-xs font-bold uppercase px-3 py-1 rounded-full border bg-slate-200 text-slate-500 border-slate-300">Completed</span>
                          </div>
                          {task.notes && (<div className="bg-white p-3 rounded-lg text-sm text-slate-500 border border-slate-200 mb-3 whitespace-pre-wrap mt-2">{task.notes}</div>)}
                          <div className="flex gap-3"><button onClick={() => deleteTask(task.id)} className="text-sm text-red-500 font-medium hover:underline">Delete Permanently</button></div>
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

  if (currentPage === 'home') return <HomeDashboard />;
  if (currentPage === 'la-pool') return <LAPoolCalculator />;
  if (currentPage === 'gp-overview') return <GPOverview />;
  if (currentPage === 'task-manager') return <TaskManager />;
}
