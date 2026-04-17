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

 const { t } = useI18n();

  // 1. Hook에서 사용할 변수들을 먼저 정의합니다.
  const lesson = course?.lessons[lessonIdx];
  const curDiff = difficulties[lesson?.id] || 'medium';
  const questions = (lesson?.quizzes && lesson?.quizzes[curDiff]) || [];

  // 2. 그 다음 모든 Hook(useEffect, useMemo 등)을 배치합니다.
  useEffect(() => {
    if (!questions || questions.length === 0) {
      setQuestionOrder([]);
      setCurrentQuestionIdx(0);
      setSelected(null);
      setFeedback(null);
      return;
    }
    setQuestionOrder(shuffleArray(questions));
    setCurrentQuestionIdx(0);
    setSelected(null);
    setFeedback(null);
  }, [lessonIdx, curDiff, course?.id]); // 의존성 배열 유지

  // 3. 마지막으로 데이터 로딩 중일 때의 return 처리를 합니다.
  if (!course) return <div>{t('loading')}</div>;

  // 1. 변수 선언을 useMemo 위로 올립니다.
  const currentQuestionIdxInOrder = questionOrder[currentQuestionIdx];
  const currentQuestion = questions[currentQuestionIdxInOrder];

  // 2. useMemo는 딱 한 번만 정의합니다.
  const currentOptions = useMemo(() => {
    if (!currentQuestion) return [];
    
    const enOptions = currentQuestion.options?.en || currentQuestion.options || {};
    const koOptions = currentQuestion.options?.ko || currentQuestion.options || {};
    
    return shuffleArray(Object.keys(enOptions).map(key => ({
      key,
      en: enOptions[key],
      ko: koOptions[key] || enOptions[key],
    })));
  }, [currentQuestion?.id]); // 의존성 배열 확인
  const submitQuiz = async (q) => {
    if (!course) return
    if (!selected) {
      alert(t('select_answer'))
      return
    }

    const lessonId = lesson.id
    const curDiff = difficulties[lessonId] || 'medium'
    const question = q
    const correct = question.answer
    const correctAnswer = selected === correct
    const points = question.points || 10

    const order = ['easy', 'medium', 'hard']
    let idx = order.indexOf(curDiff)
    if (correctAnswer && idx < order.length - 1) idx += 1
    if (!correctAnswer && idx > 0) idx -= 1
    const newDiff = order[idx]
    const newDifficulties = { ...difficulties, [lessonId]: newDiff }
    setDifficulties(newDifficulties)

    const scoreChange = correctAnswer ? points : -Math.floor(points / 2)
    const newSatScore = Math.max(200, Math.min(800, satScore + scoreChange))
    setSatScore(newSatScore)

    const got = correctAnswer ? 100 : 50
    setProgress(got)

    const correctOption = currentOptions.find(option => option.key === correct) || { en: correct, ko: correct }
    setFeedback({
      correct: correctAnswer,
      correctKey: correct,
      correctTextEn: correctOption.en,
      correctTextKo: correctOption.ko,
      explanationEn: question.explanation?.en || `The correct answer is ${correctOption.en}.`,
      explanationKo: question.explanation?.ko || `정답은 ${correctOption.ko}입니다.`,
    })

    await saveProgress(got, newSatScore, newDifficulties)

    setSelected(null)
    if (questionOrder.length > 1) {
      const nextIndex = currentQuestionIdx + 1
      if (nextIndex < questionOrder.length) {
        setCurrentQuestionIdx(nextIndex)
      } else {
        setQuestionOrder(shuffleArray(questionOrder))
        setCurrentQuestionIdx(0)
      }
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>{course.title}</h1>
      <div style={{ color: '#555' }}>{course.description}</div>

      <div style={{ marginTop: 20 }}>
        <strong>{t('toc')}</strong>
        <ul>
          {course.lessons.map((l, i) => (
            <li key={l.id} style={{ margin: '6px 0' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); setLessonIdx(i); setSelected(null) }}>{i + 1}. {l.title}</a>
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
          <h3>{t('reading_passage')}</h3>
          <div style={{ background: '#fafafa', padding: 16, border: '1px solid #ddd', fontSize: 16, lineHeight: 1.6 }}>
            {lesson.passages['en']}
          </div>
        </div>
      )}

      <h2>{t('quizPrefix')} {lesson.title} ({t(`difficulty_${curDiff}`)})</h2>

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
  )
}
