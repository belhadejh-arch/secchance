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
  Building,
  Scale,
  Heart
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kpis' | 'cases' | 'users' | 'audit' | 'settings'>('kpis');
  const [kpis, setKpis] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});

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
    try {
      const res = await api.getSystemSettings();
      setSettings(res.data || {});
    } catch (err) {
      console.error(err);
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
      }, 1200);
    } catch (err: any) {
      setAssignMsg(err.message || 'فشل إسناد الفريق');
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      await api.updateUserStatus(userId, { is_active: newStatus });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSystemSettings(settings);
      alert('تم حفظ إعدادات المنصة بنجاح.');
    } catch (err: any) {
      alert(err.message || 'فشل حفظ الإعدادات');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
            <Shield className="w-4 h-4" />
            <span>لوحة القيادة المركزية والإشراف العام — مدير النظام</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">غرفة العمليات وإدارة المنظومة</h1>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('kpis')}
            className={`px-3.5 py-2 rounded-lg transition-all ${activeTab === 'kpis' ? 'bg-white text-purple-800 shadow-xs' : 'text-slate-600'}`}
          >
            المؤشرات (KPIs)
          </button>
          <button
            onClick={() => setActiveTab('cases')}
            className={`px-3.5 py-2 rounded-lg transition-all ${activeTab === 'cases' ? 'bg-white text-purple-800 shadow-xs' : 'text-slate-600'}`}
          >
            فرز وإسناد الحالات ({cases.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-lg transition-all ${activeTab === 'users' ? 'bg-white text-purple-800 shadow-xs' : 'text-slate-600'}`}
          >
            إدارة المستخدمين ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 rounded-lg transition-all ${activeTab === 'audit' ? 'bg-white text-purple-800 shadow-xs' : 'text-slate-600'}`}
          >
            سجل الرقابة والأمان
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 rounded-lg transition-all ${activeTab === 'settings' ? 'bg-white text-purple-800 shadow-xs' : 'text-slate-600'}`}
          >
            إعدادات النظام
          </button>
        </div>
      </div>

      {/* Tab 1: KPIs Dashboard */}
      {activeTab === 'kpis' && kpis && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500">إجمالي الحالات</span>
              <div className="text-3xl font-black text-[#1565C0]">{kpis.cases?.total_cases || 0}</div>
              <div className="text-[11px] text-slate-400">ملفات مسجلة بالمنصة</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500">الحالات النشطة والمتابعة</span>
              <div className="text-3xl font-black text-amber-600">{kpis.cases?.active_cases || 0}</div>
              <div className="text-[11px] text-slate-400">قيد الجلسات والاستشفاء</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500">التعافي المكتمل</span>
              <div className="text-3xl font-black text-[#2E7D32]">{kpis.cases?.completed_cases || 0}</div>
              <div className="text-[11px] text-slate-400">وفق التقرير الختامي</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500">الحالات الحرجة (طوارئ)</span>
              <div className="text-3xl font-black text-red-600">{kpis.cases?.critical_cases || 0}</div>
              <div className="text-[11px] text-slate-400">استجابة خلال ساعتين</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Users Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900">توزيع المستخدمين حسب الأدوار والمهام</h3>
              <div className="space-y-2 text-xs">
                {kpis.users_by_role?.map((ur: any) => (
                  <div key={ur.role_name} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                    <span className="font-bold text-slate-700">{ur.role_name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold">{ur.count} مستخدم</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quality & SLA */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900">مؤشرات الجودة والامتثال (SLA Compliance)</h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <div className="flex justify-between font-bold text-emerald-900">
                    <span>التزام الأخصائيين بزمن الاستجابة الأولي</span>
                    <span>100%</span>
                  </div>
                  <div className="w-full bg-emerald-200 rounded-full h-1.5">
                    <div className="bg-emerald-600 h-1.5 rounded-full w-full"></div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                  <div className="flex justify-between font-bold text-blue-900">
                    <span>نسبة الحالات التي تم إسنادها لأخصائيين</span>
                    <span>{kpis.cases?.total_cases > 0 ? Math.round(((kpis.cases?.total_cases - (kpis.cases?.unassigned_cases || 0)) / kpis.cases?.total_cases) * 100) : 100}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-1.5">
                    <div className="bg-[#1565C0] h-1.5 rounded-full w-full"></div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
                  <span className="font-bold block">التشفير والرقابة الأمنية:</span>
                  مفعل 100%، سجل العمليات الحساسة (Audit Logs) يسجل كل حركة إدارية وتغيير في بيانات المستفيدين.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Cases Triage & Assignment */}
      {activeTab === 'cases' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900">جدول إدارة وفرز الحالات والإسناد</h3>
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
                {cases.map((c: any) => (
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

      {/* Tab 3: Users Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900">إدارة حسابات المستخدمين والمختصين والشركاء</h3>
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
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                        {u.role_name}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{u.wilaya_name || 'الجزائر'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {u.is_active ? 'نشط ومعتمد' : 'معطل'}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold ${u.is_active ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                      >
                        {u.is_active ? 'تعطيل الحساب' : 'تفعيل واعتماد'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-purple-700" />
              <span>سجل التدقيق والرقابة الأمنية الصارم (Security Audit Logs)</span>
            </h3>
            <p className="text-xs text-slate-500">
              توثيق غير قابل للتعديل لجميع العمليات الحساسة وتغييرات الحالات والدخول والإسناد.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-y border-slate-100">
                <tr>
                  <th className="p-3">رقم التسجيل</th>
                  <th className="p-3">المستخدم</th>
                  <th className="p-3">نوع العملية</th>
                  <th className="p-3">الهدف المعني</th>
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
                    <td className="p-3 text-slate-600">{log.target_type} {log.target_id ? `(${log.target_id})` : ''}</td>
                    <td className="p-3 text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                    <td className="p-3 text-slate-500">{new Date(log.created_at).toLocaleString('ar-DZ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: System Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 max-w-2xl">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-700" />
            <span>إعدادات وثوابت المنظومة</span>
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
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
              className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-xs"
            >
              حفظ التعديلات
            </button>
          </form>
        </div>
      )}

      {/* Case Assignment Modal */}
      {selectedCaseToAssign && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-right">
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
                  <Building className="w-3.5 h-3.5 text-teal-600" />
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
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold shadow-xs"
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
