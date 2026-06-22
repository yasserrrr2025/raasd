import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectById, saveProject } from '../services/db';
import { ProjectData, StudentRecord } from '../types';
import { calculateGradeAndPercentage } from '../utils/gradeScale';
import { AlertTriangle, Check, X, Edit2, Save, FileOutput } from 'lucide-react';

export const ReviewData = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [filter, setFilter] = useState('الكل');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Quick Zero Action state
  const [showZeroResolver, setShowZeroResolver] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      if (id) {
        const p = await getProjectById(id);
        if (p) {
          setProject(p);
          // Check if there are 0s
          const hasZeros = p.students.some(s => s.score === 0);
          if (hasZeros) setShowZeroResolver(true);
        } else {
          navigate('/');
        }
      }
    };
    loadProject();
  }, [id, navigate]);

  const updateStudent = async (studentId: string, updates: Partial<StudentRecord>) => {
    if (!project) return;
    
    let newStudents = project.students.map(s => {
      if (s.id === studentId) {
        const updated = { ...s, ...updates };
        // Recalculate percentage if score changed
        if (updates.score !== undefined) {
           const { gradeScale, percentage } = calculateGradeAndPercentage(updates.score);
           updated.gradeScale = gradeScale;
           updated.percentage = percentage;
           
           if (updates.score !== null) {
              if (updates.score > 40 || updates.score < 0) updated.status = 'يحتاج مراجعة';
              else updated.status = 'مختبر';
           }
        }
        if (updates.status === 'غائب') {
          updated.score = null;
          updated.percentage = 0;
          updated.gradeScale = '-';
        }
        return updated;
      }
      return s;
    });

    const newProject = { ...project, students: newStudents };
    setProject(newProject);
    await saveProject(newProject);
  };

  const handleBulkZeroResolve = async (action: 'absent' | 'one') => {
    if (!project) return;
    
    let newStudents = project.students.map(s => {
      if (s.score === 0) {
        if (action === 'absent') {
          return { ...s, score: null, status: 'غائب', percentage: 0, gradeScale: '-' } as StudentRecord;
        } else {
          const { gradeScale, percentage } = calculateGradeAndPercentage(1);
          return { ...s, score: 1, status: 'مختبر', percentage, gradeScale } as StudentRecord;
        }
      }
      return s;
    });

    const newProject = { ...project, students: newStudents };
    setProject(newProject);
    await saveProject(newProject);
    setShowZeroResolver(false);
  };

  if (!project) return <div>جاري التحميل...</div>;

  const filteredStudents = project.students.filter(s => {
    if (filter === 'مختبر') return s.status === 'مختبر';
    if (filter === 'غائب') return s.status === 'غائب';
    if (filter === 'يحتاج مراجعة') return s.status === 'يحتاج مراجعة';
    if (filter === 'درجة صفرية') return s.score === 0;
    return true;
  }).filter(s => s.name.includes(searchTerm));

  const stats = {
    total: project.students.length,
    tested: project.students.filter(s => s.status === 'مختبر' && s.score !== null && s.score > 0).length,
    absent: project.students.filter(s => s.status === 'غائب').length,
    needsReview: project.students.filter(s => s.status === 'يحتاج مراجعة').length,
    zeros: project.students.filter(s => s.score === 0).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">مراجعة البيانات</h2>
          <p className="text-gray-500">{project.schoolName} - {project.subject}</p>
        </div>
        <button 
          onClick={() => navigate(`/project/${project.projectId}/report`)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-[#007A66] text-white hover:bg-[#005F4F]"
        >
          <FileOutput size={18} />
          إصدار التقرير
        </button>
      </div>

      {showZeroResolver && stats.zeros > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-orange-100 p-3 rounded-full text-orange-600">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-orange-800">تنبيه: تم العثور على درجات صفرية ({stats.zeros} طلاب)</h3>
              <p className="text-orange-700 mt-1">فضلاً حدد الإجراء المناسب للطلاب الذين حصلوا على درجة (0). في نظام الرصد لا تقبل الدرجة صفر.</p>
              
              <div className="mt-4 flex gap-3">
                <button 
                  onClick={() => handleBulkZeroResolve('absent')}
                  className="px-4 py-2 bg-white border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 font-medium text-sm transition-colors"
                >
                  تعيين جميع الأصفار كـ "غائب"
                </button>
                <button 
                  onClick={() => handleBulkZeroResolve('one')}
                  className="px-4 py-2 bg-white border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 font-medium text-sm transition-colors"
                >
                  تعديل جميع الأصفار إلى (1)
                </button>
                <button 
                  onClick={() => setShowZeroResolver(false)}
                  className="px-4 py-2 text-orange-600 hover:bg-orange-100 rounded-lg font-medium text-sm transition-colors"
                >
                  سأقوم بالمراجعة يدوياً
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">إجمالي الطلاب</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 text-center">
          <p className="text-sm text-green-600">المختبرين</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{stats.tested}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">الغائبين</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.absent}</p>
        </div>
        <div className={`p-4 rounded-xl shadow-sm border text-center ${stats.needsReview > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm ${stats.needsReview > 0 ? 'text-red-600' : 'text-gray-500'}`}>يحتاج مراجعة</p>
          <p className={`text-2xl font-bold mt-1 ${stats.needsReview > 0 ? 'text-red-700' : 'text-gray-900'}`}>{stats.needsReview}</p>
        </div>
        <div className={`p-4 rounded-xl shadow-sm border text-center ${stats.zeros > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm ${stats.zeros > 0 ? 'text-orange-600' : 'text-gray-500'}`}>درجة صفرية</p>
          <p className={`text-2xl font-bold mt-1 ${stats.zeros > 0 ? 'text-orange-700' : 'text-gray-900'}`}>{stats.zeros}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between gap-4 bg-gray-50">
          <input 
            type="text" 
            placeholder="بحث باسم الطالب..."
            className="rounded-md border-gray-300 shadow-sm px-4 py-2 border w-full sm:w-64 focus:ring-[#007A66] focus:border-[#007A66]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['الكل', 'مختبر', 'غائب', 'يحتاج مراجعة', 'درجة صفرية'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f 
                    ? 'bg-[#007A66] text-white' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-center w-12">م</th>
                <th className="px-4 py-3">اسم الطالب</th>
                <th className="px-4 py-3 w-28 text-center">الدرجة</th>
                <th className="px-4 py-3 w-32">الحالة</th>
                <th className="px-4 py-3 w-32">التقدير</th>
                <th className="px-4 py-3">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map((student, idx) => (
                <tr key={student.id} className={`hover:bg-gray-50 ${student.status === 'يحتاج مراجعة' ? 'bg-red-50' : ''} ${student.score === 0 ? 'bg-orange-50' : ''}`}>
                  <td className="px-4 py-3 text-center text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{student.name}</td>
                  <td className="px-4 py-3 text-center">
                    {student.status === 'غائب' ? (
                      <span className="text-gray-400">-</span>
                    ) : (
                      <input 
                        type="number" 
                        className={`w-full text-center rounded border p-1 ${student.score === 0 ? 'border-orange-400 bg-orange-100 font-bold' : 'border-gray-300'} ${student.score !== null && (student.score > 40 || student.score < 0) ? 'border-red-500 text-red-600 font-bold' : ''}`}
                        value={student.score === null ? '' : student.score}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateStudent(student.id, { score: val === '' ? null : Number(val) });
                        }}
                        max="40" min="0"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className={`w-full rounded border p-1 text-sm ${student.status === 'يحتاج مراجعة' ? 'border-red-500 text-red-600 font-bold bg-red-50' : 'border-gray-300'}`}
                      value={student.status}
                      onChange={(e) => updateStudent(student.id, { status: e.target.value as any })}
                    >
                      <option value="مختبر">مختبر</option>
                      <option value="غائب">غائب</option>
                      <option value="يحتاج مراجعة">يحتاج مراجعة</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${
                      student.gradeScale === 'ممتاز' ? 'bg-green-100 text-green-800' :
                      student.gradeScale === 'متدني' ? 'bg-red-100 text-red-800' :
                      student.gradeScale === '-' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {student.gradeScale}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="text" 
                      className="w-full rounded border border-gray-300 p-1 text-sm bg-transparent"
                      value={student.notes || ''}
                      placeholder="اضف ملاحظة..."
                      onChange={(e) => updateStudent(student.id, { notes: e.target.value })}
                    />
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    لا يوجد طلاب يطابقون خيارات البحث.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
