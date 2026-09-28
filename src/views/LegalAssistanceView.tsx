import React, { useState } from 'react';
import { User, Priority, ALGERIA_WILAYAS } from '../types';
import { initialUsers, initialServices } from '../data/initialData';
import { Scale, Lock, Upload, CheckCircle, ArrowRight } from 'lucide-react';

interface LegalAssistanceViewProps {
  currentUser: User | null;
  onSubmitLegalCase: (data: {
    serviceId: number;
    caseType: string;
    description: string;
    wilaya: string;
    lawyerId: number | string;
    attachedDocs: string[];
    priority: Priority;
  }) => void;
  onOpenAuth: () => void;
  onBack: () => void;
}

export const LegalAssistanceView: React.FC<LegalAssistanceViewProps> = ({
  currentUser,
  onSubmitLegalCase,
  onOpenAuth,
  onBack,
}) => {
  const caseTypes = [
    'طلب الاستفادة من العلاج الطوعي والإعفاء (المادة 6 من القانون 04-18)',
    'قضية حيازة للاستهلاك الشخصي والمرافقة القضائية',
    'طلب حماية أسرية وإجراءات التكفل الإجباري وفق القانون',
    'استشارة قانونية وتوجيه في التشريع الجزائي لمكافحة المخدرات',
    'إجراءات استرجاع الشهادة الطبية وإخطار النيابة العامة',
  ];

  const lawyers = initialUsers.filter((u) => u.roleSlug === 'lawyer');
  const legalService = initialServices.find((s) => s.category.includes('قانون')) || initialServices[1];

  const [description, setDescription] = useState('');
  const [caseType, setCaseType] = useState(caseTypes[0]);
  const [wilaya, setWilaya] = useState(currentUser?.wilayaName || '16. الجزائر العاصمة');
  const [selectedLawyerId, setSelectedLawyerId] = useState<number | string>(lawyers[0]?.id || 3);
  const [priority, setPriority] = useState<Priority>('High');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([
    'استدعاء_أو_محضر_قضائي_أولي.pdf',
  ]);
  const [newFileName, setNewFileName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAddFile = () => {
    if (!newFileName.trim()) return;
    setUploadedFiles([...uploadedFiles, newFileName.trim()]);
    setNewFileName('');
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!description.trim()) return;

    onSubmitLegalCase({
      serviceId: legalService.id,
      caseType,
      description,
      wilaya,
      lawyerId: selectedLawyerId,
      attachedDocs: uploadedFiles,
      priority,
    });

    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto bg-[#FBFDFC] rounded-[22px] border border-[#E5ECE9] p-6 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 bg-[#E8F4EF] text-[#25866D] rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h2 className="text-[20px] font-black text-[#203945]">
          تم إرسال طلب المساعدة القانونية بنجاح
        </h2>
        <p className="text-[13px] text-[#203945]/80 leading-relaxed">
          وصل طلبك إلى مكتب المحامي المعتمد. ستصلك إشعارات فورية عند قبول الطلب للانتقال إلى تأكيد الموعد وإتمام الدفع الإلكتروني (البطاقة الذهبية / CIB) ومتابعة القضية بسرية تامة.
        </p>
        <div className="bg-[#EAF3F8] p-3 rounded-[12px] text-xs font-bold text-[#104A78]">
          🔒 جميع مستنداتك وتفاصيل قضيتك محمية ومحجوبة عن البحث العام ومتاحة حصراً للمحامي الموكل.
        </div>
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-[12px] bg-[#1766A6] text-white font-bold text-xs shadow-xs hover:bg-[#125386] transition-colors"
        >
          الانتقال لمتابعة طلباتي
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs font-bold text-[#1766A6] hover:underline mb-1"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة</span>
          </button>
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="شعار منصة الفرصة الثانية"
              className="w-10 h-10 object-contain rounded-full border border-[#DCEBF4] bg-white p-0.5 shrink-0"
            />
            <div>
              <h1 className="text-[20px] font-black text-[#203945]">
                ⚖️ المساعدة القانونية المتخصصة
              </h1>
              <p className="text-[11px] text-[#203945]/70">
                مرافقة قانونية سرية واستشارات متخصصة وفق القانون الجزائري (القانون 04-18 وتعديلاته 23-05 و 25-03)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Confidentiality Banner (Requirement 20 & 21) */}
      <div className="bg-[#EAF3F8] border border-[#DCEBF4] rounded-[16px] p-3.5 flex items-start gap-3 shadow-xs">
        <Lock className="w-5 h-5 text-[#1766A6] shrink-0 mt-0.5" />
        <div className="text-[11px] text-[#104A78] leading-relaxed">
          <strong className="font-bold block text-[12px] mb-0.5">
            🔒 أمان وسرية تامة للملفات والوثائق القضائية:
          </strong>
          «هذا المستند خاص ولا يمكن الوصول إليه إلا من المستخدم والجهة المخولة.» تخضع جميع البيانات لنظام الصلاحيات الصارم وتشفير المستندات، مع تسجيل كل عملية دخول في سجل الرقابة (Audit Logs).
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-[#FBFDFC] rounded-[20px] border border-[#E5ECE9] p-5 sm:p-6 space-y-4 shadow-xs">
        {/* Step 1: Case Type */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-[#203945] block">
            1. نوع القضية أو الاستشارة القانونية
          </label>
          <select
            value={caseType}
            onChange={(e) => setCaseType(e.target.value)}
            className="w-full p-2.5 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[12px] outline-hidden focus:border-[#1766A6] text-[#203945]"
          >
            {caseTypes.map((t, idx) => (
              <option key={idx} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Problem Description */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-[#203945] block">
            2. صِف المشكلة والوقائع القانونية بدقة
          </label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="اشرح ملابسات القضية، التواريخ الهامة، الإجراءات المتخذة حتى الآن..."
            rows={4}
            className="w-full p-3 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[12px] outline-hidden focus:border-[#1766A6] text-[#203945] resize-none shadow-xs"
          />
        </div>

        {/* Step 3: Wilaya & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-[#203945] block">
              3. الولاية القضائية المختصة
            </label>
            <select
              value={wilaya}
              onChange={(e) => setWilaya(e.target.value)}
              className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[12px] outline-hidden focus:border-[#1766A6] text-[#203945]"
            >
              {ALGERIA_WILAYAS.map((w, idx) => (
                <option key={idx} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-[#203945] block">
              درجة الأولوية
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[12px] outline-hidden focus:border-[#1766A6] text-[#203945]"
            >
              <option value="Critical">🔴 عاجلة جداً (جلسة قريبة / توقيف)</option>
              <option value="High">🟠 عاجلة (تحقيق / استدعاء)</option>
              <option value="Medium">🟡 متوسطة (استشارة مسبقة)</option>
              <option value="Low">🟢 عادية (توجيه عام)</option>
            </select>
          </div>
        </div>

        {/* Step 4: Lawyer Selection */}
        <div className="space-y-2">
          <label className="text-[13px] font-bold text-[#203945] block">
            4. اختر المحامي المعتمد لمتابعة قضيتك
          </label>
          <div className="space-y-2">
            {lawyers.map((lawyer) => {
              const isSelected = selectedLawyerId === lawyer.id;
              return (
                <div
                  key={lawyer.id}
                  onClick={() => setSelectedLawyerId(lawyer.id)}
                  className={`p-3 rounded-[12px] border cursor-pointer transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#EAF3F8] border-[#1766A6]'
                      : 'bg-white border-[#CCD8D5] hover:bg-[#F3F7F6]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#1766A6] text-white flex items-center justify-center font-bold text-xs">
                      {lawyer.firstName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-[13px] text-[#203945]">
                        {lawyer.firstName} {lawyer.lastName}
                      </h4>
                      <p className="text-[11px] text-[#203945]/70">
                        محامٍ معتمد لدى منظمة المحامين • {lawyer.wilayaName || 'الجزائر العاصمة'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#25866D]">
                    {legalService.amountDzd.toLocaleString()} دج
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 5: Upload Confidential Documents (Requirement 21) */}
        <div className="space-y-2">
          <label className="text-[13px] font-bold text-[#203945] block">
            5. رفع الوثائق والمستندات القضائية / الطبية (اختياري)
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="اسم الملف (مثال: محضر_سماع_أقوال.pdf)..."
              className="flex-1 p-2 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6]"
            />
            <button
              type="button"
              onClick={handleAddFile}
              className="px-3 py-2 rounded-[10px] bg-[#25866D] hover:bg-[#1e6c58] text-white text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>إرفاق</span>
            </button>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {uploadedFiles.map((doc, i) => (
                <div
                  key={i}
                  className="bg-[#F3F7F6] p-2.5 rounded-[10px] border border-[#CCD8D5] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Lock className="w-3.5 h-3.5 text-[#1766A6] shrink-0" />
                    <span className="font-medium text-[#203945] truncate">{doc}</span>
                    <span className="text-[10px] bg-[#EAF3F8] text-[#104A78] px-1.5 py-0.5 rounded font-bold shrink-0">
                      مشفر
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(i)}
                    className="text-[#A64842] hover:underline font-bold text-[11px] shrink-0 mr-2"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full h-[50px] rounded-[14px] bg-[#1766A6] hover:bg-[#125386] text-white font-bold text-[14px] shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Scale className="w-4 h-4" />
            <span>إرسال الطلب للمحامي المعتمد بأمان</span>
          </button>
          <p className="text-[11px] text-center text-[#203945]/60 mt-2">
            سيتم إشعار المحامي فوراً لاستلام الطلب ومراجعته وتحديد الموعد.
          </p>
        </div>
      </form>
    </div>
  );
};
