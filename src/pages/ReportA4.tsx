import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectById } from '../services/db';
import { ProjectData } from '../types';
import { calculateStatistics, getGradeDistribution } from '../utils/statistics';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { ArrowRight, Printer } from 'lucide-react';

export const ReportA4 = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectData | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      if (id) {
        const p = await getProjectById(id);
        if (p) setProject(p);
        else navigate('/');
      }
    };
    loadProject();
  }, [id, navigate]);

  if (!project) return <div>جاري التحميل...</div>;

  const stats = calculateStatistics(project.students);
  const dist = getGradeDistribution(project.students);

  // Grade colors as requested
  const gradeColors: Record<string, string> = {
    'ممتاز': '#00B050',
    'جيد جداً': '#92D050',
    'جيد': '#E2EFDA',
    'مقبول': '#F8CBAD',
    'ضعيف': '#FFE699',
    'متدني': '#FF0000'
  };

  const chartData = dist.map(d => ({
    name: d.label,
    count: d.count,
    percentage: d.percentage.toFixed(1) + '%',
    color: gradeColors[d.label] || '#007A66'
  })).reverse(); // Reverse to match RTL display (ممتاز on left)

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-gray-100 min-h-screen py-8 print:py-0 print:bg-white flex flex-col items-center">
      
      {/* Controls Bar (Hidden in Print) */}
      <div className="w-full max-w-[21cm] mb-4 flex justify-between items-center no-print">
        <button 
          onClick={() => navigate(`/project/${project.projectId}/review`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowRight size={20} />
          العودة للمراجعة
        </button>
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2 bg-[#007A66] text-white rounded-lg hover:bg-[#005F4F] transition-colors shadow-sm"
          >
            <Printer size={18} />
            طباعة التقرير / حفظ PDF
          </button>
        </div>
      </div>

      {/* A4 Page Container */}
      <div className="w-[21cm] min-h-[29.7cm] bg-white shadow-xl print:shadow-none print:w-full print:h-auto overflow-hidden text-gray-900 p-10 font-sans relative box-border">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-[#007A66] pb-4 mb-6">
          <div className="text-right space-y-1 text-sm font-bold w-1/3">
            <p>المملكة العربية السعودية</p>
            <p>وزارة التعليم</p>
            <p>{project.educationAdministration}</p>
            <p>{project.department}</p>
          </div>
          
          <div className="flex flex-col items-center w-1/3">
            <img 
              src="https://upload.wikimedia.org/wikipedia/ar/1/17/Saudi_Ministry_of_Education_Logo_2025.png" 
              alt="شعار وزارة التعليم" 
              className="h-20 object-contain mb-2" 
            />
          </div>
          
          <div className="text-left w-1/3 flex justify-end items-start pt-2">
            <div className="border-2 border-gray-800 p-2 text-center w-24 rounded-lg">
              <p className="font-bold text-xl tracking-widest text-[#007A66]">رصد</p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-[#007A66] mb-1">تقرير (رصد) للاختبار المركزي</h2>
          <p className="text-gray-600 font-medium">البيانات الإحصائية والتوزيع التكراري للدرجات</p>
        </div>

        {/* Info Grid (Two tables side by side) */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <table className="w-full text-sm border-collapse border border-gray-300">
            <tbody>
              <tr>
                <th className="bg-gray-100 border border-gray-300 p-2 text-right w-1/3">المدرسة</th>
                <td className="border border-gray-300 p-2 font-bold text-center">{project.schoolName}</td>
              </tr>
              <tr>
                <th className="bg-gray-100 border border-gray-300 p-2 text-right">المرحلة</th>
                <td className="border border-gray-300 p-2 text-center">{project.stage}</td>
              </tr>
              <tr>
                <th className="bg-gray-100 border border-gray-300 p-2 text-right">نوع التعليم</th>
                <td className="border border-gray-300 p-2 text-center">{project.educationType}</td>
              </tr>
              <tr>
                <th className="bg-gray-100 border border-gray-300 p-2 text-right">الرقم الوزاري</th>
                <td className="border border-gray-300 p-2 text-center">{project.ministryNumber}</td>
              </tr>
            </tbody>
          </table>

          <table className="w-full text-sm border-collapse border border-gray-300">
            <tbody>
              <tr>
                <th className="bg-gray-100 border border-gray-300 p-2 text-right w-1/3">المادة</th>
                <td className="border border-gray-300 p-2 font-bold text-center">{project.subject}</td>
              </tr>
              <tr>
                <th className="bg-gray-100 border border-gray-300 p-2 text-right">الصف</th>
                <td className="border border-gray-300 p-2 text-center">{project.grade}</td>
              </tr>
              <tr>
                <th className="bg-gray-100 border border-gray-300 p-2 text-right">الفصل الدراسي</th>
                <td className="border border-gray-300 p-2 text-center">{project.term}</td>
              </tr>
              <tr>
                <th className="bg-gray-100 border border-gray-300 p-2 text-right">العام الدراسي</th>
                <td className="border border-gray-300 p-2 text-center">{project.academicYear}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Statistics & Distribution */}
        <div className="grid grid-cols-12 gap-6 mb-8">
          
          {/* Main Stats (Right side) */}
          <div className="col-span-4 space-y-4">
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead className="bg-[#007A66] text-white">
                <tr>
                  <th colSpan={2} className="p-2 border border-gray-300 text-center">المؤشرات العامة</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th className="bg-gray-100 border border-gray-300 p-1.5 text-right font-medium">العدد الكلي للطلاب</th>
                  <td className="border border-gray-300 p-1.5 text-center font-bold">{stats.totalStudents}</td>
                </tr>
                <tr>
                  <th className="bg-gray-100 border border-gray-300 p-1.5 text-right font-medium">عدد المختبرين</th>
                  <td className="border border-gray-300 p-1.5 text-center font-bold text-[#007A66]">{stats.testedStudents}</td>
                </tr>
                <tr>
                  <th className="bg-gray-100 border border-gray-300 p-1.5 text-right font-medium">عدد الغائبين</th>
                  <td className="border border-gray-300 p-1.5 text-center font-bold text-red-600">{stats.absentStudents}</td>
                </tr>
                <tr>
                  <th className="bg-gray-100 border border-gray-300 p-1.5 text-right font-medium">نسبة المختبرين</th>
                  <td className="border border-gray-300 p-1.5 text-center" dir="ltr">{stats.testedPercentage.toFixed(1)}%</td>
                </tr>
                <tr>
                  <th className="bg-gray-100 border border-gray-300 p-1.5 text-right font-medium">نسبة الغائبين</th>
                  <td className="border border-gray-300 p-1.5 text-center" dir="ltr">{stats.absentPercentage.toFixed(1)}%</td>
                </tr>
                <tr>
                  <th className="bg-gray-100 border border-gray-300 p-1.5 text-right font-medium">المتوسط</th>
                  <td className="border border-gray-300 p-1.5 text-center font-bold">{stats.mean !== null ? stats.mean.toFixed(2) : '-'}</td>
                </tr>
                <tr>
                  <th className="bg-gray-100 border border-gray-300 p-1.5 text-right font-medium">الوسيط</th>
                  <td className="border border-gray-300 p-1.5 text-center">{stats.median !== null ? stats.median.toFixed(2) : '-'}</td>
                </tr>
                <tr>
                  <th className="bg-gray-100 border border-gray-300 p-1.5 text-right font-medium">المنوال</th>
                  <td className="border border-gray-300 p-1.5 text-center">{stats.mode !== null ? stats.mode.toFixed(2) : '-'}</td>
                </tr>
                <tr>
                  <th className="bg-gray-100 border border-gray-300 p-1.5 text-right font-medium">الانحراف المعياري</th>
                  <td className="border border-gray-300 p-1.5 text-center">{stats.standardDeviation !== null ? stats.standardDeviation.toFixed(2) : '-'}</td>
                </tr>
                <tr>
                  <th className="bg-gray-100 border border-gray-300 p-1.5 text-right font-medium">معامل الالتواء</th>
                  <td className="border border-gray-300 p-1.5 text-center">{stats.skewness !== null ? stats.skewness.toFixed(2) : '-'}</td>
                </tr>
                <tr>
                  <th className="bg-gray-100 border border-gray-300 p-1.5 text-right font-medium">أعلى درجة</th>
                  <td className="border border-gray-300 p-1.5 text-center text-[#007A66] font-bold">{stats.highestScore !== null ? stats.highestScore : '-'}</td>
                </tr>
                <tr>
                  <th className="bg-gray-100 border border-gray-300 p-1.5 text-right font-medium">أقل درجة</th>
                  <td className="border border-gray-300 p-1.5 text-center text-red-600 font-bold">{stats.lowestScore !== null ? stats.lowestScore : '-'}</td>
                </tr>
                <tr>
                  <th className="bg-gray-100 border border-gray-300 p-1.5 text-right font-medium">المدى</th>
                  <td className="border border-gray-300 p-1.5 text-center">{stats.range !== null ? stats.range : '-'}</td>
                </tr>
              </tbody>
            </table>

            <div className="bg-white border-2 border-[#007A66] rounded-lg p-3 mt-4 flex justify-between items-center text-center">
              <div>
                <p className="text-xs text-gray-500 font-bold mb-1">النسبة العامة</p>
                <p className="text-xl font-black text-[#007A66]">{stats.generalPercentage !== null ? stats.generalPercentage.toFixed(2) + '%' : '-'}</p>
              </div>
              <div className="h-10 w-px bg-gray-300"></div>
              <div>
                <p className="text-xs text-gray-500 font-bold mb-1">التقدير العام</p>
                <p className="text-xl font-black text-[#007A66]">{stats.generalGrade}</p>
              </div>
            </div>
          </div>

          {/* Distribution Table & Chart (Left side) */}
          <div className="col-span-8 flex flex-col">
            <table className="w-full text-sm border-collapse border border-gray-300 mb-6">
              <thead className="bg-[#007A66] text-white">
                <tr>
                  <th className="p-2 border border-gray-300 text-center w-16">من</th>
                  <th className="p-2 border border-gray-300 text-center w-16">إلى</th>
                  <th className="p-2 border border-gray-300 text-center">سلم التقدير</th>
                  <th className="p-2 border border-gray-300 text-center">عدد الطلاب</th>
                  <th className="p-2 border border-gray-300 text-center">النسبة</th>
                </tr>
              </thead>
              <tbody>
                {dist.map((d, i) => (
                  <tr key={i} className="text-center">
                    <td className="border border-gray-300 p-1.5">{d.rangeStart}</td>
                    <td className="border border-gray-300 p-1.5">{d.rangeEnd}</td>
                    <td 
                      className="border border-gray-300 p-1.5 font-bold"
                      style={{ 
                        backgroundColor: gradeColors[d.label] || '#fff',
                        color: ['متدني', 'ممتاز', 'جيد جداً'].includes(d.label) ? '#fff' : '#000'
                      }}
                    >
                      {d.label}
                    </td>
                    <td className="border border-gray-300 p-1.5">{d.count}</td>
                    <td className="border border-gray-300 p-1.5" dir="ltr">{d.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex-1 border border-gray-300 rounded-lg p-4 bg-white">
              <h4 className="text-center font-bold text-gray-700 mb-4 text-sm">توزيع المختبرين على سلم التقدير</h4>
              <div className="h-48 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#4B5563' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{textAlign: 'right', direction: 'rtl'}} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={50}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      <LabelList dataKey="percentage" position="top" fontSize={10} fill="#4B5563" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 border-t-2 border-gray-300 flex justify-between items-end">
          <div className="text-sm flex flex-col items-center">
            <p className="font-bold text-gray-700 mb-2">مدخل البيانات:</p>
            <p className="text-gray-900 border-b border-dashed border-gray-400 min-w-[200px] inline-block pb-1 text-center font-bold">
              {project.dataEntryName || '________________________'}
            </p>
          </div>
          <div className="text-left">
            <p className="text-[10px] text-gray-400 font-mono">تطوير وبرمجة بواسطة ياسر الهذلي</p>
            <p className="text-[10px] text-gray-400 font-mono">{new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-GB')}</p>
          </div>
        </div>

      </div>
    </div>
  );
};
