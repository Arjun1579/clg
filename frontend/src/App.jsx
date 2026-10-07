import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';
import { Activity, Stethoscope, LayoutDashboard, Database, AlertCircle, Search, Clock, Users, FileText, ChevronRight, ActivitySquare, ShieldAlert } from 'lucide-react';

const api = axios.create({ baseURL: 'http://localhost:8000' });

function App() {
  const [activeTab, setActiveTab] = useState('clinician');

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-20 relative">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-blue-600 p-2 rounded-lg">
            <ActivitySquare size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Nexus Health</h1>
            <p className="text-xs text-blue-400 font-medium tracking-wide uppercase">Intelligence Platform</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItem active={activeTab === 'clinician'} onClick={() => setActiveTab('clinician')} icon={<Stethoscope size={20} />} label="Clinician AI Portal" />
          <NavItem active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={<LayoutDashboard size={20} />} label="Hospital Analytics" />
          <NavItem active={activeTab === 'dbview'} onClick={() => setActiveTab('dbview')} icon={<Database size={20} />} label="Live SQL Viewer" />
        </nav>

        <div className="p-6 border-t border-slate-800 text-xs text-slate-500">
          <p>Version 2.0.4</p>
          <p>System Status: <span className="text-emerald-400">Online</span></p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        <header className="bg-white h-16 border-b border-slate-200 flex items-center px-8 shadow-sm z-10 sticky top-0">
          <h2 className="text-xl font-semibold text-slate-800">
            {activeTab === 'clinician' && "AI-Powered Patient Summarization"}
            {activeTab === 'admin' && "Hospital Population Analytics"}
            {activeTab === 'dbview' && "Database Architecture Viewer"}
          </h2>
        </header>
        <div className="p-8 pb-20">
          {activeTab === 'clinician' && <ClinicianView />}
          {activeTab === 'admin' && <AdminView />}
          {activeTab === 'dbview' && <DatabaseViewer />}
        </div>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {active && <ChevronRight size={16} className="ml-auto opacity-70" />}
    </button>
  );
}

// ---------------------------
// CLINICIAN VIEW
// ---------------------------
function ClinicianView() {
  const [patientId, setPatientId] = useState('1');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hipaaMode, setHipaaMode] = useState(false); // Module
  
  const handleGenerate = async () => {
    setLoading(true); setError(''); setData(null);
    try {
      const res = await api.get(`/api/patients/${patientId}/summary`);
      setData(res.data);
    } catch (err) {
      setError('Failed to fetch AI Summary. Make sure backend is running and Groq API key is correct in your .env file.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl xl:max-w-6xl mx-auto space-y-6">
      {/* HIPAA Privacy Toggle */}
      <div className="flex justify-end mb-2">
        <button 
          onClick={() => setHipaaMode(!hipaaMode)}
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-2 border transition-colors ${hipaaMode ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-white text-slate-500 border-slate-200'}`}
        >
          {hipaaMode ? <ShieldAlert size={14} /> : <Users size={14} />}
          HIPAA Privacy Mode: {hipaaMode ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-2 pl-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
        <Search className="text-slate-400" size={20} />
        <input 
          type="number" 
          value={patientId} 
          onChange={(e) => setPatientId(e.target.value)}
          className="flex-1 py-3 outline-none text-slate-700 bg-transparent placeholder-slate-400" 
          placeholder="Enter Patient ID (e.g. 1)"
        />
        <button 
          onClick={handleGenerate} disabled={loading}
          className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 font-medium transition-colors disabled:bg-blue-300 flex items-center gap-2"
        >
          {loading ? <Activity className="animate-spin" size={20} /> : <FileText size={20} />}
          {loading ? "Analyzing Records..." : "Synthesize Patient Record"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-3">
          <AlertCircle size={20} /> <p className="font-medium">{error}</p>
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Patient Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-sm text-slate-500 uppercase tracking-widest font-semibold mb-1">Patient Name</h3>
                <p className={`text-2xl font-bold text-slate-800 ${hipaaMode ? 'blur-sm select-none' : ''}`}>{data.patient.name}</p>
              </div>
              <div className="text-right">
                <h3 className="text-sm text-slate-500 uppercase tracking-widest font-semibold mb-1">Age</h3>
                <p className={`text-xl font-bold text-slate-700 ${hipaaMode ? 'blur-sm select-none' : ''}`}>{data.patient.age} Yrs</p>
              </div>
              <div className="text-right">
                <h3 className="text-sm text-slate-500 uppercase tracking-widest font-semibold mb-1">Readmission Risk</h3>
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase ${data.readmission_risk === 'High' ? 'bg-rose-100 text-rose-700' : data.readmission_risk === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {data.readmission_risk} Risk
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2">
                <FileText size={20} className="text-blue-600" />
                <h2 className="text-lg font-bold text-slate-800">Longitudinal Clinical Summary</h2>
              </div>
              <div className="p-6">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{data.ai_summary}</p>
              </div>
            </div>
            
            <div className={`rounded-2xl shadow-sm border overflow-hidden ${data.risk_flags.length > 0 ? 'border-rose-200 bg-white' : 'border-emerald-200 bg-emerald-50'}`}>
              <div className={`px-6 py-4 border-b flex items-center gap-2 ${data.risk_flags.length > 0 ? 'bg-rose-50 border-rose-100' : 'border-emerald-100'}`}>
                <ShieldAlert size={20} className={data.risk_flags.length > 0 ? 'text-rose-600' : 'text-emerald-600'} />
                <h2 className={`text-lg font-bold ${data.risk_flags.length > 0 ? 'text-rose-800' : 'text-emerald-800'}`}>
                  Detected Risk Flags & Conflicts
                </h2>
              </div>
              <div className="p-6">
                {data.risk_flags.length === 0 ? (
                  <p className="text-emerald-700 font-medium">No clinical risks or medication conflicts detected in this encounter.</p>
                ) : (
                  <ul className="space-y-4">
                    {data.risk_flags.map((flag, i) => (
                      <li key={i} className="bg-white p-5 rounded-xl border border-rose-100 shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
                        <p className="font-bold text-rose-700 text-lg mb-1">{flag.type}</p>
                        <p className="text-slate-800 mb-3">{flag.desc}</p>
                        <div className="bg-slate-50 px-3 py-2 rounded-lg inline-block border border-slate-100">
                          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Grounded Source</p>
                          <p className="text-sm text-slate-700 italic">{flag.source}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* LangGraph Trace Column */}
          <div className="lg:col-span-1">
            <div className="bg-[#0f172a] rounded-2xl shadow-xl border border-slate-700 overflow-hidden h-full flex flex-col">
              <div className="bg-[#1e293b] px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 tracking-wide uppercase">
                  <Activity size={16} className="text-emerald-400" /> LangGraph Trace
                </h2>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
              </div>
              <div className="p-6 font-mono text-sm text-slate-300 flex-1 overflow-y-auto leading-relaxed">
                <div className="mb-6">
                  <p className="text-blue-400 mb-2 text-xs uppercase font-bold tracking-wider">Agent Execution Path</p>
                  <div className="bg-[#1e293b] p-3 rounded-lg border border-slate-700 text-emerald-400">
                    {data.langgraph_trace.decision_path.split(' -> ').map((step, i, arr) => (
                      <span key={i}>
                        {step}
                        {i < arr.length - 1 && <span className="text-slate-500 mx-2">→</span>}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-purple-400 mb-2 text-xs uppercase font-bold tracking-wider">FAISS RAG Retrieval</p>
                  <p className="whitespace-pre-wrap bg-[#1e293b] p-4 rounded-lg border border-slate-700 text-slate-300">
                    {data.langgraph_trace.retrieved_guidelines}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------
// ADMIN VIEW
// ---------------------------
function AdminView() {
  const [metrics, setMetrics] = React.useState(null);
  
  React.useEffect(() => {
    api.get('/api/analytics/dashboard').then(res => setMetrics(res.data)).catch(console.error);
  }, []);

  if (!metrics) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  const deptNames = metrics.admissions_by_department.map(d => d.department);
  const deptCounts = metrics.admissions_by_department.map(d => d.count);
  const flagNames = metrics.flags_distribution.map(f => f.flag_type);
  const flagCounts = metrics.flags_distribution.map(f => f.count);
  
  // Module: Revenue Analytics
  const revDeptNames = metrics.revenue_by_department ? metrics.revenue_by_department.map(d => d.department) : [];
  const revAmounts = metrics.revenue_by_department ? metrics.revenue_by_department.map(d => d.total_revenue) : [];

  // Module: Admission Types
  const admTypeNames = metrics.admission_types ? metrics.admission_types.map(d => d.admission_type) : [];
  const admTypeCounts = metrics.admission_types ? metrics.admission_types.map(d => d.count) : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Admitted Patients" value={metrics.total_patients} icon={<Users className="text-blue-500" />} trend="+12% this month" />
        <KpiCard title="Average Length of Stay" value={`${metrics.average_length_of_stay_days} Days`} icon={<Clock className="text-amber-500" />} trend="-1.2 days vs avg" />
        <KpiCard title="Clinical Risk Flags" value={flagCounts.reduce((a, b) => a + b, 0)} icon={<ShieldAlert className="text-rose-500" />} trend="Needs attention" />
        <KpiCard title="Active Departments" value={deptNames.length} icon={<Activity className="text-emerald-500" />} trend="Fully operational" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Patient Volume */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Users size={20} className="text-blue-600" /> Patient Volume by Department
          </h2>
          <div className="flex justify-center">
            <Plot
              data={[{ type: 'bar', x: deptNames, y: deptCounts, marker: { color: '#3b82f6', borderRadius: 4 } }]}
              layout={{ width: 500, height: 280, margin: { t: 10, b: 40, l: 40, r: 10 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)' }}
              config={{ displayModeBar: false }}
            />
          </div>
        </div>

        {/* Revenue Analytics */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Database size={20} className="text-emerald-600" /> Revenue Analytics
          </h2>
          <div className="flex justify-center">
            <Plot
              data={[{ type: 'bar', x: revDeptNames, y: revAmounts, marker: { color: '#10b981', borderRadius: 4 } }]}
              layout={{ width: 500, height: 280, margin: { t: 10, b: 40, l: 60, r: 10 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)' }}
              config={{ displayModeBar: false }}
            />
          </div>
        </div>

        {/* Patient Flow / Admission Types */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <ActivitySquare size={20} className="text-purple-600" /> Patient Flow: Admission Types
          </h2>
          <div className="flex justify-center items-center h-[280px]">
             <Plot
                data={[{ type: 'pie', labels: admTypeNames, values: admTypeCounts, hole: 0.5, marker: { colors: ['#a855f7', '#ec4899', '#8b5cf6'] } }]}
                layout={{ width: 500, height: 280, margin: { t: 10, b: 10, l: 10, r: 10 }, paper_bgcolor: 'rgba(0,0,0,0)' }}
                config={{ displayModeBar: false }}
              />
          </div>
        </div>

        {/* Clinical Quality / Flags */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <ShieldAlert size={20} className="text-rose-600" /> Clinical Quality: Insight Flags
          </h2>
          <div className="flex justify-center items-center h-[280px]">
            {flagCounts.reduce((a, b) => a + b, 0) === 0 ? (
              <div className="text-center text-slate-400">
                <ShieldAlert size={48} className="mx-auto mb-3 opacity-20" />
                <p>No risk flags have been generated yet.</p>
                <p className="text-sm mt-1">Generate AI insights to populate this chart.</p>
              </div>
            ) : (
              <Plot
                data={[{ type: 'pie', labels: flagNames, values: flagCounts, hole: 0.5, marker: { colors: ['#ef4444', '#f59e0b', '#3b82f6'] } }]}
                layout={{ width: 500, height: 280, margin: { t: 10, b: 10, l: 10, r: 10 }, paper_bgcolor: 'rgba(0,0,0,0)' }}
                config={{ displayModeBar: false }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, trend }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">{title}</h3>
        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">{icon}</div>
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-400 mt-2 font-medium">{trend}</p>
      </div>
    </div>
  );
}

// ---------------------------
// DB VIEWER
// ---------------------------
function DatabaseViewer() {
  const [dbData, setDbData] = React.useState(null);
  
  React.useEffect(() => {
    api.get('/api/debug/database').then(res => setDbData(res.data)).catch(console.error);
  }, []);

  if (!dbData) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-[#0f172a] text-slate-300 rounded-2xl shadow-xl overflow-hidden font-mono text-sm border border-slate-700">
        <div className="bg-[#1e293b] px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
            <Database size={20} /> Live SQL Architecture
          </h2>
          <span className="bg-emerald-400/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-400/20">
            Connected: {dbData.engine}
          </span>
        </div>
        
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <DbTableCard name="patients" count={dbData.tables.patients_count} icon={<Users size={16}/>} />
            <DbTableCard name="encounters" count={dbData.tables.encounters_count} icon={<FileText size={16}/>} />
            <DbTableCard name="insight_flags" count={dbData.tables.insight_flags_count} icon={<ShieldAlert size={16}/>} />
          </div>

          <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
            <ChevronRight size={18} /> SELECT * FROM patients LIMIT 5;
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-left">
              <thead className="bg-[#1e293b] text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4">id</th>
                  <th className="px-6 py-4">name</th>
                  <th className="px-6 py-4">age</th>
                  <th className="px-6 py-4">dept</th>
                  <th className="px-6 py-4">LOS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-[#0f172a]">
                {dbData.sample_patients.map(p => (
                  <tr key={p.id} className="hover:bg-[#162032] transition-colors">
                    <td className="px-6 py-4 text-blue-400">{p.id}</td>
                    <td className="px-6 py-4">{p.name}</td>
                    <td className="px-6 py-4 text-purple-400">{p.age}</td>
                    <td className="px-6 py-4 text-emerald-400">'{p.department}'</td>
                    <td className="px-6 py-4 text-amber-400">{p.length_of_stay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function DbTableCard({ name, count, icon }) {
  return (
    <div className="bg-[#1e293b] p-5 rounded-xl border border-slate-700 flex items-center justify-between">
      <div>
        <h3 className="text-blue-400 font-bold mb-1 flex items-center gap-2">{icon} {name}</h3>
        <p className="text-3xl font-light text-white">{count} <span className="text-sm text-slate-500">rows</span></p>
      </div>
    </div>
  );
}

export default App;
