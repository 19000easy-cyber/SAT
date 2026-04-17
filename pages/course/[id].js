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
    <div style={{ padding: '40px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '30px', borderRadius: '8px', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px', margin: 0 }}>{course.title}</h1>
          <p style={{ opacity: 0.95, margin: 0 }}>{course.description}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '20px', marginBottom: '20px' }}>
          <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <strong style={{ display: 'block', marginBottom: '12px' }}>{t('toc')}</strong>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {course.lessons.map((l, i) => (
                <li key={l.id} style={{ marginBottom: '8px' }}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setLessonIdx(i); setSelected(null); }} style={{ display: 'block', padding: '8px 12px', background: lessonIdx === i ? '#4a90e2' : 'transparent', color: lessonIdx === i ? 'white' : '#4a90e2', borderRadius: '4px', textDecoration: 'none' }}>
                    {i + 1}. {l.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ background: '#f3f3f3', padding: 24, textAlign: 'center', color: '#666', borderRadius: '8px' }}>
                {t('noVideo')}
              </div>
            </div>

            {lesson.passages && (
              <div style={{ marginBottom: 20, background: '#fffacd', padding: '16px', borderRadius: '8px', border: '2px solid #ffd700' }}>
                <h3 style={{ marginBottom: 15, marginTop: 0 }}>📖 {t ? t('reading_passage') : 'Passage'}</h3>
                <div style={{ background: 'white', padding: 16, border: '1px solid #ffd700', borderRadius: 6, fontSize: 16, lineHeight: 1.8 }}>
                  {lesson.passages[lang]}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <h2>{t('quizPrefix')} {lesson.title} ({t(`difficulty_${difficulties?.[lesson.id] || 'medium'}`)})</h2>

      {currentQuestion ? (
        <div style={{ marginBottom: 20, padding: 20, border: '2px solid #4a90e2', borderRadius: 8, background: '#f9fbff' }}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ marginBottom: 8, fontSize: '16px', lineHeight: '1.6' }}><strong>Q:</strong> {currentQuestion.question?.[lang] || currentQuestion.question?.en || currentQuestion.question}</p>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            {currentOptions.map(option => (
              <label key={option.key} style={{ display: 'block', marginBottom: 10, padding: '10px', borderRadius: '6px', background: selected === option.key ? '#e3f2fd' : '#fff', border: selected === option.key ? '2px solid #4a90e2' : '1px solid #ddd', cursor: 'pointer', transition: 'all 0.2s' }}>
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option.key}
                  checked={selected === option.key}
                  onChange={e => setSelected(e.target.value)}
                  style={{ marginRight: 8 }}
                />
                <strong>{option.key})</strong> {option[lang] || option.en}
              </label>
            ))}
          </div>

          <button onClick={() => submitQuiz(currentQuestion)} style={{ marginTop: 16, padding: '10px 20px', background: '#4a90e2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>{t('submit')}</button>

          {feedback && (
            <div style={{ marginTop: 18, padding: 16, borderRadius: 6, background: feedback.correct ? '#e8f5e9' : '#ffebee', border: `2px solid ${feedback.correct ? '#4caf50' : '#f44336'}` }}>
              <strong style={{ fontSize: '18px', color: feedback.correct ? '#4caf50' : '#f44336' }}>{feedback.correct ? '✓ ' + t('correct_msg') : '✗ ' + t('incorrect_msg')}</strong>
              <div style={{ marginTop: 12 }}><strong>{t('correct_answer')}:</strong> {feedback.correctKey}) {feedback[`correctText${lang === 'ko' ? 'Ko' : 'En'}`]}</div>
              <div style={{ marginTop: 12 }}><strong>{t('answer_explanation')}:</strong></div>
              <div style={{ marginTop: 8 }}>{feedback[`explanation${lang === 'ko' ? 'Ko' : 'En'}`]}</div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>{t('loading')}</div>
      )}

      <div style={{ marginTop: 32, padding: '16px', background: '#f0f0f0', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: 8 }}>{t('progress')}: <span style={{ color: '#4a90e2', fontSize: '24px' }}>{progress}%</span></h3>
        <h3 style={{ marginTop: 0 }}>{t('sat_score')}: <span style={{ color: '#e74c3c', fontSize: '24px' }}>{satScore}</span></h3>
      </div>
    </div>
  );
}