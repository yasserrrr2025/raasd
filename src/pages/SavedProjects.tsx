import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, deleteProject } from '../services/db';
import { Link, useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Trash2, Edit, FileOutput, BookOpen, Clock, AlertTriangle, Download, Upload } from 'lucide-react';
import { exportSubjectExcel, exportCombinedExcel } from '../utils/exportExcel';

export const SavedProjects = () => {
  const projects = useLiveQuery(async () => {
    const all = await db.projects.toArray();
    return all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  });
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<'all' | number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteTarget === 'all') {
      await db.projects.clear();
    } else if (typeof deleteTarget === 'number') {
      await deleteProject(deleteTarget);
    }
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const handleExportBackup = async () => {
    try {
      const allProjects = await db.projects.toArray();
      const backupData = JSON.stringify(allProjects, null, 2);
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `markzy_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('حدث خطأ أثناء إنشاء النسخة الاحتياطية');
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          // Remove potential existing IDs to avoid conflict, or use bulkPut which overwrites if ID exists.
          // Since the user is importing their own backup, we use bulkPut to merge/overwrite.
          await db.projects.bulkPut(data);
          alert('تم استيراد النسخة الاحتياطية بنجاح!');
        } else {
          alert('ملف النسخة الاحتياطية غير صالح.');
        }
      } catch (error) {
        alert('حدث خطأ أثناء استيراد الملف. يرجى التأكد من أنه ملف نسخ احتياطي صالح.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleExport = (project: any, e: React.MouseEvent) => {
    e.stopPropagation();
    exportSubjectExcel(project);
  };

  if (!projects) return <div className="text-center py-12">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">المشاريع المحفوظة</h2>
          <p className="text-gray-500 mt-1">يمكنك استعراض وتعديل التقارير السابقة أو طباعتها</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Hidden File Input */}
          <input 
            type="file" 
            accept=".json" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImportBackup} 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            title="استيراد نسخة احتياطية من جهازك"
          >
            <Upload size={16} />
            استيراد نسخة
          </button>

          {projects.length > 0 && (
            <>
              <button
                onClick={handleExportBackup}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                title="تنزيل نسخة احتياطية لجميع المشاريع"
              >
                <Download size={16} />
                تصدير نسخة
              </button>
              <button
                onClick={() => {
                  setDeleteTarget('all');
                  setShowDeleteModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors shadow-sm"
              >
                <Trash2 size={16} />
                حذف الكل
              </button>
              <button
                onClick={() => exportCombinedExcel(projects)}
                className="flex items-center gap-2 px-4 py-2 bg-[#007A66] text-white text-sm font-medium rounded-lg hover:bg-[#005F4F] transition-colors shadow-sm"
              >
                <FileSpreadsheet size={16} />
                تصدير إكسل جمعي
              </button>
            </>
          )}
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">لا توجد مشاريع</h3>
          <p className="text-gray-500 mt-2 mb-6">لم تقم بإنشاء أي تقارير بعد.</p>
          <Link
            to="/setup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium bg-[#007A66] text-white hover:bg-[#005F4F]"
          >
            إنشاء تقرير جديد
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div 
              key={project.id} 
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[#007A66] hover:shadow-md transition-all cursor-pointer group"
              onClick={() => navigate(`/project/${project.projectId}/review`)}
            >
              <div className="p-5 border-b border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {project.subject}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => handleExport(project, e)}
                      className="text-gray-400 hover:text-[#007A66] transition-colors p-1"
                      title="تصدير إكسل"
                    >
                      <FileSpreadsheet size={18} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/project/${project.projectId}/report`);
                      }}
                      className="text-gray-400 hover:text-[#007A66] transition-colors p-1"
                      title="عرض التقرير"
                    >
                      <FileOutput size={18} />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(project.id!, e)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="حذف"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.schoolName}</h3>
                <p className="text-sm text-gray-500">{project.grade} - {project.term}</p>
              </div>
              
              <div className="bg-gray-50 p-4 text-sm flex justify-between items-center text-gray-600">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{project.students?.length || 0}</span> طالب
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock size={14} />
                  {new Date(project.updatedAt).toLocaleDateString('ar-SA')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">تأكيد الحذف</h3>
              <p className="text-gray-500 mb-6 leading-relaxed">
                {deleteTarget === 'all' 
                  ? 'هل أنت متأكد من رغبتك في حذف جميع المشاريع والبيانات المحفوظة؟ لن تتمكن من استعادة هذه البيانات لاحقاً.'
                  : 'هل أنت متأكد من رغبتك في حذف هذا المشروع؟ لا يمكن التراجع عن هذا الإجراء.'}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm"
                >
                  نعم، احذف نهائياً
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  تراجع
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
