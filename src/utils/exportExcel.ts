import * as XLSX from 'xlsx';
import { ProjectData, StudentRecord } from '../types';
import { calculateStatistics } from './statistics';

export const exportSubjectExcel = (project: ProjectData) => {
  const worksheetData = [
    ['م', 'اسم الطالب', 'رقم الطالب', 'الدرجة', 'الحالة', 'التقدير', 'النسبة المئوية', 'ملاحظات']
  ];

  project.students.forEach((student, index) => {
    worksheetData.push([
      (index + 1).toString(),
      student.name,
      student.studentId || '',
      student.score !== null ? student.score.toString() : '',
      student.status,
      student.gradeScale,
      student.score !== null ? student.percentage.toFixed(2) + '%' : '',
      student.notes || ''
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Set RTL
  if (!worksheet['!views']) worksheet['!views'] = [];
  worksheet['!views'].push({ rightToLeft: true });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الدرجات');

  XLSX.writeFile(workbook, `نتائج_${project.subject}_${project.grade}.xlsx`);
};

export const exportTemplateExcel = () => {
  const worksheetData = [
    ['اسم الطالب', 'الدرجة', 'رقم الطالب اختياري', 'الحالة اختياري', 'ملاحظات'],
    ['أحمد محمد عبدالله', '38', '1001', 'مختبر', ''],
    ['محمد خالد سعيد', '24', '1002', 'مختبر', ''],
    ['عبدالله سالم علي', 'غائب', '1003', 'غائب', 'غياب بعذر'],
    ['فهد ناصر حمد', '0', '1004', '', 'يحتاج مراجعة']
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Set RTL
  if (!worksheet['!views']) worksheet['!views'] = [];
  worksheet['!views'].push({ rightToLeft: true });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'درجات الطلاب');

  XLSX.writeFile(workbook, 'قالب_استيراد_درجات_رصد.xlsx');
};

export const exportCombinedExcel = (projects: ProjectData[]) => {
  if (projects.length === 0) return;

  // Collect all unique students by ID (or name if no ID)
  const studentMap = new Map<string, any>();
  const subjects: string[] = [];

  projects.forEach(project => {
    subjects.push(project.subject);
    project.students.forEach(student => {
      const key = student.studentId ? `id_${student.studentId}` : `name_${student.name.trim()}`;
      
      if (!studentMap.has(key)) {
        studentMap.set(key, {
          name: student.name,
          studentId: student.studentId || '',
          scores: {}
        });
      }
      
      const studentData = studentMap.get(key);
      studentData.scores[project.subject] = student.status === 'غائب' ? 'غائب' : (student.score !== null ? student.score : '');
    });
  });

  const headerRow = ['اسم الطالب', 'رقم الطالب', ...subjects];
  const worksheetData = [headerRow];

  Array.from(studentMap.values()).forEach(studentData => {
    const row = [studentData.name, studentData.studentId];
    subjects.forEach(subject => {
      row.push(studentData.scores[subject] || '');
    });
    worksheetData.push(row);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Set RTL
  if (!worksheet['!views']) worksheet['!views'] = [];
  worksheet['!views'].push({ rightToLeft: true });

  // Create Summary Sheet
  const summaryData = [
    ['المادة', 'إجمالي الطلاب', 'المختبرين', 'الغائبين', 'نسبة المختبرين', 'المتوسط', 'الانحراف المعياري', 'التقدير العام']
  ];

  projects.forEach(project => {
    const stats = calculateStatistics(project.students);
    summaryData.push([
      project.subject,
      stats.totalStudents.toString(),
      stats.testedStudents.toString(),
      stats.absentStudents.toString(),
      stats.testedPercentage.toFixed(2) + '%',
      stats.mean !== null ? stats.mean.toFixed(2) : '-',
      stats.standardDeviation !== null ? stats.standardDeviation.toFixed(2) : '-',
      stats.generalGrade
    ]);
  });

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  if (!summarySheet['!views']) summarySheet['!views'] = [];
  summarySheet['!views'].push({ rightToLeft: true });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الدرجات المجمعة');
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'مؤشرات المواد');

  XLSX.writeFile(workbook, 'الدرجات_المجمعة_رصد.xlsx');
};
