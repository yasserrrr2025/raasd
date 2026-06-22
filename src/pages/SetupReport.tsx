import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveProject } from '../services/db';
import { ProjectData, School } from '../types';
import schoolsData from '../data/schools.json';
import { Building2, BookOpen, UserCircle } from 'lucide-react';

const ButtonGroup = ({ options, value, onChange, label, required }: { options: string[], value: string, onChange: (val: string) => void, label: string, required?: boolean }) => (
  <div>
    <label className="block text-sm font-bold text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border ${
            value === opt 
              ? 'bg-[#007A66] text-white border-[#007A66] shadow-md scale-[1.02]' 
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-[#007A66] hover:text-[#007A66]'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

export const SetupReport = () => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<School[]>([]);
  
  // Load saved data from localStorage
  const savedData = JSON.parse(localStorage.getItem('savedReportSetup') || '{}');

  const [selectedSchool, setSelectedSchool] = useState(savedData.selectedSchool || '');
  
  const [formData, setFormData] = useState({
    ministryNumber: savedData.ministryNumber || '',
    stage: savedData.stage || '',
    educationType: savedData.educationType || '',
    educationAdministration: 'الإدارة العامة للتعليم بمحافظة جدة',
    department: 'إدارة تقويم الأداء المعرفي والمهاري',
    subject: '', // Always reset subject
    grade: savedData.grade || '',
    term: savedData.term || 'الفصل الدراسي الأول',
    academicYear: savedData.academicYear || '1447هـ',
    dataEntryName: savedData.dataEntryName || ''
  });

  const educationTypeOptions = ['حكومي عام', 'أهلي', 'حكومي تحفيظ القران الكريم', 'أهلي تحفيظ القران الكريم'];
  const stageOptions = ['طفولة مبكرة', 'ابتدائية (صفوف أولية)', 'ابتدائي (صفوف عليا)', 'المتوسطة'];
  const gradeOptions = ['الثالث الابتدائي', 'السادس الابتدائي', 'الثالث المتوسط'];
  const subjectOptions = ['الرياضيات', 'اللغة الإنجليزية', 'اللغة العربية', 'العلوم'];
  const termOptions = ['الفصل الدراسي الأول', 'الفصل الدراسي الثاني']; // Removed third term

  useEffect(() => {
    setSchools(schoolsData);
  }, []);

  const handleSchoolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const schoolName = e.target.value;
    setSelectedSchool(schoolName);
    
    const school = schools.find(s => s.schoolName === schoolName);
    if (school) {
      setFormData(prev => ({
        ...prev,
        ministryNumber: school.ministryNumber
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleButtonChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict validation for ALL fields
    if (
      !selectedSchool || 
      !formData.ministryNumber || 
      !formData.educationType || 
      !formData.stage || 
      !formData.grade || 
      !formData.subject || 
      !formData.term || 
      !formData.academicYear || 
      !formData.dataEntryName
    ) {
      alert('الرجاء تعبئة جميع الحقول بالكامل قبل الانتقال للخطوة التالية.');
      return;
    }

    // Save user's inputs for next time (excluding subject)
    localStorage.setItem('savedReportSetup', JSON.stringify({
      selectedSchool,
      ministryNumber: formData.ministryNumber,
      stage: formData.stage,
      educationType: formData.educationType,
      grade: formData.grade,
      term: formData.term,
      academicYear: formData.academicYear,
      dataEntryName: formData.dataEntryName
    }));

    const projectId = crypto.randomUUID();
    const newProject: ProjectData = {
      projectId,
      schoolName: selectedSchool,
      ministryNumber: formData.ministryNumber,
      stage: formData.stage,
      educationType: formData.educationType,
      educationAdministration: formData.educationAdministration,
      department: formData.department,
      subject: formData.subject,
      grade: formData.grade,
      term: formData.term,
      academicYear: formData.academicYear,
      dataEntryName: formData.dataEntryName,
      students: [],
      importMapping: {
        nameColumn: '',
        scoreColumn: ''
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveProject(newProject);
    navigate(`/project/${projectId}/import`);
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-l from-[#007A66] to-[#005F4F] px-8 py-6 text-white">
          <h2 className="text-2xl font-bold">إعداد تقرير جديد</h2>
          <p className="text-teal-100 text-sm mt-2 opacity-90">أدخل البيانات الأساسية للمدرسة والمادة لتهيئة التقرير بشكل احترافي</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          
          {/* Section 1: School Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-[#007A66] border-b pb-3 border-gray-100">
              <Building2 size={24} />
              <h3 className="font-bold text-lg text-gray-900">بيانات المدرسة الأساسية</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
                <label className="block text-sm font-bold text-gray-700 mb-2">اسم المدرسة <span className="text-red-500">*</span></label>
                <select 
                  required
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#007A66] focus:ring-[#007A66] p-3 border bg-white transition-all outline-none"
                  value={selectedSchool}
                  onChange={handleSchoolChange}
                >
                  <option value="">-- اختر المدرسة لتعبئة الرقم تلقائياً --</option>
                  {schools.map(s => (
                    <option key={s.schoolName} value={s.schoolName}>{s.schoolName}</option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
                <label className="block text-sm font-bold text-gray-700 mb-2">الرقم الوزاري <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="ministryNumber"
                  required
                  value={formData.ministryNumber}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#007A66] focus:ring-[#007A66] p-3 border bg-white transition-all outline-none"
                  placeholder="رقم المدرسة الوزاري"
                />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-6">
              <ButtonGroup 
                label="نوع التعليم" 
                required 
                options={educationTypeOptions} 
                value={formData.educationType} 
                onChange={(val) => handleButtonChange('educationType', val)} 
              />

              <ButtonGroup 
                label="المرحلة التعليمية" 
                required 
                options={stageOptions} 
                value={formData.stage} 
                onChange={(val) => handleButtonChange('stage', val)} 
              />
            </div>
          </div>

          {/* Section 2: Subject Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-[#007A66] border-b pb-3 border-gray-100">
              <BookOpen size={24} />
              <h3 className="font-bold text-lg text-gray-900">تفاصيل المادة الدراسية</h3>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-6">
              <ButtonGroup 
                label="الصف الدراسي" 
                required 
                options={gradeOptions} 
                value={formData.grade} 
                onChange={(val) => handleButtonChange('grade', val)} 
              />

              <ButtonGroup 
                label="المادة الدراسية" 
                required 
                options={subjectOptions} 
                value={formData.subject} 
                onChange={(val) => handleButtonChange('subject', val)} 
              />

              <ButtonGroup 
                label="الفصل الدراسي" 
                required 
                options={termOptions} 
                value={formData.term} 
                onChange={(val) => handleButtonChange('term', val)} 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
                <label className="block text-sm font-bold text-gray-700 mb-2">العام الدراسي <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="academicYear"
                  required
                  value={formData.academicYear}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#007A66] focus:ring-[#007A66] p-3 border bg-white transition-all outline-none text-center tracking-widest font-bold"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <UserCircle size={18} className="text-gray-500" />
                  <label className="block text-sm font-bold text-gray-700">اسم مدخل البيانات <span className="text-red-500">*</span></label>
                </div>
                <input 
                  type="text" 
                  name="dataEntryName"
                  required
                  value={formData.dataEntryName}
                  onChange={handleChange}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#007A66] focus:ring-[#007A66] p-3 border bg-white transition-all outline-none"
                  placeholder="مثال: أ. ياسر الهذلي"
                />
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 flex justify-end">
            <button 
              type="submit"
              className="px-10 py-4 rounded-xl font-bold text-lg bg-[#007A66] text-white hover:bg-[#005F4F] shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center gap-2"
            >
              <span>حفظ والانتقال لاستيراد الدرجات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
