import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectById, saveProject } from '../services/db';
import { parseExcelFile, getSheetData, findHeaderRowIndex } from '../utils/excelParser';
import { detectColumns } from '../utils/headerNormalizer';
import { exportTemplateExcel } from '../utils/exportExcel';
import { ProjectData, StudentRecord } from '../types';
import { UploadCloud, FileDown, CheckCircle, AlertCircle } from 'lucide-react';
import { calculateGradeAndPercentage } from '../utils/gradeScale';

export const ImportWizard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectData | null>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<any>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<any[][]>([]);
  const [mapping, setMapping] = useState({
    nameColumn: '',
    scoreColumn: '',
    studentIdColumn: '',
    statusColumn: '',
    notesColumn: ''
  });
  
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setError('');
    
    try {
      const { sheetNames, workbook } = await parseExcelFile(selectedFile);
      setWorkbook(workbook);
      setSheetNames(sheetNames);
      setSelectedSheet(sheetNames[0]);
      
      processSheet(workbook, sheetNames[0]);
      setStep(2);
    } catch (err) {
      setError('فشل في قراءة ملف Excel. يرجى التأكد من أن الملف صالح.');
    }
  };

  const processSheet = (wb: any, sheet: string) => {
    const data = getSheetData(wb, sheet);
    if (data.length === 0) {
      setError('ورقة العمل فارغة');
      return;
    }
    
    const headerIdx = findHeaderRowIndex(data);
    const headerRow = data[headerIdx] || [];
    const rows = data.slice(headerIdx + 1);
    
    // Ensure string headers
    const cleanHeaders = headerRow.map(h => h ? String(h).trim() : `عمود_${Math.random().toString(36).substr(2, 4)}`);
    
    setHeaders(cleanHeaders);
    setDataRows(rows);
    
    const detected = detectColumns(cleanHeaders, rows);
    setMapping(prev => ({
      ...prev,
      nameColumn: detected.nameColumn || '',
      scoreColumn: detected.scoreColumn || ''
    }));
  };

  const handleSheetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sheet = e.target.value;
    setSelectedSheet(sheet);
    if (workbook) processSheet(workbook, sheet);
  };

  const handleMappingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMapping({ ...mapping, [e.target.name]: e.target.value });
  };

  const handleImport = async () => {
    if (!project) return;
    if (!mapping.nameColumn || !mapping.scoreColumn) {
      setError('يجب تحديد عمود اسم الطالب وعمود الدرجة على الأقل.');
      return;
    }

    const nameIdx = headers.indexOf(mapping.nameColumn);
    const scoreIdx = headers.indexOf(mapping.scoreColumn);
    const idIdx = mapping.studentIdColumn ? headers.indexOf(mapping.studentIdColumn) : -1;
    const statusIdx = mapping.statusColumn ? headers.indexOf(mapping.statusColumn) : -1;
    const notesIdx = mapping.notesColumn ? headers.indexOf(mapping.notesColumn) : -1;

    const students: StudentRecord[] = [];

    dataRows.forEach((row, idx) => {
      const name = row[nameIdx] ? String(row[nameIdx]).trim() : '';
      if (!name) return; // Skip rows without name

      let rawScore = row[scoreIdx];
      let score: number | null = null;
      let status: 'مختبر' | 'غائب' | 'يحتاج مراجعة' = 'مختبر';
      
      const rawStatus = statusIdx !== -1 ? String(row[statusIdx]).trim() : '';

      // Parse score
      if (rawScore !== undefined && rawScore !== null && rawScore !== '') {
        const strScore = String(rawScore).trim().toLowerCase();
        if (strScore === 'غائب' || strScore === 'غ' || rawStatus === 'غائب') {
          status = 'غائب';
          score = null;
        } else {
          const numScore = parseFloat(strScore);
          if (!isNaN(numScore)) {
            score = numScore;
            if (numScore > 40 || numScore < 0) {
              status = 'يحتاج مراجعة';
            }
          } else {
            status = 'يحتاج مراجعة';
          }
        }
      } else {
        if (rawStatus === 'غائب') {
          status = 'غائب';
        } else {
          status = 'يحتاج مراجعة';
        }
      }

      const { gradeScale, percentage } = calculateGradeAndPercentage(score);

      students.push({
        id: crypto.randomUUID(),
        originalRowIndex: idx,
        name,
        studentId: idIdx !== -1 && row[idIdx] ? String(row[idIdx]).trim() : undefined,
        score,
        originalScoreValue: rawScore !== undefined ? rawScore : '',
        status,
        gradeScale,
        percentage,
        notes: notesIdx !== -1 && row[notesIdx] ? String(row[notesIdx]).trim() : undefined
      });
    });

    const updatedProject = {
      ...project,
      students,
      importMapping: mapping
    };

    await saveProject(updatedProject);
    navigate(`/project/${project.projectId}/review`);
  };

  if (!project) return <div>جاري التحميل...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">استيراد البيانات</h2>
          <p className="text-gray-500">{project.schoolName} - {project.subject}</p>
        </div>
        <button 
          onClick={exportTemplateExcel}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#007A66] bg-[#E5F2F0] rounded-lg hover:bg-[#007A66] hover:text-white transition-colors"
        >
          <FileDown size={18} />
          تحميل قالب الاستيراد
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {step === 1 && (
          <div className="p-12 text-center border-2 border-dashed border-gray-300 m-6 rounded-xl hover:border-[#007A66] transition-colors relative">
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <UploadCloud className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">اسحب وأفلت ملف Excel هنا</h3>
            <p className="text-gray-500 mt-2">أو انقر لاختيار ملف من جهازك</p>
            <p className="text-xs text-gray-400 mt-4">الصيغ المدعومة: .xlsx, .xls, .csv</p>
          </div>
        )}

        {step === 2 && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-4">
                <CheckCircle className="text-green-500" size={24} />
                <div>
                  <h3 className="font-semibold text-gray-900">تم رفع الملف بنجاح: {file?.name}</h3>
                  <p className="text-sm text-gray-500">تم العثور على {dataRows.length} سجل</p>
                </div>
              </div>
              
              {sheetNames.length > 1 && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">ورقة العمل:</label>
                  <select 
                    value={selectedSheet} 
                    onChange={handleSheetChange}
                    className="rounded-md border-gray-300 shadow-sm focus:border-[#007A66] focus:ring-[#007A66] text-sm py-1"
                  >
                    {sheetNames.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-blue-800 text-sm font-medium">قم بمطابقة أعمدة الملف مع الأعمدة المطلوبة في النظام.</p>
                <p className="text-blue-600 text-xs mt-1">حاول النظام التعرف على الأعمدة تلقائياً. يرجى المراجعة والتأكيد.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-bold text-gray-900 mb-2">اسم الطالب <span className="text-red-500">*</span></label>
                <select 
                  name="nameColumn"
                  value={mapping.nameColumn}
                  onChange={handleMappingChange}
                  className={`w-full rounded-md shadow-sm p-2.5 border ${mapping.nameColumn ? 'border-[#007A66] bg-[#E5F2F0]/50' : 'border-red-300'}`}
                >
                  <option value="">-- اختر العمود --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-bold text-gray-900 mb-2">الدرجة <span className="text-red-500">*</span></label>
                <select 
                  name="scoreColumn"
                  value={mapping.scoreColumn}
                  onChange={handleMappingChange}
                  className={`w-full rounded-md shadow-sm p-2.5 border ${mapping.scoreColumn ? 'border-[#007A66] bg-[#E5F2F0]/50' : 'border-red-300'}`}
                >
                  <option value="">-- اختر العمود --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className="p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم الطالب (اختياري)</label>
                <select 
                  name="studentIdColumn"
                  value={mapping.studentIdColumn}
                  onChange={handleMappingChange}
                  className="w-full rounded-md border-gray-300 shadow-sm p-2.5 border"
                >
                  <option value="">-- لا يوجد --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className="p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">الحالة (اختياري)</label>
                <select 
                  name="statusColumn"
                  value={mapping.statusColumn}
                  onChange={handleMappingChange}
                  className="w-full rounded-md border-gray-300 shadow-sm p-2.5 border"
                >
                  <option value="">-- لا يوجد --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <div className="pt-6 border-t flex justify-end gap-3">
              <button 
                onClick={() => setStep(1)}
                className="px-6 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                إلغاء وإعادة الرفع
              </button>
              <button 
                onClick={handleImport}
                disabled={!mapping.nameColumn || !mapping.scoreColumn}
                className="px-6 py-2 rounded-lg text-sm font-medium bg-[#007A66] text-white hover:bg-[#005F4F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                اعتماد واستيراد البيانات
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
