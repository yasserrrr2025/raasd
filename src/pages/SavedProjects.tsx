import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, deleteProject } from '../services/db';
import { Link, useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Trash2, Edit, FileOutput, BookOpen, Clock } from 'lucide-react';
import { exportSubjectExcel, exportCombinedExcel } from '../utils/exportExcel';

export const SavedProjects = () => {
  const projects = useLiveQuery(async () => {
    const all = await db.projects.toArray();
    return all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  });
  const navigate = useNavigate();

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء.')) {
      await deleteProject(id);
    }
  };

  const handleExport = (project: any, e: React.MouseEvent) => {
    e.stopPropagation();
    exportSubjectExcel(project);
  };

  if (!projects) return <div className="text-center py-12">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">المشاريع المحفوظة</h2>
          <p className="text-gray-500 mt-1">يمكنك استعراض وتعديل التقارير السابقة أو طباعتها</p>
        </div>
        {projects.length > 0 && (
          <button
            onClick={() => exportCombinedExcel(projects)}
            className="flex items-center gap-2 px-4 py-2 bg-[#007A66] text-white text-sm font-medium rounded-lg hover:bg-[#005F4F] transition-colors shadow-sm"
          >
            <FileSpreadsheet size={18} />
            تصدير جمعي للمواد
          </button>
        )}
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
    </div>
  );
};
