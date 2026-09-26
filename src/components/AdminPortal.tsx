import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Shield, 
  Users, 
  FileText, 
  Activity, 
  Settings, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  UserX,
  Building2,
  Scale,
  Heart,
  Search,
  Plus,
  ArrowUpRight,
  MoreVertical,
  Calendar,
  Share2,
  Clock,
  LogOut,
  BedDouble,
  UserPlus,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AdminAwarenessManager } from './AdminAwarenessManager';

export const AdminPortal: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'kpis' | 'cases' | 'users' | 'awareness' | 'audit' | 'settings'>('kpis');
  const [kpis, setKpis] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ show_rejection_reason_to_client: false });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [newAccount, setNewAccount] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    role_slug: 'psychologist',
    specialty: '',
    license_number: '',
  });
  const [createAccountMsg, setCreateAccountMsg] = useState<string | null>(null);

  // Assignment Modal
  const [selectedCaseToAssign, setSelectedCaseToAssign] = useState<any>(null);
  const [psyId, setPsyId] = useState<number | ''>('');
  const [lawyerId, setLawyerId] = useState<number | ''>('');
  const [centerId, setCenterId] = useState<number | ''>('');
  const [assignMsg, setAssignMsg] = useState<string | null>(null);

  const fetchKpis = async () => {
    try {
      const res = await api.getKpis();
      setKpis(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCases = async () => {
    try {
      const res = await api.getCases();
      setCases(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.getAdminUsers();
      setUsersList(res.data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAudit = async () => {
    try {
      const res = await api.getAuditLogs();
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    setSettingsLoaded(false);
    setSettingsError('');
    try {
      const res = await api.getSystemSettings();
      const data = res.data || {};
      const showReason = data.show_rejection_reason_to_client;
      setSettings({
        ...data,
        show_rejection_reason_to_client: showReason === true || showReason === 1 || showReason === '1' || showReason === 'true'
      });
      setSettingsLoaded(true);
    } catch (err: any) {
      setSettingsError(err?.message || 'تعذر تحميل إعدادات المنصة.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchSpecialistsAndCenters = async () => {
    try {
      const [specRes, centRes] = await Promise.all([
        api.getSpecialistsList(),
        api.getCenters()
      ]);
      setSpecialists(specRes.data || []);
      setCenters(centRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchKpis();
    fetchCases();
    fetchUsers();
    fetchAudit();
    fetchSettings();
    fetchSpecialistsAndCenters();
  }, []);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseToAssign) return;
    try {
      await api.assignSpecialist(selectedCaseToAssign.id, {
        psychologist_id: psyId ? Number(psyId) : undefined,
        lawyer_id: lawyerId ? Number(lawyerId) : undefined,
        treatment_center_id: centerId ? Number(centerId) : undefined
      });
      setAssignMsg('تم إسناد الفريق التكفلي بنجاح وتحديث حالة الملف.');
      setTimeout(() => {
        setSelectedCaseToAssign(null);
        setAssignMsg(null);
        fetchCases();
        fetchKpis();
      }, 1200);
    } catch (err: any) {
      setAssignMsg(err.message || 'فشل إسناد الفريق');
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      await api.updateUserStatus(userId, { status: newStatus });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateAccountMsg(null);
    try {
      await api.createAdminUser(newAccount);
      setCreateAccountMsg('تم إنشاء الحساب بنجاح. الحسابات المهنية تنتظر الاعتماد قبل الدخول.');
      setNewAccount({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        role_slug: 'psychologist',
        specialty: '',
        license_number: '',
      });
      fetchUsers();
    } catch (err: any) {
      setCreateAccountMsg(err.message || 'تعذر إنشاء الحساب');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsError('');
    setSettingsSuccess('');
    try {
      await api.updateSystemSettings(settings);
      setSettingsSuccess('تم حفظ إعدادات المنصة بنجاح.');
    } catch (err: any) {
      setSettingsError(err?.message || 'فشل حفظ الإعدادات.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      (c.number_case && c.number_case.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.creator_first_name && c.creator_first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.creator_last_name && c.creator_last_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.addiction_type_name && c.addiction_type_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPriority = filterPriority === 'all' || c.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6 py-6 font-sans">
      {/* Outer Dashboard Frame inspired by Image 1 */}
      <div className="bg-[#f0f4f8] rounded-3xl p-3 sm:p-5 border border-slate-200/80 shadow-md">
        <div className="flex flex-col lg:flex-row gap-5 items-stretch min-h-[750px]">
          
          {/* 1. Deep Navy Sidebar (inspired by Image 1 Left Nav) */}
          <aside className="w-full lg:w-64 bg-[#091E3A] rounded-2xl p-5 text-white flex flex-col justify-between shadow-lg shrink-0">
            <div className="space-y-6">
              {/* Admin Profile Widget */}
              <div className="flex items-center gap-3 pb-5 border-b border-blue-900/50">
                <div className="w-12 h-12 rounded-full ring-2 ring-white/20 bg-blue-600 flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                  {user?.first_name?.[0] || 'أ'}
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-sm text-white truncate">
                    {user ? `${user.first_name} ${user.last_name}` : 'مدير المنظومة'}
                  </div>
                  <div className="text-[11px] text-cyan-300 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>لوحة القيادة المركزية</span>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('kpis')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-right ${
                    activeTab === 'kpis'
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Activity className="w-4 h-4 text-cyan-300" />
                  <span>نظرة عامة والتحليلات</span>
                </button>

                <button
                  onClick={() => setActiveTab('cases')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-right ${
                    activeTab === 'cases'
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-cyan-300" />
                    <span>ملفات الحالات</span>
                  </span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-mono">
                    {cases.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-right ${
                    activeTab === 'users'
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-cyan-300" />
                    <span>الكوادر والمستخدمين</span>
                  </span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-mono">
                    {usersList.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('awareness')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-right ${
                    activeTab === 'awareness'
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <GraduationCap className="w-4 h-4 text-cyan-300" />
                    <span>خانة التوعية والأبحاث</span>
                  </span>
                  <span className="bg-purple-400/20 text-purple-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    نشر ودراسات
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('audit')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-right ${
                    activeTab === 'audit'
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <History className="w-4 h-4 text-cyan-300" />
                  <span>سجل التدقيق والأمان</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-right ${
                    activeTab === 'settings'
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Settings className="w-4 h-4 text-cyan-300" />
                  <span>إعدادات النظام</span>
                </button>
              </nav>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-blue-900/50 space-y-2 text-xs">
              <div className="px-3 py-2 bg-blue-950/60 rounded-xl text-slate-300 text-[11px] leading-relaxed">
                <span className="font-bold text-white block mb-0.5">منظومة SCP المشفرة</span>
                <span>حماية متقدمة للبيانات والسر المهني الطبي.</span>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-red-300 hover:text-red-100 hover:bg-red-900/30 rounded-xl transition-colors font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </aside>

          {/* 2. Main Content Center Stage (Image 1 layout) */}
          <main className="flex-1 flex flex-col gap-5 min-w-0">
            {/* Top Search & Actions Bar (Pill shaped search as in Image 1) */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="البحث برقم الملف، اسم المستفيد، نوع الإدمان..."
                  className="w-full bg-white rounded-full pr-10 pl-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 border border-slate-200/80 shadow-xs focus:ring-2 focus:ring-[#1565C0] outline-none transition-all"
                />
              </div>

              {/* Priority Filters */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-slate-200/80 shadow-xs text-xs font-semibold">
                <button
                  onClick={() => setFilterPriority('all')}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    filterPriority === 'all' ? 'bg-[#091E3A] text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setFilterPriority('Critical')}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    filterPriority === 'Critical' ? 'bg-red-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-red-600'
                  }`}
                >
                  حرجة جداً
                </button>
                <button
                  onClick={() => setFilterPriority('High')}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    filterPriority === 'High' ? 'bg-amber-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-amber-600'
                  }`}
                >
                  عالية
                </button>
                <button
                  onClick={() => setFilterPriority('Medium')}
                  className={`px-3 py-1.5 rounded-full transition-all ${
                    filterPriority === 'Medium' ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-blue-600'
                  }`}
                >
                  متوسطة
                </button>
              </div>
            </div>

            {/* TAB 1: OVERVIEW & KPIS (The Image 1 Style Experience) */}
            {activeTab === 'kpis' && (
              <div className="space-y-5">
                {/* Categories Row: 4 Bold Vibrant Cards directly inspired by Image 1 Categories */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Category 1: Case Files (Solid Royal Blue) */}
                  <div className="bg-[#1565C0] text-white p-4 sm:p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-32 hover:scale-[1.01] transition-transform">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                        نشطة
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-white/90">ملفات الحالات الإجمالية</div>
                      <div className="text-xl sm:text-2xl font-black tracking-tight font-sans">
                        {kpis?.cases?.total_cases ?? cases.length} حالة
                      </div>
                    </div>
                  </div>

                  {/* Category 2: Psychological Support (Solid Teal/Green) */}
                  <div className="bg-[#00897B] text-white p-4 sm:p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-32 hover:scale-[1.01] transition-transform">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                        عيادي
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-white/90">جلسات الدعم النفسي</div>
                      <div className="text-xl sm:text-2xl font-black tracking-tight font-sans">
                        —
                      </div>
                    </div>
                  </div>

                  {/* Category 3: Legal Consultations (Solid Pink/Crimson) */}
                  <div className="bg-[#E91E63] text-white p-4 sm:p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-32 hover:scale-[1.01] transition-transform">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                        <Scale className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                        قانوني
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-white/90">استشارات التكييف القانوني</div>
                      <div className="text-xl sm:text-2xl font-black tracking-tight font-sans">
                        {specialists.filter(s => s.role_slug === 'lawyer').length} محامٍ
                      </div>
                    </div>
                  </div>

                  {/* Category 4: Detox & Rehab Centers (Solid Cobalt/Indigo) */}
                  <div className="bg-[#3949AB] text-white p-4 sm:p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-32 hover:scale-[1.01] transition-transform">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                        معتمد
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-white/90">مراكز الاستشفاء والسموم</div>
                      <div className="text-xl sm:text-2xl font-black tracking-tight font-sans">
                        {centers.length} مركزاً
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-cards: Tracks & Workload (Image 1 "Files" row with colored indicators) */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>مسارات التكفل ومؤشرات الاستيعاب</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {/* Workload 1: Critical Emergency */}
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                      <div className="text-red-600 font-bold text-xs flex items-center justify-between">
                        <span>حالات حرجة جداً</span>
                        <AlertCircle className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-base font-black text-slate-900 font-sans">
                        {kpis?.cases?.critical_cases ?? '—'} حالة
                      </div>
                      <div className="w-full bg-red-100 rounded-full h-1 mt-2">
                        <div className="bg-red-600 h-1 rounded-full w-4/5"></div>
                      </div>
                    </div>

                    {/* Workload 2: Active in Therapy */}
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                      <div className="text-blue-600 font-bold text-xs flex items-center justify-between">
                        <span>قيد التكفل العيادي</span>
                        <Heart className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-base font-black text-slate-900 font-sans">
                        {kpis?.cases?.active_cases ?? '—'} حالة
                      </div>
                      <div className="w-full bg-blue-100 rounded-full h-1 mt-2">
                        <div className="bg-blue-600 h-1 rounded-full w-3/5"></div>
                      </div>
                    </div>

                    {/* Workload 3: Successfully Recovered */}
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                      <div className="text-emerald-600 font-bold text-xs flex items-center justify-between">
                        <span>التعافي التام والمكتمل</span>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-base font-black text-slate-900 font-sans">
                        {kpis?.cases?.completed_cases ?? '—'} حالة
                      </div>
                      <div className="w-full bg-emerald-100 rounded-full h-1 mt-2">
                        <div className="bg-emerald-600 h-1 rounded-full w-full"></div>
                      </div>
                    </div>

                    {/* Workload 4: Unassigned */}
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                      <div className="text-purple-600 font-bold text-xs flex items-center justify-between">
                        <span>بانتظار إسناد الفريق</span>
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-base font-black text-slate-900 font-sans">
                        {kpis?.cases?.unassigned_cases ?? '—'} حالة
                      </div>
                      <div className="w-full bg-purple-100 rounded-full h-1 mt-2">
                        <div className="bg-purple-600 h-1 rounded-full w-2/5"></div>
                      </div>
                    </div>

                    {/* Workload 5: Fast Add/Assign (+) Button like Image 1 */}
                    <button
                      onClick={() => {
                        if (cases.length > 0) {
                          setSelectedCaseToAssign(cases[0]);
                          setPsyId(cases[0].assigned_psychologist_id || '');
                          setLawyerId(cases[0].assigned_lawyer_id || '');
                          setCenterId(cases[0].assigned_treatment_center_id || '');
                        }
                      }}
                      className="bg-white hover:bg-slate-50 p-3.5 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-600 hover:text-[#1565C0] hover:border-[#1565C0] transition-colors cursor-pointer group"
                    >
                      <Plus className="w-5 h-5 text-slate-400 group-hover:text-[#1565C0] group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-bold mt-1">إسناد فوري</span>
                    </button>
                  </div>
                </div>

                {/* Recent Cases List (Image 1 Recent Files Style) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">الملفات الجارية والمحدثة مؤخراً</span>
                    <button
                      onClick={() => setActiveTab('cases')}
                      className="text-xs font-bold text-[#1565C0] hover:underline flex items-center gap-1"
                    >
                      <span>عرض كامل الملفات ({cases.length})</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {filteredCases.slice(0, 6).map((c) => (
                      <div
                        key={c.id}
                        className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 ${
                            c.priority === 'Critical' ? 'bg-red-600' : c.priority === 'High' ? 'bg-amber-600' : 'bg-blue-600'
                          }`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs sm:text-sm text-slate-900 font-sans">
                                {c.number_case}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                c.priority === 'Critical' ? 'bg-red-100 text-red-800' : c.priority === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {c.priority === 'Critical' ? 'حرجة جداً' : c.priority === 'High' ? 'أولوية عالية' : 'متوسطة'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              المستفيد: {c.creator_first_name} {c.creator_last_name} • نوع الإدمان: {c.addiction_type_name || 'عام'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right hidden sm:block text-[11px]">
                            <span className="text-slate-400 block font-sans">
                              {new Date(c.created_at).toLocaleDateString('ar-DZ')}
                            </span>
                            <span className="font-semibold text-slate-600">
                              {c.assigned_psychologist_id ? `د. ${c.psy_first_name || ''} ${c.psy_last_name || ''}` : 'بانتظار إسناد'}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedCaseToAssign(c);
                              setPsyId(c.assigned_psychologist_id || '');
                              setLawyerId(c.assigned_lawyer_id || '');
                              setCenterId(c.assigned_treatment_center_id || '');
                            }}
                            className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1565C0] font-bold text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            إسناد الفريق
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DETAILED CASES TABLE */}
            {activeTab === 'cases' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900">جدول إدارة وفرز الحالات والإسناد التكفلي ({filteredCases.length})</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-100">
                      <tr>
                        <th className="p-3">رقم الملف</th>
                        <th className="p-3">صاحب الطلب</th>
                        <th className="p-3">نوع الحالة</th>
                        <th className="p-3">الأولوية</th>
                        <th className="p-3">الحالة التشغيلية</th>
                        <th className="p-3">الأخصائي المعين</th>
                        <th className="p-3">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCases.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 font-sans font-bold text-[#1565C0]">{c.number_case}</td>
                          <td className="p-3 font-semibold text-slate-800">{c.creator_first_name} {c.creator_last_name}</td>
                          <td className="p-3 text-slate-600">{c.addiction_type_name || 'عام'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.priority === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                              {c.priority}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {c.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">
                            {c.assigned_psychologist_id ? `د. ${c.psy_first_name || ''} ${c.psy_last_name || ''}` : 'غير معين'}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => {
                                setSelectedCaseToAssign(c);
                                setPsyId(c.assigned_psychologist_id || '');
                                setLawyerId(c.assigned_lawyer_id || '');
                                setCenterId(c.assigned_treatment_center_id || '');
                              }}
                              className="px-3 py-1.5 bg-[#1565C0] hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                            >
                              إسناد الفريق
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: USERS & STAFF MANAGEMENT */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">إدارة الحسابات ({usersList.length})</h3>
                  <span className="text-[11px] text-slate-500">إنشاء حسابات المختصين والشركاء يتم من الإدارة فقط</span>
                </div>
                <form onSubmit={handleCreateAccount} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 rounded-2xl bg-blue-50/60 border border-blue-100">
                  <input required value={newAccount.first_name} onChange={e => setNewAccount({ ...newAccount, first_name: e.target.value })} placeholder="الاسم الأول" className="p-2 rounded-lg border border-slate-200 text-xs" />
                  <input required value={newAccount.last_name} onChange={e => setNewAccount({ ...newAccount, last_name: e.target.value })} placeholder="اسم العائلة" className="p-2 rounded-lg border border-slate-200 text-xs" />
                  <input required type="email" value={newAccount.email} onChange={e => setNewAccount({ ...newAccount, email: e.target.value })} placeholder="البريد الإلكتروني" dir="ltr" className="p-2 rounded-lg border border-slate-200 text-xs" />
                  <input required value={newAccount.phone} onChange={e => setNewAccount({ ...newAccount, phone: e.target.value })} placeholder="الهاتف" dir="ltr" className="p-2 rounded-lg border border-slate-200 text-xs" />
                  <input required type="password" minLength={8} value={newAccount.password} onChange={e => setNewAccount({ ...newAccount, password: e.target.value })} placeholder="كلمة المرور (8+)" dir="ltr" className="p-2 rounded-lg border border-slate-200 text-xs" />
                  <select value={newAccount.role_slug} onChange={e => setNewAccount({ ...newAccount, role_slug: e.target.value })} className="p-2 rounded-lg border border-slate-200 text-xs font-bold">
                    <option value="psychologist">أخصائي نفسي</option>
                    <option value="lawyer">محام ومستشار</option>
                    <option value="treatment_center">مركز علاج</option>
                    <option value="association">جمعية</option>
                    <option value="family">أسرة</option>
                    <option value="patient">مستفيد</option>
                  </select>
                  <input value={newAccount.specialty} onChange={e => setNewAccount({ ...newAccount, specialty: e.target.value })} placeholder="التخصص / الخدمة" className="p-2 rounded-lg border border-slate-200 text-xs" />
                  <input value={newAccount.license_number} onChange={e => setNewAccount({ ...newAccount, license_number: e.target.value })} placeholder="رقم الترخيص (للمهني)" className="p-2 rounded-lg border border-slate-200 text-xs" />
                  <div className="md:col-span-4 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-600">{createAccountMsg || 'سيتم تسجيل العملية في سجل التدقيق.'}</span>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-[#1565C0] text-white text-xs font-bold hover:bg-blue-700">
                      إنشاء الحساب
                    </button>
                  </div>
                </form>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-100">
                      <tr>
                        <th className="p-3">الاسم الكامل</th>
                        <th className="p-3">البريد الإلكتروني</th>
                        <th className="p-3">الدور والمسؤولية</th>
                        <th className="p-3">الولاية</th>
                        <th className="p-3">حالة الحساب</th>
                        <th className="p-3">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usersList.map((u: any) => (
                        <tr key={u.id} className="hover:bg-slate-50/70">
                          <td className="p-3 font-bold text-slate-900">{u.first_name} {u.last_name}</td>
                          <td className="p-3 text-slate-600 font-sans">{u.email}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              {u.role_name || u.role_slug}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">{u.wilaya_name || 'الجزائر'}</td>
                          <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : u.status === 'pending_approval' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                              {u.status === 'active' ? 'نشط ومعتمد' : u.status === 'pending_approval' ? 'بانتظار الاعتماد' : 'معطل'}
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => handleToggleUserStatus(u.id, u.status)}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold ${u.status === 'active' ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                            >
                              {u.status === 'active' ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: AUDIT LOGS */}
            {activeTab === 'audit' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-700" />
                    <span>سجل التدقيق والرقابة الأمنية الصارم (Security Audit Logs)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    توثيق فوري لجميع العمليات الحساسة، الإسنادات، وتغييرات الحالات لحماية السرية.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-100">
                      <tr>
                        <th className="p-3">رقم العملية</th>
                        <th className="p-3">المستخدم</th>
                        <th className="p-3">نوع الإجراء</th>
                        <th className="p-3">الهدف</th>
                        <th className="p-3">عنوان IP</th>
                        <th className="p-3">التوقيت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {auditLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-400">#{log.id}</td>
                          <td className="p-3 font-sans font-bold text-slate-800">
                            {log.first_name ? `${log.first_name} ${log.last_name}` : `User #${log.user_id}`}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 font-sans">{log.target_type} {log.target_id ? `(#${log.target_id})` : ''}</td>
                          <td className="p-3 text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                          <td className="p-3 text-slate-500 font-sans">{new Date(log.created_at).toLocaleString('ar-DZ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: AWARENESS & SCIENTIFIC STUDIES */}
            {activeTab === 'awareness' && (
              <AdminAwarenessManager />
            )}

            {/* TAB 6: SYSTEM SETTINGS */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4 max-w-2xl">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-700" />
                  <span>إعدادات وثوابت المنظومة المركزية</span>
                </h3>

                <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                  {settingsLoading && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600" role="status">
                      جارٍ تحميل إعدادات المنصة…
                    </div>
                  )}
                  {settingsError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800" role="alert">
                      <p className="m-0">{settingsError}</p>
                      {!settingsLoaded && (
                        <button type="button" onClick={() => void fetchSettings()} className="mt-2 font-bold text-[#1565C0] hover:underline">
                          إعادة تحميل الإعدادات
                        </button>
                      )}
                    </div>
                  )}
                  {settingsSuccess && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800" role="status">
                      {settingsSuccess}
                    </div>
                  )}

                  <fieldset disabled={!settingsLoaded || settingsSaving} className="m-0 min-w-0 space-y-4 border-0 p-0 disabled:opacity-70">
                    <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-3">
                      <div>
                        <h4 className="m-0 text-sm font-extrabold text-slate-900">إظهار سبب رفض مقدم الخدمة للعميل</h4>
                        <p className="mt-1 mb-0 leading-relaxed text-slate-600">
                          عند التفعيل، يرى العميل سبب الرفض الذي كتبه مقدم الخدمة. عند الإيقاف، لا يظهر السبب للعميل.
                        </p>
                      </div>
                      <label className="flex items-center justify-between gap-4 cursor-pointer">
                        <span className="font-bold text-slate-700">
                          {settings.show_rejection_reason_to_client ? 'مفعّل' : 'معطّل — الوضع الافتراضي'}
                        </span>
                        <input
                          type="checkbox"
                          checked={Boolean(settings.show_rejection_reason_to_client)}
                          onChange={event => {
                            setSettings({ ...settings, show_rejection_reason_to_client: event.target.checked });
                            setSettingsSuccess('');
                            setSettingsError('');
                          }}
                          className="h-5 w-5 accent-[#1565C0]"
                          aria-label="إظهار سبب رفض مقدم الخدمة للعميل"
                        />
                      </label>
                    </section>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">اسم المنصة الرسمي:</label>
                    <input
                      type="text"
                      value={settings.platform_name || ''}
                      onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">رقم خط الطوارئ الوطني المعتمد:</label>
                    <input
                      type="text"
                      value={settings.emergency_phone || ''}
                      onChange={(e) => setSettings({ ...settings, emergency_phone: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-left"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني للدعم والإشعارات:</label>
                    <input
                      type="email"
                      value={settings.support_email || ''}
                      onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-left"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">تفعيل الفرز التلقائي للحالات:</label>
                    <select
                      value={settings.auto_assign_enabled ? 'true' : 'false'}
                      onChange={(e) => setSettings({ ...settings, auto_assign_enabled: e.target.value === 'true' })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                    >
                      <option value="true">مفعل (توجيه الحالات الحرجة فوراً)</option>
                      <option value="false">معطل (فرز يدوي بإشراف المشرف العام)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={settingsSaving || !settingsLoaded}
                    className="px-6 py-2.5 bg-[#1565C0] hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {settingsSaving ? 'جارٍ الحفظ…' : 'حفظ التعديلات'}
                  </button>
                  </fieldset>
                </form>
              </div>
            )}
          </main>

          {/* 3. Right Side Panel (Image 1 Right Column Widgets) */}
          <aside className="w-full lg:w-72 space-y-4 shrink-0">
            {/* Quick Action / Upload Card (Image 1 "Add new files" block) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1565C0] flex items-center justify-center mx-auto ring-4 ring-blue-50/50">
                <Plus className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-black text-sm text-slate-900">إسناد وتكفل فوري</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">توجيه الحالات الواردة للكوادر المتخصصة</p>
              </div>
              <button
                onClick={() => {
                  if (cases.length > 0) {
                    setSelectedCaseToAssign(cases[0]);
                    setPsyId(cases[0].assigned_psychologist_id || '');
                    setLawyerId(cases[0].assigned_lawyer_id || '');
                    setCenterId(cases[0].assigned_treatment_center_id || '');
                  }
                }}
                className="w-full py-2.5 bg-[#1565C0] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                تخصيص حالة جديدة
              </button>
            </div>

            {/* Quick Action: Publish Study & Awareness */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                <GraduationCap className="w-4 h-4 text-purple-700" />
                <span>خانة التوعية والأبحاث</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                رفع ونشر دراسات علمية وأوراق بحثية محكّمة حول المخدرات والمؤثرات العقلية.
              </p>
              <button
                onClick={() => setActiveTab('awareness')}
                className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                إدارة ورفع الدراسات
              </button>
            </div>

            {/* Capacity information is withheld until the API supplies live facility capacity. */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <BedDouble className="w-4 h-4 text-[#1565C0]" />
                  <span>طاقة استيعاب الأسرة</span>
                </span>
                <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                  غير متاحة
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                لا توفر الواجهة الحالية بيانات إشغال مباشرة للمراكز.
              </p>
            </div>

            {/* Shared / On-duty Specialists (Image 1 "Your shared folders" widget with member avatars) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
              <div className="font-bold text-xs text-slate-800">فريق المناوبة والتكفل الفوري</div>
              
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-blue-50/60 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      ف
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">د. فاطمة زهرة</div>
                      <div className="text-[10px] text-blue-700">أخصائية نفسية عيادية</div>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>

                <div className="p-2.5 bg-amber-50/60 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                      ع
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">أ. عبد القادر</div>
                      <div className="text-[10px] text-amber-700">مستشار قانوني</div>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>

                <div className="p-2.5 bg-emerald-50/60 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      م
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">مركز البليدة للسموم</div>
                      <div className="text-[10px] text-emerald-700">إزالة السموم والاستشفاء</div>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('users')}
                className="w-full py-2 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                + إدارة كامل الكوادر ({specialists.length})
              </button>
            </div>
          </aside>

        </div>
      </div>

      {/* Case Assignment Modal */}
      {selectedCaseToAssign && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <button onClick={() => setSelectedCaseToAssign(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              <h3 className="font-bold text-base text-slate-900">
                إسناد الفريق التكفلي للحالة: {selectedCaseToAssign.number_case}
              </h3>
            </div>

            {assignMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold">{assignMsg}</div>
            )}

            <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-blue-600" />
                  <span>الأخصائي النفسي المعالج:</span>
                </label>
                <select
                  value={psyId}
                  onChange={(e) => setPsyId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="">-- اختر الأخصائي النفسي --</option>
                  {specialists.filter(s => s.role_slug === 'psychologist').map(s => (
                    <option key={s.id} value={s.id}>د. {s.first_name} {s.last_name} ({s.specialty || 'عيادي'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-amber-600" />
                  <span>المستشار القانوني:</span>
                </label>
                <select
                  value={lawyerId}
                  onChange={(e) => setLawyerId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="">-- اختياري: اختر محامياً للاستشارة --</option>
                  {specialists.filter(s => s.role_slug === 'lawyer').map(s => (
                    <option key={s.id} value={s.id}>أ. {s.first_name} {s.last_name} ({s.specialty || 'جنائي'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>مركز علاج وتأهيل الإدمان:</span>
                </label>
                <select
                  value={centerId}
                  onChange={(e) => setCenterId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="">-- اختياري: اختر مركز استشفاء شريك --</option>
                  {centers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.wilaya_name})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCaseToAssign(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#1565C0] hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  تأكيد الإسناد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
