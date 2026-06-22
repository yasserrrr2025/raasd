import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveProject } from '../services/db';
import { ProjectData, School } from '../types';
import schoolsData from '../data/schools.json';

export const SetupReport = () => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  
  const [formData, setFormData] = useState({
    ministryNumber: '',
    stage: '',
    educationType: '',
    educationAdministration: '',
    department: '',
    subject: '',
    grade: '',
    term: 'الفصل الدراسي الأول',
    academicYear: '1445',
    dataEntryName: ''
  });

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
        ministryNumber: school.ministryNumber,
        stage: school.stage,
        educationType: school.educationType,
        educationAdministration: school.educationAdministration || '',
        department: school.department || ''
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-[#007A66] px-6 py-4">
          <h2 className="text-xl font-bold text-white">إعداد تقرير جديد</h2>
          <p className="text-[#E5F2F0] text-sm mt-1">أدخل بيانات المدرسة والمادة للبدء في رفع الدرجات</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">بيانات المدرسة</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم المدرسة <span className="text-red-500">*</span></label>
              <select 
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#007A66] focus:ring-[#007A66] p-2.5 border"
                value={selectedSchool}
                onChange={handleSchoolChange}
              >
                <option value="">-- اختر المدرسة --</option>
                {schools.map(s => (
                  <option key={s.schoolName} value={s.schoolName}>{s.schoolName}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الرقم الوزاري</label>
                <input 
                  type="text" 
                  name="ministryNumber"
                  value={formData.ministryNumber}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#007A66] focus:ring-[#007A66] p-2.5 border bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المرحلة</label>
                <input 
                  type="text" 
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#007A66] focus:ring-[#007A66] p-2.5 border bg-gray-50"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">بيانات المادة</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المادة <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#007A66] focus:ring-[#007A66] p-2.5 border"
                  placeholder="مثال: الرياضيات"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الصف <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="grade"
                  required
                  value={formData.grade}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#007A66] focus:ring-[#007A66] p-2.5 border"
                  placeholder="مثال: الثالث متوسط"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الفصل الدراسي</label>
                <select 
                  name="term"
                  value={formData.term}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#007A66] focus:ring-[#007A66] p-2.5 border"
                >
                  <option>الفصل الدراسي الأول</option>
                  <option>الفصل الدراسي الثاني</option>
                  <option>الفصل الدراسي الثالث</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العام الدراسي</label>
                <input 
                  type="text" 
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#007A66] focus:ring-[#007A66] p-2.5 border"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم مدخل البيانات</label>
              <input 
                type="text" 
                name="dataEntryName"
                value={formData.dataEntryName}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#007A66] focus:ring-[#007A66] p-2.5 border"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit"
              className="px-6 py-3 rounded-lg text-sm font-medium bg-[#007A66] text-white hover:bg-[#005F4F] shadow-sm transition-colors"
            >
              التالي: استيراد الدرجات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
