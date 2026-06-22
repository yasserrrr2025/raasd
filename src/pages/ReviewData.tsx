import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectById, saveProject } from '../services/db';
import { ProjectData, StudentRecord } from '../types';
import { calculateGradeAndPercentage } from '../utils/gradeScale';
import { getGradeDistribution } from '../utils/statistics';
import { AlertTriangle, Check, X, Edit2, Save, FileOutput, Printer } from 'lucide-react';

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

  // Sort students: highest score first, then 'absent' at the bottom
  const sortedStudents = [...project.students].sort((a, b) => {
    if (a.status === 'غائب' && b.status !== 'غائب') return 1;
    if (a.status !== 'غائب' && b.status === 'غائب') return -1;
    return (b.score || 0) - (a.score || 0);
  });

  const filteredStudents = sortedStudents.filter(s => {
    if (filter === 'مختبر') return s.status === 'مختبر';
    if (filter === 'غائب') return s.status === 'غائب';
    if (filter === 'يحتاج مراجعة') return s.status === 'يحتاج مراجعة';
    if (filter === 'درجة صفرية') return s.score === 0;
    if (filter === 'ممتاز') return s.gradeScale === 'ممتاز';
    if (filter === 'جيد جداً') return s.gradeScale === 'جيد جداً';
    if (filter === 'جيد') return s.gradeScale === 'جيد';
    if (filter === 'مقبول') return s.gradeScale === 'مقبول';
    if (filter === 'ضعيف') return s.gradeScale === 'ضعيف';
    if (filter === 'متدني') return s.gradeScale === 'متدني';
    return true;
  }).filter(s => s.name.includes(searchTerm));

  const stats = {
    total: project.students.length,
    tested: project.students.filter(s => s.status === 'مختبر' && s.score !== null && s.score > 0).length,
    absent: project.students.filter(s => s.status === 'غائب').length,
    needsReview: project.students.filter(s => s.status === 'يحتاج مراجعة').length,
    zeros: project.students.filter(s => s.score === 0).length,
  };

  const gradeColors: Record<string, string> = {
    'ممتاز': '#00B050',
    'جيد جداً': '#92D050',
    'جيد': '#E2EFDA',
    'مقبول': '#F8CBAD',
    'ضعيف': '#FFE699',
    'متدني': '#FF0000'
  };

  const dist = getGradeDistribution(project.students);
  const reversedDist = [...dist].reverse();

  const mainFilters = ['الكل', 'مختبر', 'غائب', 'يحتاج مراجعة', 'درجة صفرية'];
  const gradeFilters = ['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'ضعيف', 'متدني'];

  return (
    <div className="space-y-6 print:space-y-4 print:p-0 print:m-0 bg-gray-50 print:bg-white min-h-screen">
      
      {/* --- Print Official Header --- */}
      <div className="hidden print:flex justify-between items-start border-b-2 border-[#007A66] pb-2 mb-4 shrink-0">
        <div className="text-right space-y-1 text-sm font-bold w-1/3">
          <p>المملكة العربية السعودية</p>
          <p>وزارة التعليم</p>
          <p>{project.educationAdministration}</p>
          <p>{project.schoolName}</p>
        </div>
        
        <div className="flex flex-col items-center w-1/3">
          <img 
            src="https://upload.wikimedia.org/wikipedia/ar/1/17/Saudi_Ministry_of_Education_Logo_2025.png" 
            alt="شعار وزارة التعليم" 
            className="h-16 object-contain mb-1" 
          />
        </div>
        
        <div className="text-left w-1/3 flex justify-end items-start pt-2">
          <div className="border-2 border-gray-800 p-1.5 text-center w-24 rounded-lg">
            <p className="font-bold text-sm tracking-widest text-[#007A66]">كشف درجات</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center print:hidden px-4 md:px-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">مراجعة البيانات</h2>
          <p className="text-gray-500">{project.schoolName} - {project.subject}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-gray-800 text-white hover:bg-gray-700 shadow-sm transition-colors"
          >
            <Printer size={18} />
            طباعة الكشف
          </button>
          <button 
            onClick={() => navigate(`/project/${project.projectId}/report`)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-[#007A66] text-white hover:bg-[#005F4F] shadow-sm transition-colors"
          >
            <FileOutput size={18} />
            إصدار التقرير
          </button>
        </div>
      </div>

      {/* Hidden Title specifically for printing */}
      <h2 className="hidden print:block text-xl font-bold text-center text-[#007A66] mb-3">
        درجات الطلاب في مادة {project.subject}
      </h2>

      {showZeroResolver && stats.zeros > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 shadow-sm print:hidden mx-4 md:mx-0">
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

      {/* Dashboard - Visible on Web Only */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 px-4 md:px-0 mb-6 print:hidden">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500 font-bold">إجمالي الطلاب</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 text-center">
          <p className="text-sm text-green-600 font-bold">المختبرين</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{stats.tested}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500 font-bold">الغائبين</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.absent}</p>
        </div>
        <div className={`p-4 rounded-xl shadow-sm border text-center ${stats.needsReview > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm font-bold ${stats.needsReview > 0 ? 'text-red-600' : 'text-gray-500'}`}>يحتاج مراجعة</p>
          <p className={`text-2xl font-bold mt-1 ${stats.needsReview > 0 ? 'text-red-700' : 'text-gray-900'}`}>{stats.needsReview}</p>
        </div>
        <div className={`p-4 rounded-xl shadow-sm border text-center ${stats.zeros > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm font-bold ${stats.zeros > 0 ? 'text-orange-600' : 'text-gray-500'}`}>درجة صفرية</p>
          <p className={`text-2xl font-bold mt-1 ${stats.zeros > 0 ? 'text-orange-700' : 'text-gray-900'}`}>{stats.zeros}</p>
        </div>
      </div>

      {/* Grades Dashboard - Web & Print */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 px-4 md:px-0 mb-6 print:mb-8">
        {reversedDist.map(d => (
          <div key={d.label} className="bg-white p-3 rounded-xl shadow-sm border text-center print:shadow-none" style={{ borderColor: gradeColors[d.label], borderTopWidth: '4px' }}>
            <p className="text-xs font-bold mb-1" style={{ color: gradeColors[d.label] }}>{d.label}</p>
            <p className="text-xl font-black text-gray-900">{d.count}</p>
          </div>
        ))}
      </div>

      {/* Print-only Stats Table */}
      <div className="hidden print:flex mb-6 w-[50%] mx-auto border-collapse border border-gray-300">
        <div className="flex-1 border-l border-gray-300 p-2 text-center bg-gray-100 print-color-adjust-exact" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', backgroundColor: '#f3f4f6' }}>
          <p className="text-xs font-bold text-gray-700">إجمالي الطلاب</p>
          <p className="text-lg font-black text-gray-900">{stats.total}</p>
        </div>
        <div className="flex-1 border-l border-gray-300 p-2 text-center bg-white">
          <p className="text-xs font-bold text-[#007A66]">المختبرين</p>
          <p className="text-lg font-black text-[#007A66]">{stats.tested}</p>
        </div>
        <div className="flex-1 p-2 text-center bg-white">
          <p className="text-xs font-bold text-red-600">الغائبين</p>
          <p className="text-lg font-black text-red-600">{stats.absent}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col mx-4 md:mx-0 print:border-none print:shadow-none print:rounded-none">
        
        {/* Filters Section - Hidden on Print */}
        <div className="p-4 border-b border-gray-200 flex flex-col gap-4 bg-gray-50 print:hidden">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <input 
              type="text" 
              placeholder="بحث باسم الطالب..."
              className="rounded-md border-gray-300 shadow-sm px-4 py-2 border w-full sm:w-64 focus:ring-[#007A66] focus:border-[#007A66]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex gap-2 overflow-x-auto pb-1 items-center">
              <span className="text-xs font-bold text-gray-500 whitespace-nowrap">حسب الحالة:</span>
              {mainFilters.map(f => (
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
          
          {/* Grade Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 items-center">
            <span className="text-xs font-bold text-gray-500 whitespace-nowrap">حسب التقدير:</span>
            {reversedDist.map(d => {
              const f = d.label;
              const isActive = filter === f;
              const bgColor = gradeColors[f];
              const textColor = ['ممتاز', 'متدني'].includes(f) ? '#fff' : '#000';
              
              return (
                <button
                  key={f}
                  onClick={() => setFilter(isActive ? 'الكل' : f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-transform hover:scale-105 shadow-sm border`}
                  style={{
                    backgroundColor: isActive ? bgColor : '#fff',
                    color: isActive ? textColor : '#4B5563',
                    borderColor: isActive ? 'transparent' : '#E5E7EB'
                  }}
                >
                  {f} ({d.count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-sm text-right print:text-[12px] print:border-collapse print:border-gray-400">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b-2 border-gray-300 print:bg-[#007A66] print:text-white print:table-header-group print-color-adjust-exact" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', backgroundColor: '#007A66', color: 'white' }}>
              <tr>
                <th className="px-4 py-2 text-center w-12 border-x border-gray-200 print:border-gray-400">م</th>
                <th className="px-4 py-2 border-x border-gray-200 print:border-gray-400">اسم الطالب</th>
                <th className="px-4 py-2 w-28 text-center border-x border-gray-200 print:border-gray-400">الدرجة</th>
                <th className="px-4 py-2 w-32 text-center border-x border-gray-200 print:border-gray-400">الحالة</th>
                <th className="px-4 py-2 w-32 text-center border-x border-gray-200 print:border-gray-400">التقدير</th>
                <th className="px-4 py-2 border-x border-gray-200 print:border-gray-400">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 border-b border-gray-200 print:border-gray-400">
              {filteredStudents.map((student, idx) => (
                <tr 
                  key={student.id} 
                  className={`hover:bg-gray-50 print:break-inside-avoid transition-colors ${
                    student.status === 'يحتاج مراجعة' ? 'bg-red-50' : ''
                  } ${
                    student.score === 0 ? 'bg-orange-50' : ''
                  }`}
                  style={student.status === 'غائب' ? { backgroundColor: '#f3f4f6', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } : {}}
                >
                  <td className="px-4 py-2 text-center text-gray-500 border-x border-gray-200 print:border-gray-400 font-medium">{idx + 1}</td>
                  <td className={`px-4 py-2 border-x border-gray-200 print:border-gray-400 ${student.status === 'غائب' ? 'font-normal text-gray-600' : 'font-bold text-gray-900'}`}>{student.name}</td>
                  <td className="px-4 py-2 text-center border-x border-gray-200 print:border-gray-400">
                    {student.status === 'غائب' ? (
                      <span className="text-gray-400 font-bold">غائب</span>
                    ) : (
                      <input 
                        type="number" 
                        className={`w-full text-center rounded border p-1 print:border-none print:bg-transparent ${
                          student.score === 0 ? 'border-orange-400 bg-orange-100 font-bold' : 'border-gray-300'
                        } ${
                          student.score !== null && (student.score > 40 || student.score < 0) ? 'border-red-500 text-red-600 font-bold' : 'font-bold text-gray-900'
                        }`}
                        value={student.score === null ? '' : student.score}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateStudent(student.id, { score: val === '' ? null : Number(val) });
                        }}
                        max="40" min="0"
                      />
                    )}
                  </td>
                  <td className="px-4 py-2 text-center border-x border-gray-200 print:border-gray-400">
                    <div className="print:hidden">
                      <select
                        className={`w-full rounded border p-1 text-sm ${student.status === 'يحتاج مراجعة' ? 'border-red-500 text-red-600 font-bold bg-red-50' : 'border-gray-300'}`}
                        value={student.status}
                        onChange={(e) => updateStudent(student.id, { status: e.target.value as any })}
                      >
                        <option value="مختبر">مختبر</option>
                        <option value="غائب">غائب</option>
                        <option value="يحتاج مراجعة">يحتاج مراجعة</option>
                      </select>
                    </div>
                    <div className="hidden print:block font-bold">
                      {student.status}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center border-x border-gray-200 print:border-gray-400">
                    <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${
                      student.gradeScale === 'ممتاز' ? 'bg-green-100 text-green-800 print:bg-transparent print:text-gray-900' :
                      student.gradeScale === 'متدني' ? 'bg-red-100 text-red-800 print:bg-transparent print:text-gray-900' :
                      student.gradeScale === '-' ? 'bg-transparent text-gray-500' :
                      'bg-blue-100 text-blue-800 print:bg-transparent print:text-gray-900'
                    }`}>
                      {student.gradeScale}
                    </span>
                  </td>
                  <td className="px-4 py-2 border-x border-gray-200 print:border-gray-400">
                    <input 
                      type="text" 
                      className="w-full rounded border border-gray-300 p-1 text-sm bg-transparent print:border-none print:hidden"
                      value={student.notes || ''}
                      placeholder="اضف ملاحظة..."
                      onChange={(e) => updateStudent(student.id, { notes: e.target.value })}
                    />
                    <span className="hidden print:block">{student.notes || '-'}</span>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 font-bold border-x border-gray-200">
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
