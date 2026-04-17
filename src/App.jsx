import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// FIREBASE TOOLS
import { db, auth } from './firebase';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState('login'); 
  const [currentPage, setCurrentPage] = useState('home');

  // Styles
  const pageBg = "min-h-screen bg-slate-50 p-10 font-sans text-slate-800";
  const cardClass = "bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all";
  const buttonClass = "w-full bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-sm hover:bg-blue-700 transition-all";
  const inputClass = "w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-4";

  // 1. Listen for Login/Logout
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) { alert(error.message); }
  };

  const handleLogout = () => signOut(auth);

  // --- 1. LA POOL CALCULATOR (PUBLIC) ---
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

  // --- 2. GP OVERVIEW (PUBLIC) ---
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
  // --- 3. PRIVATE TASK MANAGER ---
  const TaskManager = () => {
    const [tasks, setTasks] = useState([]);
    const [subject, setSubject] = useState('');

    useEffect(() => {
      if (!user) return;
      const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }, [user]);

    const handleAddTask = async (e) => {
      e.preventDefault();
      await addDoc(collection(db, 'tasks'), {
        userId: user.uid,
        userEmail: user.email,
        subject,
        completed: false,
        createdAt: new Date().toISOString()
      });
      setSubject('');
    };

    // GATEKEEPER: If not logged in, show Login Screen inside the Task Manager page
    if (!user) {
      return (
        <div className={pageBg}>
          <button onClick={() => setCurrentPage('home')} className="mb-10 text-slate-500">← Back</button>
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
            <h2 className="text-2xl font-bold mb-2">Private Task Manager</h2>
            <p className="text-slate-500 mb-6 text-sm">Please login to sync your tasks.</p>
            <form onSubmit={handleAuth}>
              <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} className={inputClass} required />
              <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} className={inputClass} required />
              <button type="submit" className={buttonClass}>{authMode === 'login' ? 'Login' : 'Sign Up'}</button>
            </form>
            <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="w-full mt-4 text-sm text-blue-600 text-center">
              {authMode === 'login' ? "New here? Create account" : "Have an account? Login"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={pageBg}>
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => setCurrentPage('home')} className="text-slate-500">← Back</button>
          <button onClick={handleLogout} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded">Logout ({user.email})</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className={cardClass}>
            <h3 className="font-bold mb-4">Add Task</h3>
            <form onSubmit={handleAddTask}>
              <input type="text" placeholder="Task Subject" value={subject} onChange={(e)=>setSubject(e.target.value)} className={inputClass} required />
              <button type="submit" className={buttonClass}>Save to Cloud</button>
            </form>
          </div>
          <div className="space-y-3">
            <h3 className="font-bold">Your Tasks</h3>
            {tasks.map(t => (
              <div key={t.id} className="bg-white p-4 rounded-lg border flex justify-between">
                <span>{t.subject}</span>
                <button onClick={() => deleteDoc(doc(db, 'tasks', t.id))} className="text-red-400 text-xs">Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // --- MAIN HOME DASHBOARD ---
  const HomeDashboard = () => (
    <div className={pageBg}>
      <h1 className="text-3xl font-extrabold text-slate-900 mb-10 border-b pb-6">My Workspace</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LA POOL - PUBLIC */}
        <div onClick={() => setCurrentPage('la-pool')} className="bg-white p-6 rounded-xl border border-slate-200 cursor-pointer hover:shadow-md transition-all">
          <h2 className="text-xl font-bold text-blue-600">LA Pool</h2>
          <p className="text-slate-500 text-sm mt-1">Open calculator for everyone.</p>
        </div>
        
        {/* GP OVERVIEW - PUBLIC */}
        <div onClick={() => setCurrentPage('gp-overview')} className="bg-white p-6 rounded-xl border border-slate-200 cursor-pointer hover:shadow-md transition-all">
          <h2 className="text-xl font-bold text-green-600">GP Overview</h2>
          <p className="text-slate-500 text-sm mt-1">Public reporting tools.</p>
        </div>

        {/* TASK MANAGER - PRIVATE */}
        <div onClick={() => setCurrentPage('task-manager')} className="bg-white p-6 rounded-xl border-2 border-blue-100 cursor-pointer hover:border-blue-500 transition-all relative">
          <span className="absolute top-3 right-3 text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">PRIVATE</span>
          <h2 className="text-xl font-bold text-slate-900">Task Manager</h2>
          <p className="text-slate-500 text-sm mt-1">Cloud sync & encrypted login.</p>
        </div>
      </div>
    </div>
  );

  // ROUTER LOGIC
  if (currentPage === 'la-pool') return <LAPool />;
  if (currentPage === 'gp-overview') return <GPOverview />;
  if (currentPage === 'task-manager') return <TaskManager />;
  return <HomeDashboard />;
}
