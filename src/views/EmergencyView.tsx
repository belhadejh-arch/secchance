import React from 'react';
import { initialEmergencyResources } from '../data/initialData';
import { PhoneCall, ShieldAlert, Clock, Phone, AlertTriangle } from 'lucide-react';

export const EmergencyView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">
          دليل أرقام الطوارئ والنجدة الفورية
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          أرقام وطنية مجانية ومؤمنة متاحة للإبلاغ الطبي السريع، حالات الجرعات الزائدة، والتسممات
        </p>
      </div>

      {/* Emergency Notice Card */}
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 flex items-start gap-3 text-red-950">
        <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm leading-relaxed">
          <h3 className="font-extrabold text-red-900 text-sm">
            في حالات التسمم الحاد، الجرعات الزائدة، أو الاضطراب النفسي الشديد:
          </h3>
          <p className="text-red-800/90 font-normal">
            اتصل مباشرة وبدون تردد بأرقام الطوارئ أدناه. يتم التعامل مع كافة البلاغات الطارئة كأولوية قصوى لإنقاذ الأرواح وبسرية قانونية مطلقة.
          </p>
        </div>
      </div>

      {/* Resources Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {initialEmergencyResources.map((res) => (
          <div
            key={res.id}
            className="bg-white rounded-2xl border-2 border-red-100 hover:border-red-300 p-5 shadow-xs transition-all space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>متوفر 24/24 ساعة وطوال الأسبوع</span>
                </span>
                <span className="text-xl sm:text-2xl font-black text-red-600 tracking-wider">
                  {res.phoneNumber}
                </span>
              </div>

              <h3 className="font-extrabold text-base text-slate-900">
                {res.title}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                {res.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <a
                href={`tel:${res.phoneNumber}`}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>اتصل فوراً برقم {res.phoneNumber} (مجاناً)</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
