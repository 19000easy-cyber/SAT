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
    select_answer: 'Select an answer before submitting.',
    correct_answer: 'Correct answer',
    answer_explanation: 'Explanation',
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
    select_answer: '제출 전에 답을 선택하세요.',
    correct_answer: '정답',
    answer_explanation: '풀이',
  }
}

const LanguageContext = createContext()

const AVAILABLE = ['en', 'ko']

export function I18nProvider({ children }) {
  const [lang, _setLang] = useState('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ai-study-lang')
      if (stored && AVAILABLE.includes(stored)) {
        _setLang(stored)
      } else {
        const nav = (navigator.language || navigator.userLanguage || 'en').slice(0,2)
        if (AVAILABLE.includes(nav)) {
          _setLang(nav)
        }
      }
    } catch (e) {}
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      try { document.documentElement.lang = lang } catch (e) {}
      try { localStorage.setItem('ai-study-lang', lang) } catch (e) {}
    }
  }, [lang, mounted])

  const setLang = (l) => { if (AVAILABLE.includes(l)) _setLang(l) }

  const t = (k) => (translations[lang] && translations[lang][k]) || translations['en'][k] || k

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, available: AVAILABLE }}>
      <div style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '16px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', color: '#667eea', margin: 0 }}>📚 SAT Study</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            {AVAILABLE.map(code => (
              <button 
                key={code} 
                onClick={() => setLang(code)} 
                style={{ 
                  padding: '8px 16px',
                  background: lang === code ? '#4a90e2' : '#e0e0e0',
                  color: lang === code ? 'white' : '#333',
                  fontWeight: lang === code ? 'bold' : 'normal',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {code === 'en' ? '🇬🇧' : '🇰🇷'} {translations[lang][`lang_${code}`] || code}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto', background: 'white', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)' }}>
        {children}
      </div>
    </LanguageContext.Provider>
  )
}

export const useI18n = () => useContext(LanguageContext)

export default LanguageContext
