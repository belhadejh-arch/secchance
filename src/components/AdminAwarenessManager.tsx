import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Upload, 
  Plus, 
  FileText, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Eye, 
  Download, 
  Share2, 
  X, 
  Calendar, 
  User, 
  Tag, 
  GraduationCap, 
  Sparkles, 
  FileCheck, 
  Layers,
  FileUp,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../services/api';
import { AwarenessArticle } from '../types';

interface AdminAwarenessManagerProps {
  onNotify?: (msg: string) => void;
}

export const AdminAwarenessManager: React.FC<AdminAwarenessManagerProps> = ({ onNotify }) => {
  const [articles, setArticles] = useState<AwarenessArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<AwarenessArticle | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'دراسة علمية محكّمة',
    topic: 'المؤثرات العقلية والأدوية المهدئة',
    author: '',
    summary: '',
    content: '',
    tags: '',
    status: 'published' as 'published' | 'draft',
    is_featured: false,
    file_name: '',
    file_size: '',
    file_url: ''
  });

  // Drag and Drop state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'دراسة علمية محكّمة',
    'علم السموم والأبحاث المخبرية',
    'دليل إرشادي ووقائي',
    'تقرير إحصائي وميداني',
    'مقال توعوي وتثقيفي'
  ];

  const topics = [
    'المؤثرات العقلية والأدوية المهدئة',
    'المخدرات التخليقية (الكريستال ميث / الشبو)',
    'القنب الهندي ومستخلصاته',
    'الأفيونيات ومشتقاتها',
    'الإرشاد والتوعية الأسرية',
    'طب الإدمان وإزالة السموم',
    'التشريعات وحماية المتعاطي المتعالج'
  ];

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await api.getAwarenessArticles({ status: 'all' });
      setArticles(res.data || []);
    } catch (err) {
      console.error('Failed to load awareness articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // Handle file selection (both manual click and drag-and-drop)
  const processFile = (file: File) => {
    setUploadError(null);
    const maxSizeBytes = 15 * 1024 * 1024; // 15MB limit

    if (file.size > maxSizeBytes) {
      setUploadError('حجم الملف كبير جداً. الحد الأقصى المسموح به هو 15 ميغابايت.');
      return;
    }

    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} بايت`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} كيلوبايت`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} ميغابايت`;
    };

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      setFormData(prev => ({
        ...prev,
        file_name: file.name,
        file_size: formatSize(file.size),
        file_url: base64Url
      }));
    };
    reader.onerror = () => {
      setUploadError('حدث خطأ أثناء قراءة الملف. يرجى المحاولة مرة أخرى.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleManualFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({
      ...prev,
      file_name: '',
      file_size: '',
      file_url: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      category: 'دراسة علمية محكّمة',
      topic: 'المؤثرات العقلية والأدوية المهدئة',
      author: '',
      summary: '',
      content: '',
      tags: '',
      status: 'published',
      is_featured: false,
      file_name: '',
      file_size: '',
      file_url: ''
    });
    setUploadError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (article: AwarenessArticle) => {
    setEditingId(article.id);
    setFormData({
      title: article.title,
      category: article.category,
      topic: article.topic || 'المؤثرات العقلية والأدوية المهدئة',
      author: article.author || '',
      summary: article.summary,
      content: article.content || '',
      tags: article.tags || '',
      status: article.status,
      is_featured: Boolean(article.is_featured),
      file_name: article.file_name || '',
      file_size: article.file_size || '',
      file_url: article.file_url || ''
    });
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!formData.title.trim()) {
      setUploadError('يرجى إدخال عنوان الدراسة أو المنشور التوعوي');
      return;
    }

    if (!formData.summary.trim()) {
      setUploadError('يرجى كتابة ملخص موجز لأهداف ونتائج المادة العلمية');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await api.updateAwarenessArticle(editingId, formData);
        if (onNotify) onNotify('تم تحديث بيانات الدراسة العلمية بنجاح.');
      } else {
        await api.createAwarenessArticle(formData);
        if (onNotify) onNotify('تم رفع ونشر المادة العلمية التوعوية بنجاح.');
      }
      setIsModalOpen(false);
      fetchArticles();
    } catch (err: any) {
      setUploadError(err.message || 'فشل في حفظ الدراسة');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف: "${title}"؟`)) {
      return;
    }

    try {
      await api.deleteAwarenessArticle(id);
      fetchArticles();
      if (onNotify) onNotify('تم حذف المادة العلمية بنجاح.');
    } catch (err: any) {
      alert(err.message || 'فشل حذف المادة');
    }
  };

  const handleToggleStatus = async (article: AwarenessArticle) => {
    const nextStatus = article.status === 'published' ? 'draft' : 'published';
    try {
      await api.updateAwarenessArticle(article.id, { status: nextStatus });
      fetchArticles();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredArticles = articles.filter(a => {
    const matchesCategory = selectedCategory === 'all' || a.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || a.status === selectedStatus;
    const matchesSearch = 
      !searchQuery.trim() ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.topic && a.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.author && a.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.tags && a.tags.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesStatus && matchesSearch;
  });

  // Calculate quick stats
  const totalStudies = articles.length;
  const scientificCount = articles.filter(a => a.category.includes('علمية') || a.category.includes('مخبرية')).length;
  const filesCount = articles.filter(a => a.has_file || (a.file_name && a.file_name.length > 0)).length;
  const totalViews = articles.reduce((acc, a) => acc + (a.views_count || 0), 0);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header & Quick Stats */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-900 font-black text-lg sm:text-xl">
              <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <GraduationCap className="w-5 h-5" />
              </span>
              <h2>مكتبة التوعية والدراسات العلمية</h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
              إدارة، رفع ونشر الأبحاث السريرية المحكّمة، التقارير الوبائية عن المؤثرات العقلية والمخدرات، والدلائل التوعوية التثقيفية لعموم الزوار والمهنيين.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1565C0] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>رفع ونشر دراسة جديدة</span>
          </button>
        </div>

        {/* 4 Quick Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-[#1565C0] flex items-center justify-center font-black">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500">إجمالي المنشورات</div>
              <div className="text-lg font-black text-slate-900 font-mono">{totalStudies}</div>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-800">أبحاث ودراسات محكّمة</div>
              <div className="text-lg font-black text-emerald-950 font-mono">{scientificCount}</div>
            </div>
          </div>

          <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-black">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-purple-800">ملفات مرفقة للتحميل</div>
              <div className="text-lg font-black text-purple-950 font-mono">{filesCount}</div>
            </div>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-black">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-800">مشاهدات المستفيدين</div>
              <div className="text-lg font-black text-amber-950 font-mono">{totalViews}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث بعنوان الدراسة، اسم الباحث، المادة المعنية (ليريكا، الشبو...) أو الكلمات الدلالية..."
            className="w-full bg-slate-50 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-800 placeholder-slate-400 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-[#1565C0] transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#1565C0]"
          >
            <option value="all">جميع التصنيفات</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#1565C0]"
          >
            <option value="all">كل الحالات</option>
            <option value="published">منشور للعموم</option>
            <option value="draft">مسودة داخلية</option>
          </select>
        </div>
      </div>

      {/* Studies / Publications Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs font-bold">
          جارٍ تحميل المواد العلمية والتوعوية...
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-700">لا توجد دراسات أو منشورات مطابقة للبحث</h3>
          <p className="text-xs text-slate-400">يمكنك رفع دراسة علمية جديدة أو تعديل معايير التصفية أعلاه.</p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#1565C0] text-white text-xs font-bold rounded-xl shadow-xs"
          >
            نشر دراسة الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredArticles.map((article) => {
            const hasFile = Boolean(article.has_file || article.file_url || article.file_name);
            return (
              <div
                key={article.id}
                className={`bg-white rounded-2xl p-5 border transition-all hover:shadow-md flex flex-col justify-between gap-4 ${
                  article.status === 'published' ? 'border-slate-200/90' : 'border-dashed border-amber-300 bg-amber-50/20'
                }`}
              >
                <div className="space-y-3">
                  {/* Category & Status Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-[#1565C0] border border-blue-100 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>{article.category}</span>
                      </span>

                      {article.topic && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                          {article.topic}
                        </span>
                      )}

                      {Boolean(article.is_featured) && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-100 text-amber-900 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>مثبّت في الواجهة</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(article)}
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
                          article.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                        title="انقر لتغيير حالة النشر"
                      >
                        {article.status === 'published' ? 'منشور للعموم ✓' : 'مسودة داخلية ⏳'}
                      </button>

                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{article.views_count || 0}</span>
                      </span>
                    </div>
                  </div>

                  {/* Title & Summary */}
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-snug hover:text-[#1565C0] transition-colors cursor-pointer"
                        onClick={() => { setSelectedArticle(article); setIsReaderOpen(true); }}>
                      {article.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1.5 line-clamp-2">
                      {article.summary}
                    </p>
                  </div>

                  {/* Author, Institution, and Attached File pill */}
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    {article.author && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-700">{article.author}</span>
                      </span>
                    )}

                    {article.created_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(article.created_at).toLocaleDateString('ar-DZ')}</span>
                      </span>
                    )}

                    {/* Attached file badge */}
                    {hasFile ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="truncate max-w-[200px]">{article.file_name || 'ملف الدراسة المرفق'}</span>
                        {article.file_size && <span className="text-[10px] text-emerald-600 font-mono">({article.file_size})</span>}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">بدون ملف مرفق</span>
                    )}
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1">
                    {article.tags?.split(',').map((tag, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setSelectedArticle(article); setIsReaderOpen(true); }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>قراءة ومعاينة</span>
                    </button>

                    {hasFile && article.file_url && (
                      <a
                        href={article.file_url}
                        download={article.file_name || 'study-document.pdf'}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold transition-colors cursor-pointer"
                        title="تحميل الملف المرفق"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تحميل الملف</span>
                      </a>
                    )}

                    <button
                      onClick={() => openEditModal(article)}
                      className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1565C0] transition-colors cursor-pointer"
                      title="تعديل الدراسة"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(article.id, article.title)}
                      className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                      title="حذف المادة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Upload / Publish Scientific Study */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1565C0] flex items-center justify-center font-bold">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    {editingId ? 'تعديل دراسة أو منشور علمي' : 'رفع ونشر دراسة علمية / مادة توعوية'}
                  </h3>
                  <p className="text-xs text-slate-500">إضافة أبحاث محكّمة وتقارير سمومية وتثقيفية لحماية المجتمع</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {uploadError && (
              <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
              {/* Title */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">عنوان الدراسة أو المنشور العلمي <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: دراسة سريرية ومخبرية حول التداعيات العصبية للبريغابالين ومخاطر الجرعات الزائدة..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#1565C0]"
                />
              </div>

              {/* Category & Topic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">نوع وتصنيف المادة العلمية</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#1565C0] font-bold"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">المادة أو الموضوع المعني (المخدرات/المؤثرات)</label>
                  <select
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#1565C0] font-bold"
                  >
                    {topics.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Author & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">الباحث / الهيئة العلمية المصدرة</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="مثال: المعهد الوطني للسموم، د. أحمد بلقاسم..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#1565C0]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">الكلمات المفتاحية والوسوم (مفصولة بفواصل)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="مؤثرات عقلية, سموم, فطام, وقاية أسرية..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#1565C0]"
                  />
                </div>
              </div>

              {/* Summary / Abstract */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">ملخص الدراسة وأهم النتائج (Abstract) <span className="text-red-500">*</span></label>
                <textarea
                  rows={3}
                  required
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="ملخص تنفيذي يبرز هدف البحث والمنهجية العلمية والنتائج الرئيسية والتوصيات الموجهة للأطباء والمجتمع..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#1565C0]"
                />
              </div>

              {/* Full Content */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">النص التفصيلي للدراسة والمحاور والتوصيات (اختياري)</label>
                <textarea
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="المقدمة، المنهجية، النتائج المخبرية والسريرية، والتوصيات الوقائية والعلاجية الكاملة..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#1565C0]"
                />
              </div>

              {/* FILE UPLOAD: Drag & Drop AND Manual Selection via Click */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  رفع ملف الدراسة (PDF أو مستند وثائقي)
                </label>
                
                {formData.file_name ? (
                  <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-emerald-950 text-xs">{formData.file_name}</div>
                        <div className="text-[10px] text-emerald-700 font-mono mt-0.5">{formData.file_size} — جاهز للنشر والتحميل</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-100 rounded-lg transition-colors font-bold cursor-pointer"
                    >
                      إزالة الملف
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-6 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
                        : 'border-slate-300 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-400'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleManualFileChange}
                      accept=".pdf,.doc,.docx,.txt,.pptx"
                      className="hidden"
                    />
                    <FileUp className="w-8 h-8 text-[#1565C0] mx-auto mb-2" />
                    <div className="text-xs font-bold text-slate-800">
                      اسحب وأسقط ملف الدراسة هنا، أو <span className="text-[#1565C0] underline">انقر للتصفح اليدوي</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      يدعم ملفات PDF، Word، والمستندات العلمية حتى 15 ميغابايت
                    </p>
                  </div>
                )}
              </div>

              {/* Status and Featured toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="status-checkbox"
                    checked={formData.status === 'published'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'published' : 'draft' })}
                    className="w-4 h-4 text-[#1565C0] rounded"
                  />
                  <label htmlFor="status-checkbox" className="font-bold text-slate-800 text-xs cursor-pointer">
                    نشر للعموم فوراً على المنصة (مرئي في خانة التوعية)
                  </label>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="featured-checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4 text-[#1565C0] rounded"
                  />
                  <label htmlFor="featured-checkbox" className="font-bold text-slate-800 text-xs cursor-pointer">
                    تثبيت المادة في مقدمة البوابة التوعوية
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-[#1565C0] hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'جارٍ الحفظ...' : editingId ? 'تحديث ونشر التعديلات' : 'نشر الدراسة العلمية'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Full Study Reader & Preview */}
      {isReaderOpen && selectedArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            {/* Reader Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-[#1565C0]">
                    {selectedArticle.category}
                  </span>
                  {selectedArticle.topic && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700">
                      {selectedArticle.topic}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedArticle.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedArticle.status === 'published' ? 'منشور للعموم' : 'مسودة داخلية'}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                  {selectedArticle.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {selectedArticle.author && (
                    <span className="font-semibold text-slate-700">إعداد: {selectedArticle.author}</span>
                  )}
                  {selectedArticle.created_at && (
                    <span>{new Date(selectedArticle.created_at).toLocaleDateString('ar-DZ')}</span>
                  )}
                  <span>{selectedArticle.views_count || 0} قراءة</span>
                </div>
              </div>

              <button
                onClick={() => setIsReaderOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Attached File Download Banner (if any) */}
            {(selectedArticle.file_url || selectedArticle.file_name) && (
              <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-blue-950 text-xs">{selectedArticle.file_name || 'ملف الدراسة بصيغة PDF'}</div>
                    <div className="text-[10px] text-blue-700 font-mono">{selectedArticle.file_size || 'وثيقة رقمية معتمدة'}</div>
                  </div>
                </div>

                {selectedArticle.file_url && (
                  <a
                    href={selectedArticle.file_url}
                    download={selectedArticle.file_name || 'research-paper.pdf'}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1565C0] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل المستند الأصلي</span>
                  </a>
                )}
              </div>
            )}

            {/* Executive Summary Box */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-1.5">
              <h4 className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#1565C0]" />
                <span>ملخص الدراسة (Abstract)</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                {selectedArticle.summary}
              </p>
            </div>

            {/* Full Content Body */}
            {selectedArticle.content && (
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-700">تفاصيل المادة العلمية والنتائج</h4>
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-white p-4 rounded-2xl border border-slate-100">
                  {selectedArticle.content}
                </div>
              </div>
            )}

            {/* Tags */}
            {selectedArticle.tags && (
              <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-500 ml-1">الكلمات الدلالية:</span>
                {selectedArticle.tags.split(',').map((t, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg font-medium">
                    #{t.trim()}
                  </span>
                ))}
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => { setIsReaderOpen(false); openEditModal(selectedArticle); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                تعديل المادة
              </button>
              <button
                onClick={() => setIsReaderOpen(false)}
                className="px-5 py-2 bg-[#1565C0] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
