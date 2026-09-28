import React, { useState } from 'react';
import { X, UserCheck, ShieldCheck, HeartPulse, Scale, Building2, Users } from 'lucide-react';
import { User } from '../types';
import { initialUsers } from '../data/initialData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('family');

  if (!isOpen) return null;

  const roleOptions = [
    {
      role: 'family',
      title: 'عائلة / مواطن (ولي أمر أو مستفيد)',
      desc: 'طلب خدمات، متابعة الحالات، الدفع بالذهبية / CIB واستعراض التقارير',
      icon: Users,
      badge: 'مواطن / أسرة',
    },
    {
      role: 'psychologist',
      title: 'د. أمين منصوري (أخصائي نفسي عيادي)',
      desc: 'لوحة الطلبات في انتظارك، قبول/رفض، تحرير تقارير المتابعة والمواعيد',
      icon: HeartPulse,
      badge: 'أخصائي نفسي',
    },
    {
      role: 'lawyer',
      title: 'أستاذ ياسين بوعلام (مستشار قانوني ومحامٍ)',
      desc: 'استشارات قانونية وفق القانون 04-18 والمادة 6، مواكبة القضايا',
      icon: Scale,
      badge: 'مستشار قانوني',
    },
    {
      role: 'treatment_center',
      title: 'مركز الأمل العلاجي (مركز علاج الإدمان)',
      desc: 'إدارة أسرّة إزالة السموم والرعاية النهارية والتنسيق الطبي',
      icon: Building2,
      badge: 'مركز علاجي',
    },
    {
      role: 'clinic',
      title: 'العيادة الطبية المتخصصة الشفاء',
      desc: 'الفحوصات الطبية والمتابعة العيادية للمتعافين',
      icon: HeartPulse,
      badge: 'عيادة متخصصة',
    },
    {
      role: 'association',
      title: 'جمعية النجاة الخيرية',
      desc: 'برامج المرافقة الاجتماعية والتوعية الميدانية والإرشاد الأسري',
      icon: Users,
      badge: 'جمعية شريكة',
    },
    {
      role: 'admin',
      title: 'المشرف العام (الإدارة المركزية للمنصة)',
      desc: 'لوحة التحكم الشاملة، إدارة كل الطلبات، سجل المدفوعات والإيرادات',
      icon: ShieldCheck,
      badge: 'إدارة المنصة',
    },
  ];

  const handleConfirm = () => {
    const matchedUser = initialUsers.find((u) => u.roleSlug === selectedRole) || initialUsers[0];
    onLogin(matchedUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              تسجيل الدخول وربط الأطراف
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              اختر دور الحساب لاستعراض اللوحة والعمليات المرتبطة بها
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Roles List */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2.5">
          {roleOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedRole === opt.role;

            return (
              <div
                key={opt.role}
                onClick={() => setSelectedRole(opt.role)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                      {opt.title}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-snug">{opt.desc}</p>
                </div>

                <input
                  type="radio"
                  name="userRole"
                  checked={isSelected}
                  onChange={() => setSelectedRole(opt.role)}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            <span>دخول الحساب واستعراض اللوحة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
