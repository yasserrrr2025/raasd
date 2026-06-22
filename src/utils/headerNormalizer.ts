export const normalizeHeader = (text: string): string => {
  if (!text) return '';
  
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // إزالة التشكيل
    .replace(/ـ/g, '') // إزالة التطويل
    .replace(/[أإآ]/g, 'ا') // توحيد الألف
    .replace(/[ىي]/g, 'ي') // توحيد الياء والألف المقصورة
    .replace(/ة/g, 'ه') // توحيد التاء المربوطة
    .replace(/[^ا-يa-z0-9\s]/g, ' ') // إزالة الرموز الخاصة مع إبقاء المسافات
    .replace(/\s+/g, ' ') // إزالة المسافات المكررة
    .trim();
};

export const identifyNameColumn = (headers: string[]): string | null => {
  const nameKeywords = [
    'اسم الطالب', 'اسم الطالبه', 'الطالب', 'الطالبه', 'الاسم', 'اسم',
    'الاسم الرباعي', 'اسم المستفيد', 'اسم المختبر', 'اسم الدارس',
    'student name', 'name', 'full name', 'الاسماء', 'الاسم كامل'
  ];

  let bestMatch = null;
  let highestScore = 0;

  headers.forEach(header => {
    const normalized = normalizeHeader(header);
    let score = 0;

    nameKeywords.forEach(keyword => {
      const normKeyword = normalizeHeader(keyword);
      if (normalized === normKeyword) {
        score += 10;
      } else if (normalized.includes(normKeyword) || normKeyword.includes(normalized)) {
        score += 5;
      }
    });

    if (score > highestScore) {
      highestScore = score;
      bestMatch = header;
    }
  });

  return highestScore > 0 ? bestMatch : null;
};

export const identifyScoreColumn = (headers: string[]): string | null => {
  const scoreKeywords = [
    'الدرجه', 'الدرجات', 'درجات', 'درجه', 'درجه الاختبار',
    'الدرجه النهائيه', 'الدرجه الكليه', 'المجموع', 'النتيجه',
    'علامه', 'العلامه', 'score', 'mark', 'grade', 'result'
  ];

  let bestMatch = null;
  let highestScore = 0;

  headers.forEach(header => {
    const normalized = normalizeHeader(header);
    let score = 0;

    scoreKeywords.forEach(keyword => {
      const normKeyword = normalizeHeader(keyword);
      if (normalized === normKeyword) {
        score += 10;
      } else if (normalized.includes(normKeyword) || normKeyword.includes(normalized)) {
        score += 5;
      }
    });

    if (score > highestScore) {
      highestScore = score;
      bestMatch = header;
    }
  });

  return highestScore > 0 ? bestMatch : null;
};

export const detectColumns = (headers: string[], dataRows: any[][]) => {
  const nameCol = identifyNameColumn(headers);
  const scoreCol = identifyScoreColumn(headers);
  
  // Try to use data heuristics if headers aren't enough
  // Here we could analyze dataRows if nameCol or scoreCol are null

  return { nameColumn: nameCol, scoreColumn: scoreCol };
};
