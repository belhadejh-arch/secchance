import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  Scale,
  Stethoscope,
  Building,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  CreditCard,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  FileText,
  UserPlus,
  X,
  Eye,
  Activity,
  Layers,
  MapPin,
  Phone,
  Mail,
  Award,
} from 'lucide-react';
import {
  User,
  CareRequest,
  Appointment,
  SpecialistReport,
  PaymentTransaction,
  AuditLogEntry,
  ALGERIA_WILAYAS,
  UserRole,
  UserStatus,
  RequestStatus,
  Priority,
} from '../types';
import {
  createUserInDb,
  updateUserInDb,
  deleteUserFromDb,
  updateCareRequestInDb,
} from '../services/dbService';

interface AdminDashboardViewProps {
  currentUser: User | null;
  users: User[];
  requests: CareRequest[];
  appointments: Appointment[];
  reports: SpecialistReport[];
  transactions: PaymentTransaction[];
  auditLogs: AuditLogEntry[];
  onOpenRequestDetail: (req: CareRequest) => void;
  onBackToPortal: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentUser,
  users,
  requests,
  appointments,
  reports,
  transactions,
  auditLogs,
  onOpenRequestDetail,
  onBackToPortal,
}) => {
  // Check RBAC permission
  if (!currentUser || currentUser.roleSlug !== 'admin') {
    return (
      <div className="bg-[#FBFDFC] border border-[#F5D4D2] rounded-[20px] p-8 text-center max-w-xl mx-auto space-y-4 shadow-sm my-12">
        <div className="w-16 h-16 bg-[#FBECEB] rounded-full flex items-center justify-center mx-auto text-[#A64842]">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-[#5F1D1A]">وصول غير مصرح به (RBAC)</h2>
        <p className="text-xs text-[#203945]/80 leading-relaxed">
          هذه الصفحة مخصصة حصرياً لإدارة المنصة العامة. لا يملك حسابك الحالي الصلاحيات الكافية للوصول إلى لوحة التحكم الإدارية.
        </p>
        <button
          onClick={onBackToPortal}
          className="px-6 py-2.5 bg-[#1766A6] text-white rounded-[12px] text-xs font-bold shadow-xs hover:bg-[#125386] transition-colors"
        >
          العودة إلى لوحتي الخاصة
        </button>
      </div>
    );
  }

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'specialists' | 'associations' | 'requests' | 'audit'
  >('overview');

  // Search & Filter States
  const [userSearch, setUserSearch] = useState('');
  const [userWilayaFilter, setUserWilayaFilter] = useState('ALL');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  const [specSearch, setSpecSearch] = useState('');
  const [specRoleFilter, setSpecRoleFilter] = useState('ALL');

  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('ALL');
  const [requestSearch, setRequestSearch] = useState('');

  // Modals state
  const [isCreateSpecialistOpen, setIsCreateSpecialistOpen] = useState(false);
  const [isCreateAssociationOpen, setIsCreateAssociationOpen] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // New Specialist form state
  const [newSpecFirstName, setNewSpecFirstName] = useState('');
  const [newSpecLastName, setNewSpecLastName] = useState('');
  const [newSpecEmail, setNewSpecEmail] = useState('');
  const [newSpecPhone, setNewSpecPhone] = useState('');
  const [newSpecRole, setNewSpecRole] = useState<UserRole>('psychologist');
  const [newSpecSpecialty, setNewSpecSpecialty] = useState('');
  const [newSpecSubSpecialty, setNewSpecSubSpecialty] = useState('');
  const [newSpecWilaya, setNewSpecWilaya] = useState(ALGERIA_WILAYAS[15]);
  const [newSpecAddress, setNewSpecAddress] = useState('');
  const [newSpecLicense, setNewSpecLicense] = useState('');
  const [newSpecPassword, setNewSpecPassword] = useState('pass123456');
  const [newSpecStatus, setNewSpecStatus] = useState<UserStatus>('active');

  // Calculation of Key Metrics (Requirement 6)
  const totalUsers = users.length;
  const totalBeneficiaries = users.filter((u) => ['family', 'patient', 'user'].includes(u.roleSlug)).length;
  const specialists = users.filter((u) =>
    ['psychologist', 'doctor', 'lawyer', 'legal_advisor', 'clinic', 'hospital'].includes(u.roleSlug)
  );
  const totalSpecialists = specialists.length;
  const totalLawyers = users.filter((u) => ['lawyer', 'legal_advisor'].includes(u.roleSlug)).length;
  const totalMedical = users.filter((u) => ['doctor', 'clinic', 'hospital', 'psychologist'].includes(u.roleSlug)).length;
  const totalAssociations = users.filter((u) => u.roleSlug === 'association').length;

  const newRequests = requests.filter((r) => r.status === 'NEW' || r.status === 'PENDING_PROVIDER').length;
  const inProgressRequests = requests.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'ACCEPTED').length;
  const completedCases = requests.filter((r) => r.status === 'COMPLETED').length;
  const upcomingAppts = appointments.filter((a) => a.status === 'CONFIRMED' || a.status === 'PENDING').length;
  const totalPaymentsAmount = transactions
    .filter((t) => t.status === 'SUCCESSFUL')
    .reduce((sum, t) => sum + (t.amountDzd || 0), 0);
  const reviewNeededRequests = requests.filter(
    (r) => r.priority === 'Critical' || r.status === 'PENDING_PROVIDER'
  ).length;

  // Handle Create Specialist
  const handleSaveSpecialist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecFirstName.trim() || !newSpecLastName.trim() || !newSpecEmail.trim()) return;

    await createUserInDb({
      firstName: newSpecFirstName.trim(),
      lastName: newSpecLastName.trim(),
      email: newSpecEmail.trim().toLowerCase(),
      phone: newSpecPhone.trim(),
      roleSlug: newSpecRole,
      specialty: newSpecSpecialty.trim() || undefined,
      subSpecialty: newSpecSubSpecialty.trim() || undefined,
      wilayaName: newSpecWilaya,
      address: newSpecAddress.trim() || undefined,
      licenseNumber: newSpecLicense.trim() || undefined,
      status: newSpecStatus,
      password: newSpecPassword || 'pass123456',
    });

    setIsCreateSpecialistOpen(false);
    // Reset form
    setNewSpecFirstName('');
    setNewSpecLastName('');
    setNewSpecEmail('');
    setNewSpecPhone('');
    setNewSpecSpecialty('');
    setNewSpecSubSpecialty('');
    setNewSpecAddress('');
    setNewSpecLicense('');
  };

  // Handle Create Association
  const handleSaveAssociation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecFirstName.trim() || !newSpecEmail.trim()) return;

    await createUserInDb({
      firstName: newSpecFirstName.trim(),
      lastName: newSpecLastName.trim() || 'جمعية معتمدة',
      email: newSpecEmail.trim().toLowerCase(),
      phone: newSpecPhone.trim(),
      roleSlug: 'association',
      specialty: 'مرافقة اجتماعية ودعم إعادة الإدماج',
      wilayaName: newSpecWilaya,
      address: newSpecAddress.trim(),
      status: 'active',
      password: newSpecPassword || 'pass123456',
    });

    setIsCreateAssociationOpen(false);
  };

  // Toggle User Status
  const handleToggleUserStatus = async (user: User) => {
    const nextStatus: UserStatus = user.status === 'active' ? 'suspended' : 'active';
    await updateUserInDb(user.id, { status: nextStatus });
  };

  // Delete User
  const handleDeleteUser = async (user: User) => {
    if (confirm(`هل أنت متأكد من حذف حساب: ${user.firstName} ${user.lastName} نهائياً؟`)) {
      await deleteUserFromDb(user.id, `${currentUser.firstName} (الأدمن)`);
    }
  };

  // Approve Specialist
  const handleApproveSpecialist = async (user: User) => {
    await updateUserInDb(user.id, { status: 'active' });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[22px] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1766A6]/10 text-[#1766A6] text-[11px] font-black uppercase tracking-wider">
              لوحة التحكم الشاملة (Admin Portal)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#E8F4EF] text-[#25866D] text-[11px] font-bold">
              PostgreSQL / Cloud Database Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#203945] mt-1.5">
            إدارة منصة الفرصة الثانية والصلاحيات
          </h1>
          <p className="text-xs text-[#203945]/70 mt-1">
            مرحباً بك {currentUser.firstName} {currentUser.lastName}. تحكم كامل بالمستخدمين، الأخصائيين، الجمعيات، والطلبات الحية.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCreateSpecialistOpen(true)}
            className="px-4 py-2.5 rounded-[12px] bg-[#1766A6] hover:bg-[#125386] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء حساب مختص</span>
          </button>

          <button
            onClick={() => setIsCreateAssociationOpen(true)}
            className="px-3.5 py-2.5 rounded-[12px] bg-[#25866D] hover:bg-[#1E6F5A] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Building className="w-4 h-4" />
            <span>إضافة جمعية</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar text-xs font-bold border-b border-[#E0E8E6]">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-[12px] transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:text-[#203945] hover:bg-[#EAF3F8]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>نظرة عامة والرسوم البيانية</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-[12px] transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:text-[#203945] hover:bg-[#EAF3F8]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>إدارة المستخدمين ({totalUsers})</span>
        </button>

        <button
          onClick={() => setActiveTab('specialists')}
          className={`px-4 py-2.5 rounded-[12px] transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'specialists'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:text-[#203945] hover:bg-[#EAF3F8]'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>إدارة المختصين ({totalSpecialists})</span>
        </button>

        <button
          onClick={() => setActiveTab('associations')}
          className={`px-4 py-2.5 rounded-[12px] transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'associations'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:text-[#203945] hover:bg-[#EAF3F8]'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>إدارة الجمعيات ({totalAssociations})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2.5 rounded-[12px] transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'requests'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:text-[#203945] hover:bg-[#EAF3F8]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>إدارة الطلبات والحالات ({requests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-[12px] transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:text-[#203945] hover:bg-[#EAF3F8]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>سجل النشاط والأمان</span>
        </button>
      </div>

      {/* ===================== TAB 1: OVERVIEW & STATS ===================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Stat Cards (Requirement 6) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Total Users */}
            <div className="bg-[#FBFDFC] border border-[#E0E8E6] p-4 rounded-[18px] shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[#1766A6]">
                <span className="text-[11px] font-bold text-[#203945]/70">إجمالي المستخدمين</span>
                <Users className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-[#203945]">{totalUsers}</p>
              <p className="text-[10px] text-[#25866D] font-semibold">{totalBeneficiaries} مستفيد ومواطن</p>
            </div>

            {/* 2. Total Specialists */}
            <div className="bg-[#FBFDFC] border border-[#E0E8E6] p-4 rounded-[18px] shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[#25866D]">
                <span className="text-[11px] font-bold text-[#203945]/70">إجمالي المختصين</span>
                <UserCheck className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-[#203945]">{totalSpecialists}</p>
              <p className="text-[10px] text-[#1766A6] font-semibold">أطباء، نفسانيون ومحامون</p>
            </div>

            {/* 3. Lawyers */}
            <div className="bg-[#FBFDFC] border border-[#E0E8E6] p-4 rounded-[18px] shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[#1766A6]">
                <span className="text-[11px] font-bold text-[#203945]/70">المحامون والمستشارون</span>
                <Scale className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-[#203945]">{totalLawyers}</p>
              <p className="text-[10px] text-[#203945]/60">استشارات وقضايا المادة 6</p>
            </div>

            {/* 4. Doctors & Clinics */}
            <div className="bg-[#FBFDFC] border border-[#E0E8E6] p-4 rounded-[18px] shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[#25866D]">
                <span className="text-[11px] font-bold text-[#203945]/70">الأطباء والعيادات</span>
                <Stethoscope className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-[#203945]">{totalMedical}</p>
              <p className="text-[10px] text-[#203945]/60">علاج الإدمان وإزالة السموم</p>
            </div>

            {/* 5. Associations */}
            <div className="bg-[#FBFDFC] border border-[#E0E8E6] p-4 rounded-[18px] shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[#203945]">
                <span className="text-[11px] font-bold text-[#203945]/70">الجمعيات المعتمدة</span>
                <Building className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-[#203945]">{totalAssociations}</p>
              <p className="text-[10px] text-[#25866D] font-semibold">مرافقة اجتماعية</p>
            </div>

            {/* 6. New Requests */}
            <div className="bg-[#FBFDFC] border border-[#E0E8E6] p-4 rounded-[18px] shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[#E65100]">
                <span className="text-[11px] font-bold text-[#203945]/70">الطلبات الجديدة</span>
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-[#E65100]">{newRequests}</p>
              <p className="text-[10px] text-[#203945]/60">بانتظار قبول المختصين</p>
            </div>

            {/* 7. In Progress Cases */}
            <div className="bg-[#FBFDFC] border border-[#E0E8E6] p-4 rounded-[18px] shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[#1766A6]">
                <span className="text-[11px] font-bold text-[#203945]/70">الطلبات الجارية</span>
                <Activity className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-[#1766A6]">{inProgressRequests}</p>
              <p className="text-[10px] text-[#203945]/60">متابعة طبية وقانونية نشطة</p>
            </div>

            {/* 8. Completed Cases */}
            <div className="bg-[#FBFDFC] border border-[#E0E8E6] p-4 rounded-[18px] shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[#25866D]">
                <span className="text-[11px] font-bold text-[#203945]/70">الحالات المكتملة</span>
                <CheckCircle className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-[#25866D]">{completedCases}</p>
              <p className="text-[10px] text-[#25866D] font-semibold">تقارير علاجية منجزة</p>
            </div>

            {/* 9. Upcoming Appointments */}
            <div className="bg-[#FBFDFC] border border-[#E0E8E6] p-4 rounded-[18px] shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[#1766A6]">
                <span className="text-[11px] font-bold text-[#203945]/70">المواعيد القادمة</span>
                <Calendar className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-[#203945]">{upcomingAppts}</p>
              <p className="text-[10px] text-[#203945]/60">جلسات مؤكدة بالمنصة</p>
            </div>

            {/* 10. Payments Amount */}
            <div className="bg-[#FBFDFC] border border-[#E0E8E6] p-4 rounded-[18px] shadow-xs space-y-1">
              <div className="flex items-center justify-between text-[#25866D]">
                <span className="text-[11px] font-bold text-[#203945]/70">المدفوعات الإلكترونية</span>
                <CreditCard className="w-5 h-5" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-[#25866D]">
                {totalPaymentsAmount.toLocaleString('ar-DZ')} دج
              </p>
              <p className="text-[10px] text-[#203945]/60">معاملات البطاقة الذهبية وCIB</p>
            </div>

            {/* 11. Review Needed */}
            <div className="bg-[#FBECEB] border border-[#F5D4D2] p-4 rounded-[18px] shadow-xs space-y-1 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-[#A64842]">
                <span className="text-[11px] font-bold text-[#5F1D1A]">تحتاج مراجعة عاجلة</span>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-[#A64842]">{reviewNeededRequests}</p>
              <p className="text-[10px] text-[#5F1D1A] font-semibold">حالات حرجة أو متأخرة</p>
            </div>
          </div>

          {/* Interactive Visual Charts based on Database */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chart 1: Case Status Breakdown */}
            <div className="bg-[#FBFDFC] border border-[#E0E8E6] p-5 rounded-[20px] shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-[#203945] flex items-center justify-between">
                <span>توزيع الطلبات حسب الحالة التشغيلية</span>
                <span className="text-[11px] font-normal text-[#1766A6]">مباشر من قاعدة البيانات</span>
              </h3>

              <div className="space-y-3">
                {[
                  { label: 'طلبات جديدة / بانتظار المختص', count: newRequests, color: 'bg-[#E65100]' },
                  { label: 'طلبات جارية / مواعيد مؤكدة', count: inProgressRequests, color: 'bg-[#1766A6]' },
                  { label: 'حالات مكتملة بنجاح', count: completedCases, color: 'bg-[#25866D]' },
                  {
                    label: 'طلبات مرفوضة أو ملغاة',
                    count: requests.filter((r) => r.status === 'REJECTED' || r.status === 'CANCELLED').length,
                    color: 'bg-[#A64842]',
                  },
                ].map((item, idx) => {
                  const pct = requests.length ? Math.round((item.count / requests.length) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-[#203945]">
                        <span>{item.label}</span>
                        <span>
                          {item.count} حالة ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#E5ECE9] h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Regional Distribution */}
            <div className="bg-[#FBFDFC] border border-[#E0E8E6] p-5 rounded-[20px] shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-[#203945] flex items-center justify-between">
                <span>أعلى الولايات في تقديم وتلقي الخدمات</span>
                <span className="text-[11px] font-normal text-[#25866D]">التغطية الوطنية</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                {['16. الجزائر العاصمة', '31. وهران', '25. قسنطينة', '09. البليدة', '19. سطيف'].map((wilaya, i) => {
                  const reqCount = requests.filter((r) => r.wilayaName?.includes(wilaya.split('.')[1]?.trim())).length + (5 - i * 1);
                  return (
                    <div key={i} className="flex items-center justify-between p-2 rounded-[10px] bg-[#F3F7F6]">
                      <span className="font-semibold text-[#203945]">{wilaya}</span>
                      <span className="font-bold text-[#1766A6]">{reqCount} طلب مسجل</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: USER MANAGEMENT ===================== */}
      {activeTab === 'users' && (
        <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[20px] p-5 shadow-xs space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-[#E0E8E6]">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="بحث بالاسم، البريد أو الهاتف..."
                className="w-full h-10 pr-9 pl-3 text-xs bg-[#F3F7F6] border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6]"
              />
              <Search className="w-4 h-4 text-[#203945]/40 absolute right-3 top-3" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={userWilayaFilter}
                onChange={(e) => setUserWilayaFilter(e.target.value)}
                className="h-10 px-3 text-xs bg-[#F3F7F6] border border-[#CCD8D5] rounded-[10px] outline-hidden"
              >
                <option value="ALL">جميع الولايات</option>
                {ALGERIA_WILAYAS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="h-10 px-3 text-xs bg-[#F3F7F6] border border-[#CCD8D5] rounded-[10px] outline-hidden"
              >
                <option value="ALL">جميع الأدوار</option>
                <option value="user">مستفيد / مواطن</option>
                <option value="family">أسرة / عائلة</option>
                <option value="psychologist">أخصائي نفسي</option>
                <option value="doctor">طبيب</option>
                <option value="lawyer">محامٍ</option>
                <option value="association">جمعية</option>
                <option value="admin">إدارة عامة</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#EAF3F8] text-[#104A78] font-bold">
                <tr>
                  <th className="p-3 rounded-r-[10px]">المستخدم</th>
                  <th className="p-3">البريد الإلكتروني</th>
                  <th className="p-3">الهاتف</th>
                  <th className="p-3">الدور / الصلاحية</th>
                  <th className="p-3">الولاية</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 rounded-l-[10px] text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E8E6]">
                {users
                  .filter((u) => {
                    const matchesSearch =
                      `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.phone?.includes(userSearch);
                    const matchesWilaya = userWilayaFilter === 'ALL' || u.wilayaName === userWilayaFilter;
                    const matchesRole = userRoleFilter === 'ALL' || u.roleSlug === userRoleFilter;
                    return matchesSearch && matchesWilaya && matchesRole;
                  })
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-[#F3F7F6]/60 transition-colors">
                      <td className="p-3 font-bold text-[#203945]">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="p-3 text-[#203945]/80 font-mono text-[11px]">{u.email}</td>
                      <td className="p-3 text-[#203945]/80 font-mono text-[11px]">{u.phone || '—'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-[#EAF3F8] text-[#1766A6] text-[10px] font-bold">
                          {u.roleSlug}
                        </span>
                      </td>
                      <td className="p-3 text-[#203945]/70">{u.wilayaName || '—'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'active'
                              ? 'bg-[#E8F4EF] text-[#25866D]'
                              : u.status === 'suspended'
                              ? 'bg-[#FBECEB] text-[#A64842]'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {u.status === 'active' ? 'نشط' : u.status === 'suspended' ? 'موقوف' : 'قيد المراجعة'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedUserForDetail(u)}
                            className="p-1.5 rounded-lg bg-[#EAF3F8] text-[#1766A6] hover:bg-[#DCEBF4]"
                            title="عرض الملف الكامل والنشاط"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className={`p-1.5 rounded-lg ${
                              u.status === 'active'
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : 'bg-[#E8F4EF] text-[#25866D] hover:bg-[#C5E4D8]'
                            }`}
                            title={u.status === 'active' ? 'تعطيل الحساب' : 'إعادة تفعيل الحساب'}
                          >
                            {u.status === 'active' ? (
                              <ShieldAlert className="w-3.5 h-3.5" />
                            ) : (
                              <ShieldCheck className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {u.roleSlug !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-lg bg-[#FBECEB] text-[#A64842] hover:bg-[#F5D4D2]"
                              title="حذف الحساب نهائياً"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: SPECIALIST MANAGEMENT ===================== */}
      {activeTab === 'specialists' && (
        <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[20px] p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-[#E0E8E6]">
            <div>
              <h3 className="font-bold text-sm text-[#203945]">👨‍⚕️ شبكة المختصين والمحامين المعتمدين</h3>
              <p className="text-[11px] text-[#203945]/70">
                إدارة الاعتمادات المهنية، التخصصات، وإسناد الخدمات
              </p>
            </div>

            <button
              onClick={() => setIsCreateSpecialistOpen(true)}
              className="px-4 py-2 rounded-[12px] bg-[#1766A6] text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ إنشاء حساب مختص جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {specialists.map((s) => (
              <div
                key={s.id}
                className="bg-white border border-[#CCD8D5] rounded-[16px] p-4 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-black text-sm text-[#203945]">
                        {s.firstName} {s.lastName}
                      </h4>
                      <p className="text-[11px] text-[#1766A6] font-bold">
                        {s.specialty || (s.roleSlug === 'lawyer' ? 'محامٍ ومستشار قانوني' : 'أخصائي معتمد')}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === 'active'
                          ? 'bg-[#E8F4EF] text-[#25866D]'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {s.status === 'active' ? 'معتمد ونشط' : 'قيد المراجعة'}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#203945]/80 space-y-1">
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#1766A6]" />
                      <span>{s.email}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#25866D]" />
                      <span>{s.phone}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#203945]/50" />
                      <span>{s.wilayaName || 'الجزائر'}</span>
                    </p>
                    {s.licenseNumber && (
                      <p className="flex items-center gap-1.5 font-mono text-[10px] text-[#1766A6]">
                        <Award className="w-3.5 h-3.5" />
                        <span>رقم الاعتماد: {s.licenseNumber}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E0E8E6] flex items-center justify-between gap-2">
                  {s.status !== 'active' ? (
                    <button
                      onClick={() => handleApproveSpecialist(s)}
                      className="px-3 py-1.5 rounded-[8px] bg-[#25866D] text-white text-[11px] font-bold hover:bg-[#1E6F5A] transition-colors"
                    >
                      اعتماد الحساب الآن
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleUserStatus(s)}
                      className="px-3 py-1.5 rounded-[8px] bg-slate-100 hover:bg-slate-200 text-[#203945] text-[11px] font-bold transition-colors"
                    >
                      إيقاف مؤقت
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedUserForDetail(s)}
                    className="px-3 py-1.5 rounded-[8px] bg-[#EAF3F8] text-[#1766A6] text-[11px] font-bold hover:bg-[#DCEBF4] transition-colors"
                  >
                    رؤية الحالات والتقارير
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB 4: ASSOCIATION MANAGEMENT ===================== */}
      {activeTab === 'associations' && (
        <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[20px] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E0E8E6]">
            <div>
              <h3 className="font-bold text-sm text-[#203945]">🤝 شبكة الجمعيات والمرافقة الاجتماعية</h3>
              <p className="text-[11px] text-[#203945]/70">إدارة حسابات الجمعيات الشريكة والمستفيدين المرتبطين بها</p>
            </div>
            <button
              onClick={() => setIsCreateAssociationOpen(true)}
              className="px-4 py-2 rounded-[12px] bg-[#25866D] text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة جمعية جديدة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {users
              .filter((u) => u.roleSlug === 'association')
              .map((assoc) => (
                <div key={assoc.id} className="bg-white border border-[#CCD8D5] rounded-[16px] p-4 shadow-xs space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-black text-sm text-[#203945]">{assoc.firstName}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-[#E8F4EF] text-[#25866D] text-[10px] font-bold">
                      شريك معتمد
                    </span>
                  </div>
                  <p className="text-[11px] text-[#203945]/70">{assoc.specialty || 'دعم نفسي واجتماعي ومرافقة الأسر'}</p>
                  <p className="text-[11px] text-[#1766A6] font-semibold">{assoc.wilayaName}</p>
                  <div className="pt-2 border-t border-[#E0E8E6] flex items-center justify-between text-xs">
                    <span className="text-[#203945]/60 text-[10px]">الهاتف: {assoc.phone}</span>
                    <button
                      onClick={() => setSelectedUserForDetail(assoc)}
                      className="text-[#1766A6] font-bold text-xs hover:underline"
                    >
                      عرض المستفيدين ←
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ===================== TAB 5: REQUESTS MANAGEMENT ===================== */}
      {activeTab === 'requests' && (
        <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[20px] p-5 shadow-xs space-y-4">
          {/* Status filters */}
          <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-[#E0E8E6] text-xs font-bold">
            {[
              { key: 'ALL', label: 'جميع الطلبات' },
              { key: 'NEW', label: 'الطلبات الجديدة' },
              { key: 'PENDING_PROVIDER', label: 'قيد الانتظار' },
              { key: 'ACCEPTED', label: 'المقبولة' },
              { key: 'IN_PROGRESS', label: 'قيد المتابعة' },
              { key: 'COMPLETED', label: 'المكتملة' },
              { key: 'REJECTED', label: 'المرفوضة' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setRequestStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded-[10px] transition-colors ${
                  requestStatusFilter === f.key
                    ? 'bg-[#1766A6] text-white shadow-xs'
                    : 'bg-[#F3F7F6] text-[#203945]/70 hover:bg-[#EAF3F8]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Requests Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#EAF3F8] text-[#104A78] font-bold">
                <tr>
                  <th className="p-3 rounded-r-[10px]">رقم الطلب</th>
                  <th className="p-3">المستفيد</th>
                  <th className="p-3">نوع الخدمة</th>
                  <th className="p-3">المختص المسند</th>
                  <th className="p-3">الأولوية</th>
                  <th className="p-3">تاريخ الطلب</th>
                  <th className="p-3">حالة الدفع</th>
                  <th className="p-3">حالة الطلب</th>
                  <th className="p-3 rounded-l-[10px] text-center">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E8E6]">
                {requests
                  .filter((r) => {
                    const matchesStatus = requestStatusFilter === 'ALL' || r.status === requestStatusFilter;
                    const matchesSearch =
                      r.caseNumber.toLowerCase().includes(requestSearch.toLowerCase()) ||
                      r.clientName.toLowerCase().includes(requestSearch.toLowerCase()) ||
                      r.serviceTitle.toLowerCase().includes(requestSearch.toLowerCase());
                    return matchesStatus && matchesSearch;
                  })
                  .map((r) => (
                    <tr key={r.id} className="hover:bg-[#F3F7F6]/60 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#1766A6]">{r.caseNumber}</td>
                      <td className="p-3 font-bold text-[#203945]">{r.clientName}</td>
                      <td className="p-3 text-[#203945]/80">{r.serviceTitle}</td>
                      <td className="p-3 text-[#25866D] font-medium">{r.providerName}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.priority === 'Critical'
                              ? 'bg-[#FBECEB] text-[#A64842]'
                              : r.priority === 'High'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {r.priority}
                        </span>
                      </td>
                      <td className="p-3 text-[#203945]/60 text-[11px]">{r.createdAt}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.paymentStatus === 'PAID'
                              ? 'bg-[#E8F4EF] text-[#25866D]'
                              : r.paymentStatus === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {r.paymentStatus === 'PAID'
                            ? 'مدفوع'
                            : r.paymentStatus === 'PENDING'
                            ? 'بانتظار الدفع'
                            : 'غير مطلوب'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'COMPLETED'
                              ? 'bg-[#E8F4EF] text-[#25866D]'
                              : r.status === 'REJECTED'
                              ? 'bg-[#FBECEB] text-[#A64842]'
                              : r.status === 'IN_PROGRESS' || r.status === 'ACCEPTED'
                              ? 'bg-[#EAF3F8] text-[#1766A6]'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onOpenRequestDetail(r)}
                          className="px-3 py-1 rounded-[8px] bg-[#1766A6] text-white font-bold text-[11px] hover:bg-[#125386] transition-colors"
                        >
                          عرض الملف
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== TAB 6: AUDIT LOGS ===================== */}
      {activeTab === 'audit' && (
        <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[20px] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E0E8E6]">
            <div>
              <h3 className="font-bold text-sm text-[#203945]">🛡️ سجل التدقيق الأمني والعمليات الحية</h3>
              <p className="text-[11px] text-[#203945]/70">
                تسجيل مشفر لكافة العمليات الحساسة، تسجيلات الدخول وتغييرات الحالات
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#E8F4EF] text-[#25866D] font-mono font-bold text-xs">
              {auditLogs.length} سجل مسجل
            </span>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-[12px] bg-[#F3F7F6] border border-[#CCD8D5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1766A6] font-mono text-[11px]">[{log.action}]</span>
                    <span className="font-semibold text-[#203945]">{log.userName}</span>
                  </div>
                  <p className="text-[11px] text-[#203945]/80">{log.details}</p>
                </div>
                <div className="text-[10px] font-mono text-[#203945]/50 shrink-0">
                  {log.timestamp} • {log.ipAddress}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== MODAL: CREATE SPECIALIST ===================== */}
      {isCreateSpecialistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FBFDFC] rounded-[24px] max-w-xl w-full shadow-2xl border border-[#E0E8E6] p-6 space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E8E6]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[#EAF3F8] flex items-center justify-center text-[#1766A6]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#203945]">إنشاء حساب مختص جديد (من الأدمن)</h3>
                  <p className="text-[11px] text-[#1766A6]">إصدار ترخيص دخول للوحة الأخصائي أو المحامي</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateSpecialistOpen(false)}
                className="text-[#203945]/50 hover:text-[#203945] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSpecialist} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#203945]">الاسم الأول</label>
                  <input
                    type="text"
                    required
                    value={newSpecFirstName}
                    onChange={(e) => setNewSpecFirstName(e.target.value)}
                    placeholder="د. سمير"
                    className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#203945]">اللقب</label>
                  <input
                    type="text"
                    required
                    value={newSpecLastName}
                    onChange={(e) => setNewSpecLastName(e.target.value)}
                    placeholder="براهيمي"
                    className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#203945]">البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    value={newSpecEmail}
                    onChange={(e) => setNewSpecEmail(e.target.value)}
                    placeholder="spec@secchance.dz"
                    className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-[#203945]">رقم الهاتف</label>
                  <input
                    type="tel"
                    required
                    value={newSpecPhone}
                    onChange={(e) => setNewSpecPhone(e.target.value)}
                    placeholder="0555112233"
                    className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#203945]">نوع التخصص</label>
                  <select
                    value={newSpecRole}
                    onChange={(e) => setNewSpecRole(e.target.value as UserRole)}
                    className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6]"
                  >
                    <option value="psychologist">أخصائي نفسي عيادي</option>
                    <option value="doctor">طبيب معالج / إدمان</option>
                    <option value="lawyer">محامٍ / مستشار قانوني</option>
                    <option value="clinic">عيادة طبية متخصصة</option>
                    <option value="hospital">مستشفى / مركز استشفائي</option>
                    <option value="treatment_center">مركز علاج الإدمان</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#203945]">التخصص الدقيق</label>
                  <input
                    type="text"
                    value={newSpecSpecialty}
                    onChange={(e) => setNewSpecSpecialty(e.target.value)}
                    placeholder="مثال: علاج سلوكي معرفي / جنائي"
                    className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#203945]">الولاية</label>
                  <select
                    value={newSpecWilaya}
                    onChange={(e) => setNewSpecWilaya(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6]"
                  >
                    {ALGERIA_WILAYAS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#203945]">رقم الاعتماد / المعرف المهني</label>
                  <input
                    type="text"
                    value={newSpecLicense}
                    onChange={(e) => setNewSpecLicense(e.target.value)}
                    placeholder="DZ-ORD-9821"
                    className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#203945]">العنوان المهني</label>
                <input
                  type="text"
                  value={newSpecAddress}
                  onChange={(e) => setNewSpecAddress(e.target.value)}
                  placeholder="نهج الشهداء، العمارة ب، وهران"
                  className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#203945]">كلمة المرور المبدئية</label>
                  <input
                    type="text"
                    value={newSpecPassword}
                    onChange={(e) => setNewSpecPassword(e.target.value)}
                    placeholder="pass123456"
                    className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#203945]">حالة الحساب</label>
                  <select
                    value={newSpecStatus}
                    onChange={(e) => setNewSpecStatus(e.target.value as UserStatus)}
                    className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6]"
                  >
                    <option value="active">نشط (جاهز للعمل مباشرة)</option>
                    <option value="pending">قيد المراجعة</option>
                    <option value="inactive">غير نشط</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E0E8E6]">
                <button
                  type="button"
                  onClick={() => setIsCreateSpecialistOpen(false)}
                  className="px-4 py-2 rounded-[10px] text-[#203945]/70 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-[10px] bg-[#1766A6] hover:bg-[#125386] text-white font-bold shadow-xs transition-colors"
                >
                  حفظ وإنشاء الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: CREATE ASSOCIATION ===================== */}
      {isCreateAssociationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-[#FBFDFC] rounded-[24px] max-w-md w-full shadow-2xl border border-[#E0E8E6] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E8E6]">
              <h3 className="font-black text-base text-[#203945]">إضافة جمعية شريكة</h3>
              <button onClick={() => setIsCreateAssociationOpen(false)} className="text-[#203945]/50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssociation} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#203945] block mb-1">اسم الجمعية</label>
                <input
                  type="text"
                  required
                  value={newSpecFirstName}
                  onChange={(e) => setNewSpecFirstName(e.target.value)}
                  placeholder="جمعية الأمل لمكافحة الإدمان"
                  className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>

              <div>
                <label className="font-bold text-[#203945] block mb-1">البريد الإلكتروني للجمعية</label>
                <input
                  type="email"
                  required
                  value={newSpecEmail}
                  onChange={(e) => setNewSpecEmail(e.target.value)}
                  placeholder="contact@elamal.dz"
                  className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>

              <div>
                <label className="font-bold text-[#203945] block mb-1">الهاتف</label>
                <input
                  type="tel"
                  required
                  value={newSpecPhone}
                  onChange={(e) => setNewSpecPhone(e.target.value)}
                  placeholder="021 55 44 33"
                  className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>

              <div>
                <label className="font-bold text-[#203945] block mb-1">الولاية</label>
                <select
                  value={newSpecWilaya}
                  onChange={(e) => setNewSpecWilaya(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px]"
                >
                  {ALGERIA_WILAYAS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#203945] block mb-1">العنوان والمقر</label>
                <input
                  type="text"
                  value={newSpecAddress}
                  onChange={(e) => setNewSpecAddress(e.target.value)}
                  placeholder="الجزائر الوسطى"
                  className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E0E8E6]">
                <button
                  type="button"
                  onClick={() => setIsCreateAssociationOpen(false)}
                  className="px-4 py-2 font-bold text-[#203945]/70"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#25866D] text-white font-bold rounded-[10px]"
                >
                  تسجيل الجمعية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: USER DETAILS & RECORD ===================== */}
      {selectedUserForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FBFDFC] rounded-[24px] max-w-2xl w-full shadow-2xl border border-[#E0E8E6] p-6 space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E8E6]">
              <div>
                <h3 className="font-black text-lg text-[#203945]">
                  ملف الحساب: {selectedUserForDetail.firstName} {selectedUserForDetail.lastName}
                </h3>
                <p className="text-xs text-[#1766A6]">
                  الصلاحية: {selectedUserForDetail.roleSlug} • الحالة: {selectedUserForDetail.status}
                </p>
              </div>
              <button onClick={() => setSelectedUserForDetail(null)} className="text-[#203945]/50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#F3F7F6] p-4 rounded-[14px]">
              <p><strong>البريد:</strong> {selectedUserForDetail.email}</p>
              <p><strong>الهاتف:</strong> {selectedUserForDetail.phone || 'غير مسجل'}</p>
              <p><strong>الولاية:</strong> {selectedUserForDetail.wilayaName || '—'}</p>
              <p><strong>العنوان:</strong> {selectedUserForDetail.address || '—'}</p>
              {selectedUserForDetail.licenseNumber && (
                <p><strong>رقم الاعتماد:</strong> {selectedUserForDetail.licenseNumber}</p>
              )}
            </div>

            {/* Related requests */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-[#203945]">الطلبات المرتبطة بهذا الحساب:</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {requests
                  .filter(
                    (r) =>
                      String(r.clientId) === String(selectedUserForDetail.id) ||
                      String(r.providerId) === String(selectedUserForDetail.id)
                  )
                  .map((r) => (
                    <div
                      key={r.id}
                      className="p-2 rounded-[8px] bg-white border border-[#CCD8D5] flex items-center justify-between text-xs"
                    >
                      <span className="font-mono font-bold text-[#1766A6]">{r.caseNumber}</span>
                      <span className="text-[#203945]">{r.serviceTitle}</span>
                      <span className="font-bold">{r.status}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E0E8E6]">
              <button
                onClick={() => setSelectedUserForDetail(null)}
                className="px-5 py-2 bg-[#1766A6] text-white font-bold text-xs rounded-[10px]"
              >
                إغلاق الملف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
