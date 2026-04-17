import React, { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
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

// --- STYLES ---
const pageBg = "min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800";
const cardClass = "bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all";
const buttonClass = "w-full bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-sm hover:bg-blue-700 transition-all active:scale-95";
const inputClass = "w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-4 text-slate-700";

// --- SUB-COMPONENTS (Moved outside to fix the focus bug) ---

const LoginView = ({ email, setEmail, password, setPassword, authMode, setAuthMode, handleAuth }) => (
  <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl border border-slate-200 mt-10 animate-in fade-in zoom-in duration-300">
    <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Private Access</h1>
    <p className="text-slate-500 mb-8 text-sm">{authMode === 'login' ? 'Login to manage your tasks' : 'Create a private account'}</p>
    <form onSubmit={handleAuth}>
      <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} className={inputClass} required />
      <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} className={inputClass} required />
      <button type="submit" className={buttonClass}>{authMode === 'login' ? 'Login' : 'Sign Up'}</button>
    </form>
    <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="w-full mt-4 text-sm text-blue-600 font-medium hover:underline text-center block">
      {authMode === 'login' ? "Need an account? Sign Up" : "Already have an account? Login"}
    </button>
  </div>
);

const LAPool = ({ setCurrentPage }) => {
  const [total, setTotal] = useState(1000);
  const [ratio, setRatio] = useState(70);
  const partA = (total * (ratio / 100)).toFixed(2);
  const partB = (total - partA).toFixed(2);

  return (
    <div className={pageBg}>
      <button onClick={() => setCurrentPage('home')} className="mb-6 text-slate-500 hover:text-slate-900">← Back</button>
      <h2 className="text-3xl font-bold mb-6">LA Pool Calculator</h2>
      <div className={`${cardClass} max-w-lg`}>
        <label className="block text-sm font-bold mb-2">Total Volume</label>
        <input type="number" value={total} onChange={(e)=>setTotal(e.target.value)} className={inputClass} />
        <label className="block text-sm font-bold mb-2">Part A Percentage ({ratio}%)</label>
        <input type="range" min="0" max="100" value={ratio} onChange={(e)=>setRatio(e.target.value)} className="w-full mb-6" />
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-600 font-bold uppercase">Part A</p>
            <p className="text-2xl font-black text-blue-900">{partA}</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-xs text-indigo-600 font-bold uppercase">Part B</p>
            <p className="text-2xl font-black text-indigo-900">{partB}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const GPOverview = ({ setCurrentPage }) => {
  const [skus, setSkus] = useState([
    { id: 1, name: 'Item A', qty: 10, price: 50 },
    { id: 2, name: 'Item B', qty: 5, price: 120 }
  ]);

  const totalValue = skus.reduce((sum, item) => sum + (item.qty * item.price), 0);

  const chartData = {
    labels: skus.map(s => s.name),
    datasets: [{
      label: 'Value',
      data: skus.map(s => s.qty * s.price),
      backgroundColor: ['#3b82f6', '#818cf8', '#6366f1', '#4f46e5'],
      borderRadius: 8
    }]
  };

  return (
    <div className={pageBg}>
      <button onClick={() => setCurrentPage('home')} className="mb-6 text-slate-500 hover:text-slate-900">← Back</button>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold">GP Overview</h2>
          <p className="text-slate-500">Inventory value tracking</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Portfolio Value</p>
          <p className="text-3xl font-black text-slate-900">${totalValue.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={cardClass}>
          <h3 className="font-bold mb-4">SKU List</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-slate-400 uppercase border-b border-slate-100">
                <th className="pb-2">Name</th>
                <th className="pb-2">Qty</th>
                <th className="pb-2 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {skus.map(s => (
                <tr key={s.id}>
                  <td className="py-3 font-medium">{s.name}</td>
                  <td className="py-3 text-slate-500">{s.qty}</td>
                  <td className="py-3 text-right font-bold">${s.qty * s.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={cardClass}>
          <h3 className="font-bold mb-4">Value Distribution</h3>
          <div className="h-64">
            <Bar data={chartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
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
  const [taskSid, setTaskSid] = useState('');

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Task Listener
  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }
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

  const handleLogout = () => {
    signOut(auth);
    setEmail('');
    setPassword('');
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!subject) return;
    await addDoc(collection(db, 'tasks'), {
      userId: user.uid,
      userEmail: user.email,
      subject,
      accountSid: taskSid || 'N/A',
      completed: false,
      createdAt: new Date().toISOString()
    });
    setSubject(''); setTaskSid('');
  };

  // --- ROUTER RENDERING ---

  if (currentPage === 'la-pool') return <LAPool setCurrentPage={setCurrentPage} />;
  if (currentPage === 'gp-overview') return <GPOverview setCurrentPage={setCurrentPage} />;
  
  if (currentPage === 'task-manager') {
    if (!user) return (
      <div className={pageBg}>
        <button onClick={() => setCurrentPage('home')} className="mb-6 text-slate-500">← Back</button>
        <LoginView 
          email={email} setEmail={setEmail} 
          password={password} setPassword={setPassword} 
          authMode={authMode} setAuthMode={setAuthMode} 
          handleAuth={handleAuth} 
        />
      </div>
    );

    return (
      <div className={pageBg}>
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => setCurrentPage('home')} className="text-slate-500">← Back</button>
          <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-400 pl-2 uppercase">{user.email}</span>
            <button onClick={handleLogout} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100">Logout</button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className={cardClass}>
            <h3 className="font-bold mb-4">Add Task</h3>
            <form onSubmit={handleAddTask}>
              <input type="text" placeholder="Subject" value={subject} onChange={(e)=>setSubject(e.target.value)} className={inputClass} required />
              <input type="text" placeholder="Account SID (Optional)" value={taskSid} onChange={(e)=>setTaskSid(e.target.value)} className={inputClass} />
              <button type="submit" className={buttonClass}>Save to Cloud</button>
            </form>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-slate-400 uppercase text-xs">Your Private Tasks ({tasks.length})</h3>
            {tasks.length === 0 ? (
              <div className="text-center py-20 bg-slate-100/50 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400">No tasks found. Add your first one!</p>
              </div>
            ) : tasks.map(t => (
              <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center group hover:border-blue-300 transition-colors">
                <div>
                  <p className="font-bold text-slate-800">{t.subject}</p>
                  <p className="text-xs text-slate-400">SID: {t.accountSid}</p>
                </div>
                <button onClick={() => deleteDoc(doc(db, 'tasks', t.id))} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
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
      <header className="mb-12 border-b border-slate-200 pb-8">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Workspace<span className="text-blue-600">.</span></h1>
        <p className="text-slate-500 font-medium mt-2">Professional suite for data and productivity.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={() => setCurrentPage('la-pool')} className="bg-white p-8 rounded-3xl border border-slate-200 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 font-bold">LA</div>
          <h2 className="text-xl font-bold">LA Pool</h2>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">Public calculator for volume and percentage allocations.</p>
        </div>
        
        <div onClick={() => setCurrentPage('gp-overview')} className="bg-white p-8 rounded-3xl border border-slate-200 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-6 text-green-600 font-bold">GP</div>
          <h2 className="text-xl font-bold">GP Overview</h2>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">Public SKU tracking, analytics, and performance charts.</p>
        </div>

        <div onClick={() => setCurrentPage('task-manager')} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl group-hover:bg-blue-600/20 transition-all"></div>
          <span className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded-full font-black tracking-widest uppercase mb-6 inline-block">Secure</span>
          <h2 className="text-xl font-bold text-white mt-2">Task Manager</h2>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">Private cloud sync for your personal workflow tasks.</p>
        </div>
      </div>
    </div>
  );
}
