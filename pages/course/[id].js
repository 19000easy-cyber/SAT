import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { useI18n } from '../../lib/i18n'
const shuffleArray = (array) => {
  return [...array].sort(() => Math.random() - 0.5);
};

export default function CoursePage() {
  const router = useRouter()
  const { id } = router.query
  const [course, setCourse] = useState(null)
  const [lessonIdx, setLessonIdx] = useState(0)
  const [questionOrder, setQuestionOrder] = useState([])
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [userId, setUserId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [difficulties, setDifficulties] = useState({})
  const [progress, setProgress] = useState(0)
  const [satScore, setSatScore] = useState(200)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    let uid = localStorage.getItem('ai-study-user')
    if (!uid) {
      uid = 'u_' + Math.random().toString(36).slice(2, 9)
      localStorage.setItem('ai-study-user', uid)
    }
    setUserId(uid)
  }, [])

  useEffect(() => {
    if (id) {
      fetch(`/api/course?id=${id}`)
        .then(res => res.json())
        .then(data => {
          if (data) setCourse(data)
        })
        .catch(err => console.error('Course fetch error:', err))
    }
  }, [id])

  useEffect(() => {
    if (!userId || !id) return
    fetch(`/api/progress?userId=${userId}&courseId=${id}`)
      .then(r => r.json())
      .then(d => {
        if (typeof d.progress === 'number') {
          setProgress(d.progress)
        }
        if (d.difficulties) {
          setDifficulties(d.difficulties)
        }
        if (d.satScore) {
          setSatScore(d.satScore)
        }
      })
      .catch(err => console.error('Progress fetch error:', err))
  }, [userId, id])

  const saveProgress = async (p, newSatScore, newDifficulties) => {
    setProgress(p)
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, courseId: id, progress: p, difficulties: newDifficulties, satScore: newSatScore }),
    })
  }

  const { t, lang } = useI18n();

  // 1. 데이터 정의 (딱 한 번만 선언!)
  const lesson = course?.lessons?.[lessonIdx];
  const lessonId = lesson?.id;
  const curDiff = difficulties?.[lessonId] || 'medium';
  const questions = lesson?.quizzes?.[curDiff] || [];

  // 2. 퀴즈 상태 업데이트 Hook
  useEffect(() => {
    if (!questions || questions.length === 0) {
      setQuestionOrder([]);
      setCurrentQuestionIdx(0);
      setSelected(null);
      setFeedback(null);
      return;
    }
    // 인덱스 배열 생성 후 섞기
    const indices = Array.from({ length: questions.length }, (_, i) => i);
    setQuestionOrder(shuffleArray(indices));
    setCurrentQuestionIdx(0);
    setSelected(null);
    setFeedback(null);
  }, [lessonId, curDiff]);

  // 3. 현재 문제 정보 정의
  const currentQuestionIdx_Shuffled = questionOrder[currentQuestionIdx];
  const currentQuestion = currentQuestionIdx_Shuffled !== undefined ? questions[currentQuestionIdx_Shuffled] : null;

  // 4. 보기 셔플 및 옵션 정의 (중복 없이 한 번만!)
  const currentOptions = useMemo(() => {
    if (!currentQuestion) return [];
    
    const enOptions = currentQuestion.options?.en || currentQuestion.options || {};
    const koOptions = currentQuestion.options?.ko || currentQuestion.options || {};
    
    return shuffleArray(Object.keys(enOptions).map(key => ({
      key,
      en: enOptions[key],
      ko: koOptions[key] || enOptions[key],
    })));
  }, [currentQuestion?.id]);

  // 5. submitQuiz 함수 정의
  const submitQuiz = async (question) => {
    if (!course || !selected) {
      if (!selected) alert(t ? t('select_answer') : 'Please select an answer');
      return;
    }

    const correct = question.answer;
    const isCorrect = selected === correct;
    
    const order = ['easy', 'medium', 'hard'];
    let idx = order.indexOf(curDiff);
    if (isCorrect && idx < order.length - 1) idx += 1;
    if (!isCorrect && idx > 0) idx -= 1;
    const newDiff = order[idx];

    const newDifficulties = { ...difficulties, [lessonId]: newDiff };
    const scoreChange = isCorrect ? 10 : -5;
    const newSatScore = Math.max(200, Math.min(800, (satScore || 0) + scoreChange));
    const gotProgress = isCorrect ? 100 : 50;

    if (setDifficulties) setDifficulties(newDifficulties);
    if (setSatScore) setSatScore(newSatScore);
    if (setProgress) setProgress(gotProgress);

    const correctOption = currentOptions.find(o => o.key === correct) || { en: '', ko: '' };
    setFeedback({
      correct: isCorrect,
      correctKey: correct,
      correctTextEn: correctOption.en,
      correctTextKo: correctOption.ko,
      explanationEn: question.explanation?.en || '',
      explanationKo: question.explanation?.ko || `정답은 ${correctOption.ko}입니다.`,
      detailedExplanation: question.detailedExplanation || null,
      videoUrl: lesson.videoUrl || null,
      videoTitle: lesson.videoTitle || null,
    });

    if (typeof saveProgress === 'function') {
      await saveProgress(gotProgress, newSatScore, newDifficulties);
    }

    setSelected(null);

    if (questionOrder && questionOrder.length > 0) {
      const nextIndex = currentQuestionIdx + 1;
      if (nextIndex < questionOrder.length) {
        setCurrentQuestionIdx(nextIndex);
      } else {
        setCurrentQuestionIdx(0);
      }
    }
  };

  // 6. 데이터가 없을 때의 처리
  if (!course) return <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>{t('loading')}</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      {/* 헤더 */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '30px 20px', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px', margin: 0 }}>{course.title}</h1>
          <p style={{ opacity: 0.95, margin: 0 }}>{course.description}</p>
        </div>
      </div>

      {/* 메인 콘텐츠 (좌우 2분할) */}
      <div style={{ display: 'flex', maxWidth: '1400px', margin: '0 auto', gap: '20px', padding: '20px', minHeight: 'calc(100vh - 140px)' }}>
        
        {/* ===== 왼쪽 패널: 목차 + 지문 (고정/스크롤) ===== */}
        <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* 목차 (고정) */}
          <div style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)', border: '1px solid #e0e0e0', position: 'sticky', top: '20px' }}>
            <strong style={{ display: 'block', marginBottom: '12px', fontSize: '14px', color: '#667eea', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📚 {t('toc')}</strong>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {course.lessons.map((l, i) => (
                <li key={l.id} style={{ marginBottom: '6px' }}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setLessonIdx(i); setSelected(null); }} 
                    style={{ 
                      display: 'block', 
                      padding: '10px 12px', 
                      background: lessonIdx === i ? '#667eea' : 'transparent', 
                      color: lessonIdx === i ? 'white' : '#333', 
                      borderRadius: '6px', 
                      textDecoration: 'none',
                      fontWeight: lessonIdx === i ? '600' : '500',
                      fontSize: '13px',
                      transition: 'all 0.2s',
                      border: lessonIdx === i ? '2px solid #667eea' : '1px solid transparent'
                    }}
                  >
                    {i + 1}. {l.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 지문 (스크롤 가능) */}
          {lesson.passages && (
            <div style={{ 
              background: 'white', 
              padding: '16px', 
              borderRadius: '12px', 
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              border: '2px solid #ffd700',
              overflow: 'auto',
              maxHeight: '400px'
            }}>
              <h4 style={{ marginBottom: 12, marginTop: 0, color: '#ffa500', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📖 {t ? t('reading_passage') : 'Passage'}</h4>
              <div style={{ fontSize: '14px', lineHeight: 1.8, color: '#333' }}>
                {lesson.passages[lang]}
              </div>
            </div>
          )}
        </div>

        {/* ===== 오른쪽 패널: 문제 + 피드백 (스크롤 가능) ===== */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '8px' }}>
          
          {/* 문제 제목 + 난이도 선택 */}
          <div style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)', border: '1px solid #e0e0e0' }}>
            <h3 style={{ margin: 0, color: '#333', fontSize: '16px' }}>
              {t('quizPrefix')} <span style={{ color: '#4a90e2' }}>{lesson.title}</span>
            </h3>
            
            {/* 난이도 선택 버튼 */}
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              {['easy', 'medium', 'hard'].map(diff => (
                <button
                  key={diff}
                  onClick={() => {
                    const newDiff = { ...difficulties, [lessonId]: diff };
                    setDifficulties(newDiff);
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: curDiff === diff ? (diff === 'easy' ? '#66bb6a' : diff === 'medium' ? '#ffa726' : '#ef5350') : '#e0e0e0',
                    color: curDiff === diff ? 'white' : '#666',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: curDiff === diff ? 'bold' : '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (curDiff !== diff) e.target.style.background = '#ccc';
                  }}
                  onMouseLeave={(e) => {
                    if (curDiff !== diff) e.target.style.background = '#e0e0e0';
                  }}
                >
                  {diff === 'easy' ? '⭐' : diff === 'medium' ? '⭐⭐' : '⭐⭐⭐'} {t(`difficulty_${diff}`)}
                </button>
              ))}
            </div>
          </div>

          {/* 문제 */}
          {currentQuestion ? (
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)', border: '2px solid #4a90e2' }}>
              
              {/* 질문 */}
              <div style={{ marginBottom: '16px' }}>
                <p style={{ marginBottom: 0, fontSize: '15px', lineHeight: '1.6', color: '#333', fontWeight: '500' }}>
                  <strong style={{ color: '#4a90e2', marginRight: '8px' }}>Q:</strong> 
                  {currentQuestion.question?.[lang] || currentQuestion.question?.en || currentQuestion.question}
                </p>
              </div>

              {/* 선택지 */}
              <div style={{ marginBottom: '16px' }}>
                {currentOptions.map(option => (
                  <label key={option.key} 
                    style={{ 
                      display: 'block', 
                      marginBottom: 10, 
                      padding: '12px', 
                      borderRadius: '8px', 
                      background: selected === option.key ? '#e3f2fd' : '#f9f9f9', 
                      border: selected === option.key ? '2px solid #4a90e2' : '1px solid #e0e0e0', 
                      cursor: 'pointer', 
                      transition: 'all 0.3s',
                      boxShadow: selected === option.key ? '0 2px 8px rgba(74, 144, 226, 0.1)' : 'none'
                    }}
                  >
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={option.key}
                      checked={selected === option.key}
                      onChange={e => setSelected(e.target.value)}
                      style={{ marginRight: 10, cursor: 'pointer' }}
                    />
                    <strong style={{ color: selected === option.key ? '#4a90e2' : '#333', fontSize: '14px' }}>{option.key})</strong>
                    <span style={{ marginLeft: '4px', color: selected === option.key ? '#4a90e2' : '#666', fontSize: '14px' }}>
                      {option[lang] || option.en}
                    </span>
                  </label>
                ))}
              </div>

              {/* 제출 버튼 */}
              <button 
                onClick={() => submitQuiz(currentQuestion)} 
                style={{ 
                  width: '100%',
                  padding: '12px 20px', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontSize: '15px', 
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s',
                  marginBottom: '12px'
                }}
                onMouseEnter={(e) => e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)'}
                onMouseLeave={(e) => e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'}
              >
                ✓ {t('submit')}
              </button>

              {/* 피드백 */}
              {feedback && (
                <div style={{ 
                  padding: '16px', 
                  borderRadius: '8px', 
                  background: feedback.correct ? '#e8f5e9' : '#ffebee', 
                  border: `2px solid ${feedback.correct ? '#4caf50' : '#f44336'}`,
                  boxShadow: feedback.correct ? '0 2px 8px rgba(76, 175, 80, 0.1)' : '0 2px 8px rgba(244, 67, 54, 0.1)'
                }}>
                  <strong style={{ fontSize: '16px', color: feedback.correct ? '#4caf50' : '#f44336', display: 'flex', alignItems: 'center' }}>
                    {feedback.correct ? '✓ ' : '✗ '} {feedback.correct ? t('correct_msg') : t('incorrect_msg')}
                  </strong>
                  
                  {/* 정답 */}
                  <div style={{ marginTop: 12, padding: '12px', background: 'white', borderRadius: '6px', borderLeft: `4px solid ${feedback.correct ? '#4caf50' : '#f44336'}` }}>
                    <strong style={{ fontSize: '13px', color: '#666' }}>{t('correct_answer')}:</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#333' }}>
                      <strong>{feedback.correctKey})</strong> {feedback[`correctText${lang === 'ko' ? 'Ko' : 'En'}`]}
                    </p>
                  </div>
                  
                  {/* 기본 풀이 */}
                  <div style={{ marginTop: 12, padding: '12px', background: 'white', borderRadius: '6px' }}>
                    <strong style={{ fontSize: '13px', color: '#666' }}>{t('answer_explanation')}:</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#555', lineHeight: '1.6' }}>
                      {feedback[`explanation${lang === 'ko' ? 'Ko' : 'En'}`]}
                    </p>
                  </div>

                  {/* 상세한 풀이 */}
                  {feedback.detailedExplanation && (
                    <div style={{ marginTop: 12, padding: '12px', background: '#f0f8ff', borderRadius: '6px', border: '1px solid #b3d9ff' }}>
                      <strong style={{ fontSize: '13px', color: '#0066cc', display: 'flex', alignItems: 'center' }}>
                        💡 {lang === 'ko' ? '자세한 풀이' : 'Detailed Solution'}
                      </strong>
                      <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#333', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                        {feedback.detailedExplanation[lang === 'ko' ? 'ko' : 'en']}
                      </p>
                    </div>
                  )}

                  {/* 학습 영상 링크 */}
                  {feedback.videoUrl && (
                    <div style={{ marginTop: 12, padding: '12px', background: '#fff3cd', borderRadius: '6px', border: '1px solid #ffc107' }}>
                      <strong style={{ fontSize: '13px', color: '#856404', display: 'flex', alignItems: 'center' }}>
                        📺 {lang === 'ko' ? '학습 영상' : 'Learn More'}
                      </strong>
                      <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#666' }}>
                        {feedback.videoTitle}
                      </p>
                      <a 
                        href={feedback.videoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                          display: 'inline-block',
                          marginTop: '8px',
                          padding: '6px 12px',
                          background: '#ffc107',
                          color: '#333',
                          textDecoration: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#ffb300'}
                        onMouseLeave={(e) => e.target.style.background = '#ffc107'}
                      >
                        {lang === 'ko' ? '영상 보기' : 'Watch Video'} →
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999', fontSize: '16px' }}>
              {t('loading')}
            </div>
          )}

          {/* 진행도 (하단) */}
          <div style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)', border: '1px solid #e0e0e0' }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#999', marginBottom: '4px' }}>{t('progress')}</p>
                <h3 style={{ margin: 0, fontSize: '24px', color: '#4a90e2', fontWeight: 'bold' }}>{progress}%</h3>
                <div style={{ marginTop: '8px', background: '#e0e0e0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(90deg, #667eea, #764ba2)', height: '100%', width: `${progress}%`, transition: 'width 0.3s' }} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#999', marginBottom: '4px' }}>{t('sat_score')}</p>
                <h3 style={{ margin: 0, fontSize: '24px', color: '#e74c3c', fontWeight: 'bold' }}>{satScore}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#999' }}>/ 800</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}