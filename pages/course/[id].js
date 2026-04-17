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
  const curDiff = difficulties?.[lesson?.id] || 'medium';
  const questions = lesson?.quizzes?.[curDiff] || lesson?.quizzes || [];

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
  }, [questions, lessonIdx, curDiff, course?.id]);

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
    const lessonId = lesson.id;
    
    const curDiff = difficulties?.[lessonId] || 'medium';
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
  if (!course) return <div>{t('loading')}</div>;

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>{course.title}</h1>
      <div style={{ color: '#555' }}>{course.description}</div>

      <div style={{ marginTop: 20 }}>
        <strong>{t('toc')}</strong>
        <ul>
          {course.lessons.map((l, i) => (
            <li key={l.id} style={{ margin: '6px 0' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); setLessonIdx(i); setSelected(null); }}>
                {i + 1}. {l.title}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ background: '#f3f3f3', padding: 24, textAlign: 'center', color: '#666' }}>
          {t('noVideo')}
        </div>
      </div>

      {lesson.passages && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 15 }}>{t ? t('reading_passage') : 'Passage'}</h3>
          <div style={{ background: '#fafafa', padding: 16, border: '1px solid #ddd', borderRadius: 6, fontSize: 16, lineHeight: 1.6 }}>
            {lesson.passages[lang]}
          </div>
        </div>
      )}

      <h2>{t('quizPrefix')} {lesson.title} ({t(`difficulty_${difficulties?.[lesson.id] || 'medium'}`)})</h2>

      {currentQuestion ? (
        <div style={{ marginBottom: 20, padding: 16, border: '1px solid #ddd', borderRadius: 6 }}>
          <p style={{ marginBottom: 8 }}><strong>EN:</strong> {currentQuestion.question?.en || currentQuestion.question}</p>
          <p style={{ marginTop: 0, marginBottom: 16 }}><strong>KO:</strong> {currentQuestion.question?.ko || currentQuestion.question}</p>
          
          {currentOptions.map(option => (
            <label key={option.key} style={{ display: 'block', marginBottom: 8 }}>
              <input
                type="radio"
                name={currentQuestion.id}
                value={option.key}
                checked={selected === option.key}
                onChange={e => setSelected(e.target.value)}
                style={{ marginRight: 8 }}
              />
              {option.key}) {option.en} / {option.ko}
            </label>
          ))}

          <button onClick={() => submitQuiz(currentQuestion)} style={{ marginTop: 8 }}>{t('submit')}</button>

          {feedback && (
            <div style={{ marginTop: 18, padding: 16, borderRadius: 6, background: feedback.correct ? '#eef9ee' : '#f9eeee', border: `1px solid ${feedback.correct ? '#70b570' : '#d14646'}` }}>
              <strong>{feedback.correct ? t('correct_msg') : t('incorrect_msg')}</strong>
              <div style={{ marginTop: 10 }}><strong>{t('correct_answer')}:</strong> {feedback.correctKey}) {feedback.correctTextEn} / {feedback.correctTextKo}</div>
              <div style={{ marginTop: 10 }}><strong>{t('answer_explanation')}:</strong></div>
              <div style={{ marginTop: 8 }}><strong>EN:</strong> {feedback.explanationEn}</div>
              <div style={{ marginTop: 6 }}><strong>KO:</strong> {feedback.explanationKo}</div>
            </div>
          )}
        </div>
      ) : (
        <div>{t('loading')}</div>
      )}

      <h3 style={{ marginTop: 24 }}>{t('progress')}: {progress}%</h3>
      <h3 style={{ marginTop: 12 }}>{t('sat_score')}: {satScore}</h3>
    </div>
  );
}