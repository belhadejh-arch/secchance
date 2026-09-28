import React, { useState } from 'react';
import { X } from 'lucide-react';
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

  const roles = [
    { key: 'family', label: 'عائلة / مواطن (ولي أمر أو باحث عن علاج وعمليات دفع)' },
    { key: 'psychologist', label: 'أخصائي نفسي عيادي (لوحة الطلبات في انتظارك والتفارير)' },
    { key: 'lawyer', label: 'مستشار قانوني ومحامٍ (استشارات وقضايا)' },
    { key: 'treatment_center', label: 'مركز علاج الإدمان (إدارة الأسرة وإزالة السموم)' },
    { key: 'clinic', label: 'العيادة الطبية المتخصصة (إدارة الأطباء والمواعيد)' },
    { key: 'association', label: 'جمعية خيرية ومرافقة اجتماعية' },
    { key: 'admin', label: 'الإدارة العامة للمنصة (لوحة التحكم الشاملة والمدفوعات)' },
  ];

  const handleConfirm = () => {
    const matchedUser = initialUsers.find((u) => u.roleSlug === selectedRole) || initialUsers[0];
    onLogin(matchedUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-[#FBFDFC] rounded-[20px] max-w-lg w-full shadow-lg border border-[#E5ECE9] overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[20px] font-black text-[#203945]">
              تسجيل الدخول وربط الأطراف
            </h3>
            <p className="text-[12px] text-[#203945]/70 mt-0.5">
              اختر دور الحساب لاستعراض اللوحة والعمليات المرتبطة بها
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#203945]/50 hover:text-[#203945] p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {roles.map((r) => {
            const isSelected = selectedRole === r.key;
            return (
              <div
                key={r.key}
                onClick={() => setSelectedRole(r.key)}
                className={`p-3.5 rounded-[14px] border cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#EAF3F8] border-[#1766A6]'
                    : 'bg-[#FBFDFC] border-[#E5ECE9] hover:bg-[#F3F7F6]'
                }`}
              >
                <span
                  className={`text-[13px] ${
                    isSelected ? 'font-bold text-[#104A78]' : 'text-[#203945]'
                  }`}
                >
                  {r.label}
                </span>
                <input
                  type="radio"
                  name="roleRadio"
                  checked={isSelected}
                  onChange={() => setSelectedRole(r.key)}
                  className="accent-[#1766A6] w-4 h-4 shrink-0"
                />
              </div>
            );
          })}
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={handleConfirm}
            className="w-full h-[48px] rounded-[12px] bg-[#1766A6] hover:bg-[#125386] text-white font-bold text-[14px] transition-colors"
          >
            دخول الحساب واستعراض اللوحة
          </button>

          <button
            onClick={onClose}
            className="w-full h-[48px] rounded-[12px] border border-[#CCD8D5] text-[#203945] font-semibold text-xs hover:bg-[#FBFDFC] transition-colors"
          >
            رجوع للرئيسية
          </button>
        </div>
      </div>
    </div>
  );
};
