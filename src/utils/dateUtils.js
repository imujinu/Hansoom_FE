/**
 * 전역 Date 유틸리티 함수들
 * 서버에서 받은 시간 데이터를 올바르게 처리하기 위한 유틸리티
 */

/**
 * 서버에서 받은 ISO 시간 문자열을 Date 객체로 변환
 * Z가 없으면 자동으로 추가하여 UTC로 인식하도록 함
 * @param {string} isoString - 서버에서 받은 시간 문자열
 * @returns {Date} Date 객체
 */
export function parseServerDate(isoString) {
  if (!isoString) return null;
  
  // ISO 문자열에 Z가 없으면 Z를 붙여서 UTC로 인식하도록 함
  const isoWithZ = isoString.endsWith('Z') ? isoString : isoString + 'Z';
  const date = new Date(isoWithZ);
  
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string:', isoString);
    return null;
  }
  
  return date;
}

/**
 * 서버 시간을 YYYY.MM.DD HH:MM 형식으로 포맷팅
 * @param {string} isoString - 서버에서 받은 시간 문자열
 * @returns {string} 포맷팅된 시간 문자열
 */
export function formatServerDateTime(isoString) {
  const date = parseServerDate(isoString);
  if (!date) return "";
  
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  
  return `${y}.${m}.${day} ${hh}:${mm}`;
}

/**
 * 서버 시간을 YYYY.MM.DD 형식으로 포맷팅
 * @param {string} isoString - 서버에서 받은 시간 문자열
 * @returns {string} 포맷팅된 날짜 문자열
 */
export function formatServerDate(isoString) {
  const date = parseServerDate(isoString);
  if (!date) return "";
  
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  
  return `${y}.${m}.${day}`;
}

/**
 * 서버 시간을 한국어 형식으로 포맷팅 (예: 2024년 1월 15일)
 * @param {string} isoString - 서버에서 받은 시간 문자열
 * @returns {string} 포맷팅된 날짜 문자열
 */
export function formatServerDateKorean(isoString) {
  const date = parseServerDate(isoString);
  if (!date) return "";
  
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

/**
 * 서버 시간을 월일 형식으로 포맷팅 (예: 1월 15일)
 * @param {string} isoString - 서버에서 받은 시간 문자열
 * @returns {string} 포맷팅된 날짜 문자열
 */
export function formatServerMonthDay(isoString) {
  const date = parseServerDate(isoString);
  if (!date) return "";
  
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/**
 * 서버 시간 배열을 createdTime 기준으로 최신순 정렬
 * @param {Array} items - 정렬할 배열
 * @param {string} timeField - 시간 필드명 (기본값: 'createdTime')
 * @returns {Array} 정렬된 배열
 */
export function sortByServerTime(items, timeField = 'createdTime') {
  if (!Array.isArray(items)) return [];
  
  return items.sort((a, b) => {
    const dateA = parseServerDate(a[timeField]);
    const dateB = parseServerDate(b[timeField]);
    
    if (!dateA || !dateB) return 0;
    
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * 현재 시간을 ISO 문자열로 반환
 * @returns {string} 현재 시간의 ISO 문자열
 */
export function getCurrentISOTime() {
  return new Date().toISOString();
}

/**
 * 현재 시간을 YYYY-MM-DD 형식으로 반환
 * @returns {string} 현재 날짜의 YYYY-MM-DD 문자열
 */
export function getCurrentDateString() {
  return new Date().toISOString().split('T')[0];
}

/**
 * 내일 날짜를 YYYY-MM-DD 형식으로 반환
 * @returns {string} 내일 날짜의 YYYY-MM-DD 문자열
 */
export function getTomorrowDateString() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

/**
 * 두 날짜 사이의 일수 계산
 * @param {string} startDate - 시작 날짜 (YYYY-MM-DD)
 * @param {string} endDate - 종료 날짜 (YYYY-MM-DD)
 * @returns {number} 일수
 */
export function calculateDaysBetween(startDate, endDate) {
  const start = parseServerDate(startDate);
  const end = parseServerDate(endDate);
  
  if (!start || !end) return 0;
  
  const diffTime = end.getTime() - start.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
