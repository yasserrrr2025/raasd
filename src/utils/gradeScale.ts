export const calculateGradeAndPercentage = (score: number | null) => {
  if (score === null) {
    return { gradeScale: '-', percentage: 0 };
  }

  // Ensure score is between 0 and 40 for percentage calculation
  const safeScore = Math.max(0, Math.min(40, score));
  const percentage = (safeScore / 40) * 100;

  let gradeScale = 'متدني';
  if (safeScore >= 36) gradeScale = 'ممتاز';
  else if (safeScore >= 32) gradeScale = 'جيد جداً';
  else if (safeScore >= 28) gradeScale = 'جيد';
  else if (safeScore >= 24) gradeScale = 'مقبول';
  else if (safeScore >= 20) gradeScale = 'ضعيف';
  else if (safeScore >= 1) gradeScale = 'متدني';
  else if (safeScore === 0) gradeScale = 'صفر'; // Can be handled specifically

  return { gradeScale, percentage };
};

export const getGeneralGrade = (percentage: number) => {
  if (percentage >= 90) return 'ممتاز';
  if (percentage >= 80) return 'جيد جداً';
  if (percentage >= 70) return 'جيد';
  if (percentage >= 60) return 'مقبول';
  if (percentage >= 50) return 'ضعيف';
  return 'متدني';
};
