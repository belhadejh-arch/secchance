import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Search, 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  User, 
  Sparkles, 
  BookOpen, 
  X,
  Share2,
  Tag
} from 'lucide-react';
import { api } from '../services/api';
import { AwarenessArticle } from '../types';

export const AwarenessStudiesView: React.FC = () => {
  const [studies, setStudies] = useState<AwarenessArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedStudy, setSelectedStudy] = useState<AwarenessArticle | null>(null);

  useEffect(() => {
    loadStudies();
  }, []);

  const loadStudies = async () => {
    try {
      setLoading(true);
      const res = await api.getAwarenessArticles({ status: 'published' });
      setStudies(res.data || []);
    } catch (err) {
      console.error('Failed to load published studies:', err);
    } finally {
      setLoading(false);
    }
  };

  const topics = [
    'الكل',
    'المؤثرات العقلية والمهدئات',
    'المخدرات التخليقية',
    'الإرشاد والتوعية الأسرية'
  ];

  const filteredStudies = studies.filter(s => {
    const matchesTopic = selectedTopic === 'all' || s.topic?.includes(selectedTopic) || selectedTopic === 'الكل';
    const matchesSearch = 
      !searchQuery.trim() ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.topic && s.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.tags && s.tags.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesTopic && matchesSearch;
  });

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-purple-900 to-indigo-900 text-white rounded-3xl p-5 sm:p-6 shadow-md space-y-3">
        <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold">
          <GraduationCap className="w-4 h-4" />
          <span>المكتبة العلمية والتوعوية المعتمدة</span>
        </div>
        <h2 className="text-lg sm:text-xl font-black leading-snug">
          أحدث الأبحاث والدراسات العلمية حول المؤثرات العقلية والمخدرات 🇩🇿
        </h2>
        <p className="text-xs text-purple-100 max-w-2xl leading-relaxed">
          دراسات سريرية، تقارير سمومية، وحقائب توعوية أسرية محكّمة صادرة عن أخصائيين وهيئات وطنية متخصصة لرفع الوعي الصحي المجتمعي.
        </p>

        {/* Search Input inside banner */}
        <div className="relative max-w-lg pt-1">
          <Search className="w-4 h-4 text-purple-300 absolute right-3.5 top-1/2 -translate-y-1/2 pt-1" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بموضوع الدراسة، المخدر المعني (بريغابالين، الشبو...) أو الكلمات الدلالية..."
            className="w-full bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 rounded-2xl pr-10 pl-4 py-2.5 text-xs placeholder-purple-200 focus:placeholder-slate-400 outline-none transition-all border border-white/20"
          />
        </div>
      </div>

      {/* Topics Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {topics.map(t => (
          <button
            key={t}
            onClick={() => setSelectedTopic(t)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              (selectedTopic === t || (t === 'الكل' && selectedTopic === 'all'))
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Studies Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-bold">
          جارٍ تحميل الدراسات العلمية...
        </div>
      ) : filteredStudies.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-300 text-slate-500 text-xs space-y-2">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-bold">لا توجد دراسات منشورة مطابقة لمعايير البحث الحالية.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStudies.map((study) => (
            <div
              key={study.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-purple-50 text-purple-700 border border-purple-100">
                    {study.category}
                  </span>
                  {study.topic && (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {study.topic}
                    </span>
                  )}
                </div>

                <h3 
                  onClick={() => setSelectedStudy(study)}
                  className="font-black text-sm text-slate-900 leading-snug hover:text-purple-700 transition-colors cursor-pointer"
                >
                  {study.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {study.summary}
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  {study.author && (
                    <span className="font-medium text-slate-600 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{study.author}</span>
                    </span>
                  )}
                  {study.views_count !== undefined && (
                    <span className="flex items-center gap-1 font-mono">
                      <Eye className="w-3 h-3" />
                      <span>{study.views_count}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => setSelectedStudy(study)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>قراءة الدراسة</span>
                  </button>

                  {(study.file_url || study.file_name) && (
                    <a
                      href={study.file_url || '#'}
                      download={study.file_name || 'scientific-study.pdf'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors cursor-pointer border border-emerald-200"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل PDF {study.file_size ? `(${study.file_size})` : ''}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Reader Modal for Public Users */}
      {selectedStudy && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-1.5">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-100 text-purple-800">
                  {selectedStudy.category}
                </span>
                <h3 className="font-black text-base sm:text-lg text-slate-900 leading-snug">
                  {selectedStudy.title}
                </h3>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>✍️ {selectedStudy.author || 'إدارة المنصة'}</span>
                  {selectedStudy.created_at && (
                    <span>• {new Date(selectedStudy.created_at).toLocaleDateString('ar-DZ')}</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedStudy(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Download File banner */}
            {(selectedStudy.file_url || selectedStudy.file_name) && (
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-950 text-xs">{selectedStudy.file_name || 'ملف البحث المرفق'}</div>
                    <div className="text-[10px] text-emerald-700 font-mono">{selectedStudy.file_size || 'وثيقة رسمية'}</div>
                  </div>
                </div>

                {selectedStudy.file_url && (
                  <a
                    href={selectedStudy.file_url}
                    download={selectedStudy.file_name || 'study.pdf'}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل المستند</span>
                  </a>
                )}
              </div>
            )}

            {/* Summary Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
              <div className="font-bold text-xs text-slate-800">الملخص التنفيذي وأهم النتائج:</div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {selectedStudy.summary}
              </p>
            </div>

            {/* Content Body */}
            {selectedStudy.content && (
              <div className="space-y-1.5">
                <div className="font-bold text-xs text-slate-800">النص الكامل والتوصيات العلمية:</div>
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-white p-4 rounded-xl border border-slate-100">
                  {selectedStudy.content}
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedStudy(null)}
                className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
