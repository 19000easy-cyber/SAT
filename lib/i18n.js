import React, { createContext, useState, useContext, useEffect } from 'react'

const translations = {
  en: {
    title: 'SAT Study',
    desc: 'SAT study platform — videos, quizzes, progress',
    courses: 'Courses',
    toc: 'Contents',
    noVideo: 'No video available.',
    quizPrefix: 'Quiz —',
    submit: 'Submit',
    progress: 'My progress',
    loading: 'Loading...',
    correct_msg: 'Correct! Difficulty adjusted.',
    incorrect_msg: 'Incorrect. Difficulty adjusted.',
    difficulty_easy: 'Easy',
    difficulty_medium: 'Medium',
    difficulty_hard: 'Hard',
    lang_en: 'English',
    lang_ko: '한국어',
    reading_passage: 'Reading Passage',
    sat_score: 'SAT Score',
  },
  ko: {
    title: 'SAT Study',
    desc: 'SAT 준비용 학습 플랫폼 — 동영상, 퀴즈, 진도 저장',
    courses: '코스',
    toc: '목차',
    noVideo: '동영상은 제공되지 않습니다.',
    quizPrefix: '퀴즈 —',
    submit: '제출',
    progress: '내 진도',
    loading: '로딩 중...',
    correct_msg: '정답입니다! 난이도가 조정되었습니다.',
    incorrect_msg: '오답입니다. 난이도가 조정되었습니다.',
    difficulty_easy: '쉬움',
    difficulty_medium: '보통',
    difficulty_hard: '어려움',
    lang_en: 'English',
    lang_ko: '한국어',
    reading_passage: '읽기 지문',
    sat_score: 'SAT 점수',
  }
}

const LanguageContext = createContext()

const AVAILABLE = ['en', 'ko']

export function I18nProvider({ children }) {
  const detect = () => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('ai-study-lang')
        if (stored && AVAILABLE.includes(stored)) return stored
        const nav = (navigator.language || navigator.userLanguage || 'en').slice(0,2)
        if (AVAILABLE.includes(nav)) return nav
      }
    } catch (e) {}
    return 'en'
  }

  const [lang, _setLang] = useState(detect)

  useEffect(() => {
    try { document.documentElement.lang = lang } catch (e) {}
    try { localStorage.setItem('ai-study-lang', lang) } catch (e) {}
  }, [lang])

  const setLang = (l) => { if (AVAILABLE.includes(l)) _setLang(l) }

  const t = (k) => (translations[lang] && translations[lang][k]) || translations['en'][k] || k

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, available: AVAILABLE }}>
      <div style={{ maxWidth: 900, margin: '12px auto', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, margin: '12px 0' }}>
          {AVAILABLE.map(code => (
            <button key={code} onClick={() => setLang(code)} style={{ padding: '6px 10px' }}>
              {translations[lang][`lang_${code}`] || translations['en'][`lang_${code}`] || code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {children}
    </LanguageContext.Provider>
  )
}

export const useI18n = () => useContext(LanguageContext)

export default LanguageContext
