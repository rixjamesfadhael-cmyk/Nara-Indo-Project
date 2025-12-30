import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  query,
  orderBy
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  DollarSign, 
  LogOut, 
  X, 
  Plus, 
  TrendingUp, 
  Activity, 
  Building2, 
  Package, 
  HardHat, 
  MapPin, 
  ShoppingCart, 
  AlertCircle,
  ChevronRight,
  Wallet,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Truck,
  Wrench,
  Archive,
  FileCheck,
  MoreHorizontal,
  ArrowRight,
  History,
  Pencil,
  RotateCcw
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Filler,
  BarElement
} from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';

// --- Register ChartJS ---
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Filler,
  BarElement
);

// --- Firebase Configuration ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Constants ---
const PROJECT_TYPES = { CONSTRUCTION: 'konstruksi', PROCUREMENT: 'pengadaan' };
const CONSTRUCTION_PHASES = ['Survei', 'Perencanaan', 'Pelaksanaan', 'Pengawasan'];
const PROCUREMENT_PHASES = ['Persiapan/Spek', 'Pemilihan/Tender', 'Kontrak/PO', 'Produksi/Fabrikasi', 'Pengiriman/Logistik', 'Instalasi & Testing', 'Serah Terima (BAST)'];
// REVISI: Mengubah 'Termijn' menjadi 'Termin'
const PAYMENT_STATUSES = ['Belum Bayar', 'Uang Muka (DP)', 'Termin I', 'Termin II', 'Termin III', 'Pelunasan', 'Retensi'];
const PIC_LIST = [
  { id: 1, name: 'Fadhael Rixi', role: 'Direktur' },
  { id: 2, name: 'M. Irhas Atamil Putra', role: 'Comanditer' }
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
};

// --- Components ---

const LoginScreen = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (password !== 'nara') {
      setError('Password salah.');
      return;
    }
    onLogin({ name, role: 'Director' });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans selection:bg-blue-500 selection:text-white">
      <div className="bg-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-800 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

        <div className="flex flex-col items-center mb-10 relative z-10">
          <div className="bg-blue-600 p-5 rounded-2xl mb-4 shadow-xl shadow-blue-500/20 ring-4 ring-blue-500/10">
            <Building2 className="text-white w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">NARA INDO</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-1">Enterprise Portal</p>
        </div>
        {error && <div className="mb-6 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-[10px] font-bold uppercase tracking-wide text-center flex items-center justify-center gap-2"><AlertCircle size={14}/>{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          <div className="space-y-1">
             <label className="text-[9px] font-bold text-slate-500 uppercase ml-2">Username</label>
             <input type="text" required placeholder="Enter ID" className="w-full px-5 py-4 bg-slate-800 border border-slate-700/50 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600 text-sm font-medium" onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
             <label className="text-[9px] font-bold text-slate-500 uppercase ml-2">Password</label>
             <input type="password" required placeholder="••••••••" className="w-full px-5 py-4 bg-slate-800 border border-slate-700/50 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600 text-sm font-medium" onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 uppercase mt-4 active:scale-[0.98]">Access Portal</button>
        </form>
      </div>
    </div>
  );
};

const ProjectModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: '', client: '', type: PROJECT_TYPES.CONSTRUCTION, phase: '',
    paymentStatus: PAYMENT_STATUSES[0], location: '', description: '',
    budget: '', startDate: '', endDate: '', progress: 0, vendor: '',
    picId: PIC_LIST[0].id,
    procurementMethod: 'E-Purchasing', 
    resources: { workers: 0, tools: 0, materials: 0 },
    phaseHistory: [] 
  });

  useEffect(() => {
    if (initialData) {
      setFormData({ 
        ...initialData, 
        resources: {
            workers: initialData.resources?.workers || 0,
            tools: initialData.resources?.tools || 0,
            materials: initialData.resources?.materials || 0
        },
        phaseHistory: initialData.phaseHistory || []
      });
    } else {
      setFormData({ 
        name: '', client: '', type: PROJECT_TYPES.CONSTRUCTION, phase: CONSTRUCTION_PHASES[0],
        paymentStatus: PAYMENT_STATUSES[0], location: '', description: '', budget: '', 
        startDate: '', endDate: '', progress: 0, vendor: '', procurementMethod: 'E-Purchasing', 
        picId: PIC_LIST[0].id,
        resources: { workers: 0, tools: 0, materials: 0 },
        phaseHistory: []
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 font-sans">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300 no-scrollbar">
        <div className="p-8 border-b flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex flex-col">
            <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight">Formulir Proyek</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {initialData ? 'Edit Data Proyek' : 'Input Data Baru'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-900"><X /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => setFormData({...formData, type: PROJECT_TYPES.CONSTRUCTION, phase: CONSTRUCTION_PHASES[0]})} className={`p-4 rounded-2xl border-2 transition-all font-bold text-xs flex items-center justify-center gap-2 ${formData.type === 'konstruksi' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}><HardHat size={16}/> KONSTRUKSI</button>
            <button type="button" onClick={() => setFormData({...formData, type: PROJECT_TYPES.PROCUREMENT, phase: PROCUREMENT_PHASES[0]})} className={`p-4 rounded-2xl border-2 transition-all font-bold text-xs flex items-center justify-center gap-2 ${formData.type === 'pengadaan' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}><ShoppingCart size={16}/> PENGADAAN</button>
          </div>
           
          <div className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nama Paket Pekerjaan</label>
              <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1.5"><UserCheck size={10} className="text-blue-500"/> Personil Penanggung Jawab</label>
              <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-900" value={formData.picId} onChange={e => setFormData({...formData, picId: Number(e.target.value)})}>
                {PIC_LIST.map(pic => <option key={pic.id} value={pic.id}>{pic.name} - {pic.role}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Client / Instansi</label>
                <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Lokasi Pekerjaan</label>
                <input required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-dashed border-slate-200">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1.5"><Calendar size={10} className="text-blue-500"/> Tanggal Mulai</label>
                <input type="date" required className="w-full p-3 bg-white border border-slate-100 rounded-xl outline-none text-sm font-medium" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1.5"><Calendar size={10} className="text-red-500"/> Tanggal Selesai</label>
                <input type="date" required className="w-full p-3 bg-white border border-slate-100 rounded-xl outline-none text-sm font-medium" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fase Pekerjaan</label>
                <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={formData.phase} onChange={e => setFormData({...formData, phase: e.target.value})}>
                  {(formData.type === 'konstruksi' ? CONSTRUCTION_PHASES : PROCUREMENT_PHASES).map(ph => <option key={ph} value={ph}>{ph}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Status Pembayaran</label>
                <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={formData.paymentStatus} onChange={e => setFormData({...formData, paymentStatus: e.target.value})}>
                  {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nilai Kontrak (IDR)</label>
                <input type="number" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={formData.budget} onChange={e => setFormData({...formData, budget: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Progress Fisik (%)</label>
                <input type="number" min="0" max="100" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={formData.progress} onChange={e => setFormData({...formData, progress: Number(e.target.value)})} />
                <p className="text-[9px] text-emerald-600 font-bold mt-1 ml-1 flex items-center gap-1">
                    <CheckCircle2 size={10} />
                    {formData.progress === 100 ? 'Proyek akan ditandai Selesai' : 'Input progress aktual'}
                </p>
              </div>
            </div>

            {formData.phaseHistory && formData.phaseHistory.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-200 pb-2 mb-3">Riwayat Penyelesaian Fase</h4>
                    <div className="space-y-2">
                        {formData.phaseHistory.map((history, idx) => (
                            <div key={`modal-hist-${idx}`} className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                <div className="bg-emerald-100 text-emerald-600 p-1 rounded-full"><CheckCircle2 size={12}/></div>
                                <span>{history.phase}</span>
                                <span className="ml-auto text-[10px] text-slate-400 font-medium">Selesai</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-200 pb-2">Alokasi Sumber Daya</h4>
                <div className="grid grid-cols-2 gap-4">
                    {formData.type === PROJECT_TYPES.CONSTRUCTION ? (
                        <>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Personil (Org)</label>
                                <input type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium" 
                                    value={formData.resources.workers} 
                                    onChange={e => setFormData({...formData, resources: {...formData.resources, workers: Number(e.target.value)}})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Alat Berat (Unit)</label>
                                <input type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium" 
                                    value={formData.resources.tools} 
                                    onChange={e => setFormData({...formData, resources: {...formData.resources, tools: Number(e.target.value)}})} />
                            </div>
                        </>
                    ) : (
                        <div className="col-span-2 space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Volume Material (Unit/Paket)</label>
                            <input type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium" 
                                value={formData.resources.materials} 
                                onChange={e => setFormData({...formData, resources: {...formData.resources, materials: Number(e.target.value)}})} />
                        </div>
                    )}
                </div>
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button type="button" onClick={onClose} className="px-6 py-3 font-bold text-slate-400 text-xs hover:text-slate-600 transition-all">BATAL</button>
            <button type="submit" className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95">
                {initialData ? 'UPDATE DATA' : 'SIMPAN DATA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
      else await signInAnonymously(auth);
    };
    initAuth();
    return onAuthStateChanged(auth, setCurrentUser);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'projects'));
    return onSnapshot(q, (s) => setProjects(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => console.error("Data fetch error:", err));
  }, [currentUser]);

  const handleSaveProject = async (data) => {
    let finalData = { ...data };
    finalData.updatedAt = new Date().toISOString();
    
    // Auto Phase Advance logic
    if (finalData.progress === 100) {
        const phaseList = finalData.type === PROJECT_TYPES.CONSTRUCTION ? CONSTRUCTION_PHASES : PROCUREMENT_PHASES;
        const currentPhaseIndex = phaseList.indexOf(finalData.phase);
        
        // Only advance phase if it's NOT the last phase
        if (currentPhaseIndex !== -1 && currentPhaseIndex < phaseList.length - 1) {
            const nextPhase = phaseList[currentPhaseIndex + 1];
            
            const historyEntry = {
                phase: finalData.phase,
                completedAt: new Date().toISOString(),
                notes: 'Selesai otomatis'
            };
            
            finalData.phase = nextPhase;
            finalData.progress = 0;
            finalData.phaseHistory = [...(data.phaseHistory || []), historyEntry];
        }
        // If it IS the last phase, progress stays at 100% and it effectively becomes "Archived/Completed"
    }

    if (editingProject) {
        // If editing an archived project and reducing progress < 100, it effectively un-archives it
        // because the filter checks `progress < 100` for active projects.
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', editingProject.id), finalData);
    } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'projects'), { ...finalData, createdAt: serverTimestamp(), ownerId: currentUser.uid });
    }
    
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const activeProjects = useMemo(() => projects.filter(p => p.progress < 100), [projects]);
  const archivedProjects = useMemo(() => projects.filter(p => p.progress === 100), [projects]);
  
  const historyLogs = useMemo(() => {
    const logs = [];
    projects.forEach(p => {
      // Log for intermediate phases
      if (p.phaseHistory && Array.isArray(p.phaseHistory)) {
        p.phaseHistory.forEach(h => {
          logs.push({
            id: `PHASE-${p.id}-${h.phase}-${h.completedAt}`,
            type: 'PHASE',
            projectId: p.id,
            projectName: p.name,
            client: p.client,
            phase: h.phase,
            date: h.completedAt,
            picId: p.picId
          });
        });
      }
      
      // Log for final completion (Current status is 100%)
      if (p.progress === 100) {
         logs.push({
            id: `PROJECT-${p.id}-COMPLETE`,
            type: 'PROJECT',
            projectId: p.id,
            projectName: p.name,
            client: p.client,
            phase: p.phase,
            date: p.updatedAt || new Date().toISOString(),
            picId: p.picId
         });
      }
    });
    
    return logs.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [projects]);

  const totals = useMemo(() => {
    const totalPagu = activeProjects.reduce((a, b) => a + (Number(b.budget) || 0), 0);
    const totalPaid = activeProjects.reduce((a, b) => b.paymentStatus === 'Pelunasan' ? a + (Number(b.budget) || 0) : a, 0);
    const outstanding = totalPagu - totalPaid;
    
    const totalWorkers = activeProjects.reduce((a, b) => a + (Number(b.resources?.workers) || 0), 0);
    const totalTools = activeProjects.reduce((a, b) => a + (Number(b.resources?.tools) || 0), 0);
    const totalMaterials = activeProjects.reduce((a, b) => a + (Number(b.resources?.materials) || 0), 0);

    return { 
      pagu: totalPagu, outstanding, paid: totalPaid,
      count: activeProjects.length,
      avgProgress: activeProjects.length ? (activeProjects.reduce((a, b) => a + (Number(b.progress) || 0), 0) / activeProjects.length).toFixed(1) : 0,
      resources: { workers: totalWorkers, tools: totalTools, materials: totalMaterials }
    };
  }, [activeProjects]);

  const timingAnalysis = useMemo(() => {
    const today = new Date();
    return activeProjects.map(p => {
      const end = new Date(p.endDate);
      const start = new Date(p.startDate);
      const totalDuration = end - start;
      const elapsed = today - start;
      
      const expectedProgress = totalDuration > 0 ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 0;
      const variance = p.progress - expectedProgress;
      
      let status = 'ON TRACK';
      let statusColor = 'text-emerald-500';
      let statusBg = 'bg-emerald-50';
      
      if (variance < -15) { 
          status = 'CRITICAL DELAY'; 
          statusColor = 'text-red-500'; 
          statusBg = 'bg-red-50';
      } else if (variance < 0) { 
          status = 'SLIGHT DELAY'; 
          statusColor = 'text-amber-500'; 
          statusBg = 'bg-amber-50';
      }

      return { ...p, expectedProgress, variance, status, statusColor, statusBg };
    });
  }, [activeProjects]);

  const pieData = {
    labels: ['Konstruksi', 'Pengadaan'],
    datasets: [{
      data: [activeProjects.filter(p => p.type === 'konstruksi').length, activeProjects.filter(p => p.type === 'pengadaan').length],
      backgroundColor: ['#2563eb', '#6366f1'],
      hoverOffset: 15,
      borderWidth: 0
    }]
  };

  const lineData = {
    labels: activeProjects.slice(0, 7).map(p => p.name.length > 12 ? p.name.substring(0, 10) + '..' : p.name),
    datasets: [{
      label: 'Progress Fisik (%)',
      data: activeProjects.slice(0, 7).map(p => p.progress),
      borderColor: '#3b82f6',
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        return gradient;
      },
      fill: true,
      tension: 0.4,
      pointRadius: 6,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#3b82f6',
      pointBorderWidth: 2
    }]
  };

  if (!userProfile) return <LoginScreen onLogin={setUserProfile} />;

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans text-slate-600 selection:bg-blue-200">
      {/* REVISI: Menambahkan style global untuk menghilangkan scrollbar tapi tetap bisa di-scroll */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>

      <aside className="w-24 hover:w-72 bg-slate-950 text-white flex flex-col shrink-0 transition-all duration-300 ease-in-out group z-50 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-900 flex flex-col items-center gap-3 shrink-0">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="text-center w-0 group-hover:w-auto opacity-0 group-hover:opacity-100 overflow-hidden whitespace-nowrap transition-all duration-300">
            <h1 className="font-black text-lg tracking-tight">NARA INDO</h1>
            <p className="text-[8px] text-slate-500 uppercase tracking-[0.6em] font-bold">Strategic Systems</p>
          </div>
        </div>
        {/* REVISI: Menambahkan class no-scrollbar */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto overflow-x-hidden no-scrollbar">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'projects', icon: Briefcase, label: 'Proyek' },
            { id: 'resources', icon: Users, label: 'Sumber Daya' },
            { id: 'performance', icon: TrendingUp, label: 'Performa' },
            { id: 'history', icon: History, label: 'Histori' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center justify-center group-hover:justify-start gap-4 px-3 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:text-white hover:bg-slate-900'}`}>
              <div className="shrink-0"><item.icon size={20} /></div>
              <span className="w-0 group-hover:w-auto opacity-0 group-hover:opacity-100 overflow-hidden whitespace-nowrap transition-all duration-300 delay-75">
                {item.label}
              </span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-slate-900 shrink-0 overflow-hidden">
          <div className="bg-slate-900 rounded-2xl p-3 mb-4 flex items-center justify-center group-hover:justify-start gap-0 group-hover:gap-3 transition-all">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-black shrink-0">{userProfile.name.substring(0,2).toUpperCase()}</div>
              <div className="w-0 group-hover:w-auto opacity-0 group-hover:opacity-100 overflow-hidden whitespace-nowrap transition-all duration-300">
                  <p className="text-[10px] font-bold text-white uppercase">{userProfile.name}</p>
                  <p className="text-[9px] text-slate-500 uppercase">Director</p>
              </div>
          </div>
          <button onClick={() => setUserProfile(null)} className="flex items-center justify-center group-hover:justify-start gap-0 group-hover:gap-3 text-red-500 font-black text-[9px] uppercase tracking-widest mx-auto hover:text-red-400 transition-all w-full">
            <LogOut size={16} className="shrink-0" />
            <span className="w-0 group-hover:w-auto opacity-0 group-hover:opacity-100 overflow-hidden whitespace-nowrap transition-all duration-300">SIGN OUT</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] overflow-hidden relative">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b px-10 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div>
            <h2 className="font-black text-slate-900 text-xl tracking-tight uppercase flex items-center gap-2 text-capitalize">
                {activeTab}
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Real-time Data Control</p>
          </div>
          <button onClick={() => { setEditingProject(null); setIsModalOpen(true); }} className="bg-slate-950 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-slate-800 transition-all active:scale-95">
            <Plus size={16} /> Data Baru
          </button>
        </header>

        {/* REVISI: Mengganti class custom-scrollbar dengan no-scrollbar */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar space-y-8 pb-32">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Briefcase size={18}/></div>
                  <div className="min-w-0">
                    <h4 className="text-2xl font-black text-slate-900 leading-none mb-1">{totals.count}</h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Pekerjaan Aktif</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4"><DollarSign size={18}/></div>
                  <div className="min-w-0">
                    <h4 className="text-xl font-black text-slate-900 leading-none mb-1 truncate" title={formatCurrency(totals.pagu)}>{formatCurrency(totals.pagu)}</h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Total Portofolio Aktif</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between ring-2 ring-red-500/5 hover:shadow-md transition-all">
                  <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4"><AlertCircle size={18}/></div>
                  <div className="min-w-0">
                    <h4 className="text-xl font-black text-red-600 leading-none mb-1 truncate" title={formatCurrency(totals.outstanding)}>{formatCurrency(totals.outstanding)}</h4>
                    <p className="text-[9px] font-black text-red-400 uppercase tracking-widest truncate">Dana Tertahan</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4"><Activity size={18}/></div>
                  <div className="min-w-0">
                    <h4 className="text-2xl font-black text-slate-900 leading-none mb-1">{totals.avgProgress}%</h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">Rata-rata Fisik</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h5 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-8">Kategori Proyek</h5>
                  <div className="aspect-square flex items-center justify-center p-4">
                    <Pie data={pieData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'sans-serif', size: 10 } } } } }} />
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm lg:col-span-2">
                    <div className="flex justify-between items-center mb-8">
                        <h5 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Progress Monitoring</h5>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Realisasi</span>
                        </div>
                    </div>
                    <div className="w-full h-[300px]">
                        <Line data={lineData} options={{ maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100, grid: { borderDash: [4, 4], color: '#f1f5f9' }, ticks: { font: { size: 10 } } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } }, plugins: { legend: { display: false } } }} />
                    </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Archive size={48} className="mb-4 opacity-50"/>
                        <p className="font-bold text-sm">Tidak ada proyek aktif</p>
                    </div>
                ) : (
                    activeProjects.map(project => (
                        <div key={project.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button onClick={() => { setEditingProject(project); setIsModalOpen(true); }} className="bg-slate-100 p-3 rounded-xl hover:bg-slate-900 hover:text-white transition-colors shadow-sm">
                                    <Pencil size={16}/>
                                </button>
                            </div>
                            <div className="flex flex-col md:flex-row gap-6 md:items-center">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${project.type === 'konstruksi' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                    {project.type === 'konstruksi' ? <HardHat size={24}/> : <ShoppingCart size={24}/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-3 mb-1">
                                        <h3 className="text-lg font-black text-slate-900 truncate max-w-full" title={project.name}>{project.name}</h3>
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${project.type === 'konstruksi' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>{project.type}</span>
                                    </div>
                                    <p className="text-xs font-medium text-slate-500 flex flex-wrap items-center gap-2">
                                        <span className="flex items-center gap-1 truncate"><Building2 size={12}/> {project.client}</span>
                                        <span className="text-slate-300 hidden sm:inline">|</span> 
                                        <span className="flex items-center gap-1 truncate"><MapPin size={12}/> {project.location}</span>
                                    </p>
                                </div>
                                <div className="w-full md:w-auto shrink-0 flex flex-row md:flex-col gap-4 md:gap-0 justify-between md:items-end">
                                    {/* Progress Bar Container */}
                                    <div className="w-1/2 md:w-48 order-2 md:order-1">
                                        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wide">
                                            <span>Progress</span>
                                            <span>{project.progress}%</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${project.progress}%` }}></div>
                                        </div>
                                    </div>
                                    
                                    {/* Value & Status */}
                                    <div className="w-1/2 md:w-48 flex flex-col items-start md:items-end order-1 md:order-2">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nilai Kontrak</span>
                                        <span className="text-sm font-black text-slate-900 truncate max-w-full" title={formatCurrency(project.budget)}>{formatCurrency(project.budget)}</span>
                                        <span className={`mt-1 text-[9px] font-bold px-2 py-0.5 rounded border ${project.paymentStatus === 'Pelunasan' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-amber-200 bg-amber-50 text-amber-600'}`}>
                                            {project.paymentStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-50 flex flex-wrap gap-4 text-[10px] font-bold text-slate-500">
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
                                    <Calendar size={12} className="text-blue-500"/> Mulai: {project.startDate}
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg truncate max-w-[200px]">
                                    <UserCheck size={12} className="text-indigo-500"/> PIC: {PIC_LIST.find(p => p.id === project.picId)?.name || 'N/A'}
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg ml-auto">
                                    <Activity size={12} className="text-slate-400"/> Fase: <span className="text-slate-900 truncate">{project.phase}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
          )}

          {activeTab === 'resources' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/10 transition-all"></div>
                        <Users size={32} className="mb-6 opacity-80"/>
                        <h3 className="text-4xl font-black mb-1">{totals.resources.workers}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Total Personil Lapangan</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6"><Truck size={24}/></div>
                        <h3 className="text-3xl font-black text-slate-900 mb-1">{totals.resources.tools}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alat Berat Terdeploy</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6"><Package size={24}/></div>
                        <h3 className="text-3xl font-black text-slate-900 mb-1">{totals.resources.materials}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Volume Material (Unit)</p>
                    </div>
                </div>
                
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-50">
                        <h3 className="font-black text-lg text-slate-900">Distribusi Sumber Daya</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Per Proyek Aktif</p>
                    </div>
                    {/* REVISI: Menambahkan class no-scrollbar */}
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                <tr>
                                    <th className="p-6">Proyek</th>
                                    <th className="p-6 text-center">Personil</th>
                                    <th className="p-6 text-center">Alat Berat</th>
                                    <th className="p-6 text-center">Material</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {activeProjects.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-6 font-bold text-slate-700 text-sm">{p.name}</td>
                                        <td className="p-6 text-center font-medium text-slate-600">{p.resources?.workers || '-'}</td>
                                        <td className="p-6 text-center font-medium text-slate-600">{p.resources?.tools || '-'}</td>
                                        <td className="p-6 text-center font-medium text-slate-600">{p.resources?.materials || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
             </div>
          )}

          {activeTab === 'performance' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8">
                        <h3 className="font-black text-lg text-slate-900">Analisis Jadwal (S-Curve Variance)</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deviasi Rencana vs Realisasi</p>
                    </div>
                    <div className="grid gap-4 p-8 pt-0">
                        {timingAnalysis.map(item => (
                            <div key={item.id} className="flex flex-col md:flex-row gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-800 text-sm truncate">{item.name}</h4>
                                    <div className="flex flex-wrap gap-4 mt-2">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-400 uppercase">Realisasi</span>
                                            <span className="text-xs font-bold text-blue-600">{item.progress.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-400 uppercase">Rencana</span>
                                            <span className="text-xs font-bold text-slate-500">{item.expectedProgress.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-400 uppercase">Deviasi</span>
                                            <span className={`text-xs font-bold ${item.variance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {item.variance > 0 ? '+' : ''}{item.variance.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 ${item.statusBg} ${item.statusColor}`}>
                                    {item.status}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 py-4">
                    {historyLogs.length === 0 && <p className="pl-8 text-slate-400 italic text-sm">Belum ada riwayat aktivitas.</p>}
                    {historyLogs.map((log) => (
                        <div key={log.id} className="relative pl-8">
                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${log.type === 'PROJECT' ? 'bg-blue-600' : 'bg-emerald-500'}`}></div>
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded ${log.type === 'PROJECT' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {log.type === 'PROJECT' ? 'Proyek Selesai' : 'Fase Selesai'}
                                    </span>
                                    
                                    {/* Action Buttons for History Items */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-medium text-slate-400">{new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                        {log.type === 'PROJECT' && (
                                            <button 
                                                onClick={() => {
                                                    const proj = projects.find(p => p.id === log.projectId);
                                                    if (proj) {
                                                        setEditingProject(proj);
                                                        setIsModalOpen(true);
                                                    }
                                                }}
                                                className="ml-2 p-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-lg text-slate-400 transition-colors"
                                                title="Edit / Reaktivasi Proyek"
                                            >
                                                <Pencil size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <h4 className="font-bold text-slate-800 break-words">{log.projectName}</h4>
                                <p className="text-xs text-slate-500 mt-1">
                                    {log.type === 'PROJECT' 
                                        ? `Proyek telah diserahterimakan kepada ${log.client}.` 
                                        : `Menyelesaikan fase ${log.phase} untuk ${log.client}.`}
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 p-2 rounded-lg inline-flex max-w-full">
                                    <UserCheck size={12}/> PIC: {PIC_LIST.find(p => p.id === log.picId)?.name}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

        </div>
        
        {/* Modal is placed here to be on top of everything */}
        <ProjectModal 
            isOpen={isModalOpen} 
            onClose={() => { setIsModalOpen(false); setEditingProject(null); }} 
            onSubmit={handleSaveProject}
            initialData={editingProject}
        />
      </main>
    </div>
  );
}