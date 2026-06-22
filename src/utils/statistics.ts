import { StudentRecord, Statistics, GradeDistribution } from '../types';
import { getGeneralGrade } from './gradeScale';

export const calculateStatistics = (students: StudentRecord[]): Statistics => {
  const totalStudents = students.length;
  
  const testedStudentsList = students.filter(s => s.status === 'مختبر' && s.score !== null && s.score > 0);
  const absentStudentsList = students.filter(s => s.status === 'غائب');
  
  const testedStudents = testedStudentsList.length;
  const absentStudents = absentStudentsList.length;
  
  const testedPercentage = totalStudents > 0 ? (testedStudents / totalStudents) * 100 : 0;
  const absentPercentage = totalStudents > 0 ? (absentStudents / totalStudents) * 100 : 0;

  const scores = testedStudentsList.map(s => s.score as number).sort((a, b) => a - b);
  
  let mean = null;
  let median = null;
  let mode = null;
  let standardDeviation = null;
  let skewness = null;
  let highestScore = null;
  let lowestScore = null;
  let range = null;
  let generalPercentage = null;

  if (scores.length > 0) {
    const sum = scores.reduce((a, b) => a + b, 0);
    mean = sum / scores.length;
    
    const mid = Math.floor(scores.length / 2);
    median = scores.length % 2 !== 0 ? scores[mid] : (scores[mid - 1] + scores[mid]) / 2;
    
    highestScore = scores[scores.length - 1];
    lowestScore = scores[0];
    range = highestScore - lowestScore;

    const counts = new Map<number, number>();
    let maxCount = 0;
    scores.forEach(s => {
      const count = (counts.get(s) || 0) + 1;
      counts.set(s, count);
      if (count > maxCount) maxCount = count;
    });
    
    const modes = Array.from(counts.entries()).filter(([_, count]) => count === maxCount).map(([score]) => score);
    mode = modes.length > 0 ? modes[0] : scores[0]; // If multiple, pick first (simplification)

    if (scores.length > 1) {
      const variance = scores.reduce((acc, val) => acc + Math.pow(val - mean!, 2), 0) / (scores.length - 1);
      standardDeviation = Math.sqrt(variance);
      
      if (standardDeviation > 0) {
        // Skewness formula (Pearson's second coefficient or moment-based)
        // Using moment based: E[(X-mu)^3] / sigma^3
        const sumCube = scores.reduce((acc, val) => acc + Math.pow(val - mean!, 3), 0);
        skewness = (sumCube / scores.length) / Math.pow(standardDeviation, 3);
      } else {
        skewness = 0;
      }
    } else {
      standardDeviation = 0;
      skewness = 0;
    }

    generalPercentage = (mean / 40) * 100;
  }

  return {
    totalStudents,
    testedStudents,
    absentStudents,
    testedPercentage,
    absentPercentage,
    mean,
    median,
    mode,
    standardDeviation,
    skewness,
    highestScore,
    lowestScore,
    range,
    generalPercentage,
    generalGrade: generalPercentage !== null ? getGeneralGrade(generalPercentage) : '-'
  };
};

export const getGradeDistribution = (students: StudentRecord[]): GradeDistribution[] => {
  const tested = students.filter(s => s.status === 'مختبر' && s.score !== null && s.score > 0);
  const totalTested = tested.length;

  const distribution = [
    { label: 'متدني', count: 0, rangeStart: 1, rangeEnd: 19.9 },
    { label: 'ضعيف', count: 0, rangeStart: 20, rangeEnd: 23.9 },
    { label: 'مقبول', count: 0, rangeStart: 24, rangeEnd: 27.9 },
    { label: 'جيد', count: 0, rangeStart: 28, rangeEnd: 31.9 },
    { label: 'جيد جداً', count: 0, rangeStart: 32, rangeEnd: 35.9 },
    { label: 'ممتاز', count: 0, rangeStart: 36, rangeEnd: 40 }
  ];

  tested.forEach(student => {
    const score = student.score as number;
    if (score >= 36) distribution[5].count++;
    else if (score >= 32) distribution[4].count++;
    else if (score >= 28) distribution[3].count++;
    else if (score >= 24) distribution[2].count++;
    else if (score >= 20) distribution[1].count++;
    else distribution[0].count++;
  });

  return distribution.map(d => ({
    ...d,
    percentage: totalTested > 0 ? (d.count / totalTested) * 100 : 0
  }));
};
