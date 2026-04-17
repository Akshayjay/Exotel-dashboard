import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
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

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// --- GLOBAL STYLES & CONSTANTS ---
const pageBg = "min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800";
const inputClass = "w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-4 text-slate-700";
const buttonClass = "w-full bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-sm hover:bg-blue-700 transition-all active:scale-95";
const buttonSecondaryClass = "w-full bg-slate-100 text-slate-700 font-semibold py-3 rounded-lg border border-slate-200 hover:bg-slate-200 transition-all";

// --- HELPER COMPONENTS ---

const CountUp = ({ to }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(to);
    if (start === end) return;
    let totalMiliseconds = 500;
    let incrementTime = (totalMiliseconds / end) * 5;
    let timer = setInterval(() => {
      start += 5;
      setCount(start);
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      }
    }, incrementTime);
    return () => clearInterval(timer);
  }, [to]);
  return <span className="text-4xl font-black text-blue-900">₹{count.toLocaleString()}</span>;
};

const LoginView = ({ email, setEmail, password, setPassword, authMode, setAuthMode, handleAuth }) => (
  <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl border border-slate-200 mt-10">
    <h2 className="text-2xl font-bold mb-2 text-slate-900">Private Access</h2>
    <p className="text-slate-500 mb-8 text-sm">{authMode === 'login' ? 'Login to manage your tasks' : 'Create a private account'}</p>
    <form onSubmit={handleAuth}>
      <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} className={inputClass} required />
      <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} className={inputClass} required />
      <button type="submit" className={buttonClass}>{authMode === 'login' ? 'Login' : 'Sign Up'}</button>
    </form>
    <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="w-full mt-4 text-sm text-blue-600 font-medium hover:underline text-center">
      {authMode === 'login' ? "Need an account? Sign Up" : "Already have an account? Login"}
    </button>
  </div>
);

// --- TOOL COMPONENT: LA POOL CALCULATOR ---
const LAPoolCalculator = ({ setCurrentPage }) => {
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
        <h1 className="text-2xl font-bold text-slate-900 mb-8">LA Pool Allocation</h1>
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
            <div className="mt-8 pt-8 border-t border-slate-100 text-center">
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

// --- TOOL COMPONENT: GP OVERVIEW ---
const GPOverview = ({ setCurrentPage }) => {
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

  const handleSaveAndNext = () => { if (saveCurrentForm()) { setAccountSid(''); setSkuInputs([{ id: Date.now(), name: '', gp: '' }]); } };
  const handleCalculate = () => { if (entity && accountSid && skuInputs[0].name && skuInputs[0].gp) { saveCurrentForm(); } setView('summary'); };

  const totalGP = records.reduce((sum, r) => sum + r.gp, 0);
  const entityGroups = records.reduce((acc, r) => {
    if (!acc[r.entity]) acc[r.entity] = { total: 0, sids: {} };
    if (!acc[r.entity].sids[r.accountSid]) acc[r.entity].sids[r.accountSid] = 0;
    acc[r.entity].sids[r.accountSid] += r.gp; acc[r.entity].total += r.gp; return acc;
  }, {});

  const pieLabels = Object.keys(entityGroups);
  const pieDataValues = Object.values(entityGroups).map(ent => ent.total);
  const pieData = { labels: pieLabels, datasets: [{ data: pieDataValues, backgroundColor: ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'], borderWidth: 0 }] };

  const handleLastMonthChange = (sid, value) => setLastMonthData({ ...lastMonthData, [sid]: parseFloat(value) || 0 });

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("GP Overview Report", 14, 22);
    autoTable(doc, {
      startY: 30,
      head: [['Account SID', 'GP Amount']],
      body: records.map(r => [r.accountSid, `${r.gp.toLocaleString()} INR`]),
    });
    doc.save('GP_Report.pdf');
  };

  return (
    <div className={pageBg}>
      <button onClick={() => setCurrentPage('home')} className="text-slate-500 mb-8 flex items-center font-medium">← Back</button>
      {view === 'entry' && (
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-2xl font-bold mb-6">GP Data Entry</h2>
          <div className="grid grid-cols-2 gap-6 mb-8">
            <input type="text" value={entity} onChange={(e)=>setEntity(e.target.value)} className={inputClass} placeholder="Entity Name" />
            <input type="text" value={accountSid} onChange={(e)=>setAccountSid(e.target.value)} className={inputClass} placeholder="Account SID" />
          </div>
          <div className="space-y-4 mb-8">
            {skuInputs.map((sku) => (
              <div key={sku.id} className="flex gap-4">
                <input type="text" value={sku.name} onChange={(e) => updateSku(sku.id, 'name', e.target.value)} className={inputClass} placeholder="SKU Name" />
                <input type="number" value={sku.gp} onChange={(e) => updateSku(sku.id, 'gp', e.target.value)} className={inputClass} placeholder="GP ₹" />
              </div>
            ))}
            <button onClick={addSkuRow} className="text-blue-600 text-sm font-bold">+ Add SKU Row</button>
          </div>
          <div className="flex gap-4">
            <button onClick={handleSaveAndNext} className={buttonSecondaryClass}>Save & Add Next</button>
            <button onClick={handleCalculate} className={buttonClass}>Finish & Summary</button>
          </div>
        </div>
      )}
      {view === 'summary' && (
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-blue-600 text-white p-10 rounded-2xl text-center">
            <h3 className="text-blue-100 uppercase text-xs font-bold tracking-widest mb-2">Total GP</h3>
            <div className="text-5xl font-black">₹{totalGP.toLocaleString()}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border">
               <Pie data={pieData} />
            </div>
            <div className="space-y-4">
              <button onClick={exportToPDF} className={buttonClass}>Download PDF</button>
              <button onClick={() => setView('entry')} className={buttonSecondaryClass}>Add More Data</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState('login'); 
  const [currentPage, setCurrentPage] = useState('home');
  const [tasks, setTasks] = useState([]);
  const [subject, setSubject] = useState('');

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Task Listener
  useEffect(() => {
    if (!user) { setTasks([]); return; }
    const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

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

  const handleAddTask = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'tasks'), {
      userId: user.uid,
      subject,
      completed: false,
      createdAt: new Date().toISOString()
    });
    setSubject('');
  };

  // ROUTER
  if (currentPage === 'la-pool') return <LAPoolCalculator setCurrentPage={setCurrentPage} />;
  if (currentPage === 'gp-overview') return <GPOverview setCurrentPage={setCurrentPage} />;
  
  if (currentPage === 'task-manager') {
    if (!user) return (
      <div className={pageBg}>
        <button onClick={() => setCurrentPage('home')} className="mb-6 text-slate-500">← Back</button>
        <LoginView email={email} setEmail={setEmail} password={password} setPassword={setPassword} authMode={authMode} setAuthMode={setAuthMode} handleAuth={handleAuth} />
      </div>
    );
    return (
      <div className={pageBg}>
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => setCurrentPage('home')} className="text-slate-500">← Back</button>
          <button onClick={() => signOut(auth)} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded">Logout</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <h3 className="font-bold mb-4">New Private Task</h3>
            <form onSubmit={handleAddTask}>
              <input type="text" placeholder="Task description..." value={subject} onChange={(e)=>setSubject(e.target.value)} className={inputClass} required />
              <button type="submit" className={buttonClass}>Save to Cloud</button>
            </form>
          </div>
          <div className="space-y-3">
            <h3 className="font-bold text-slate-400 uppercase text-xs">Your Secure Tasks</h3>
            {tasks.map(t => (
              <div key={t.id} className="bg-white p-4 rounded-xl border flex justify-between">
                <span className="font-medium">{t.subject}</span>
                <button onClick={() => deleteDoc(doc(db, 'tasks', t.id))} className="text-red-400 text-xs hover:underline">Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // HOME DASHBOARD
  return (
    <div className={pageBg}>
      <h1 className="text-3xl font-black mb-10 border-b pb-6">My Workspace</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={() => setCurrentPage('la-pool')} className="bg-white p-8 rounded-3xl border border-slate-200 cursor-pointer hover:shadow-xl transition-all">
          <h2 className="text-xl font-bold text-blue-600">LA Pool</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">Public Tool</p>
        </div>
        <div onClick={() => setCurrentPage('gp-overview')} className="bg-white p-8 rounded-3xl border border-slate-200 cursor-pointer hover:shadow-xl transition-all">
          <h2 className="text-xl font-bold text-emerald-600">GP Overview</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">Public Tool</p>
        </div>
        <div onClick={() => setCurrentPage('task-manager')} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 cursor-pointer hover:shadow-2xl transition-all group">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold text-white">Task Manager</h2>
            <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-black">PRIVATE</span>
          </div>
          <p className="text-slate-400 text-sm mt-1">Cloud Sync Enabled</p>
        </div>
      </div>
    </div>
  );
}
