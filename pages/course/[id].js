import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useI18n } from '../../lib/i18n'

export default function CoursePage() {
  const router = useRouter()
  const { id } = router.query
  const [course, setCourse] = useState(null)
  const [lessonIdx, setLessonIdx] = useState(0)
  const [userId, setUserId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [difficulties, setDifficulties] = useState({})
  const [progress, setProgress] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [questionIndex, setQuestionIndex] = useState(0)

  useEffect(() => {
    let uid = localStorage.getItem('ai-study-user')
    if (!uid) {
      uid = 'u_' + Math.random().toString(36).slice(2, 9)
      localStorage.setItem('ai-study-user', uid)
    }
    setUserId(uid)
  }, [])

  useEffect(() => {
    if (!id) return
    fetch(`/api/course?id=${id}`)
      .then(r => r.json())
      .then(d => setCourse(d))
  }, [id])

  useEffect(() => {
    if (!userId || !id) return
    fetch(`/api/progress?userId=${userId}&courseId=${id}`)
      .then(r => r.json())
      .then(d => {
        if (typeof d.progress === 'number') setProgress(d.progress)
        if (d.difficulties) setDifficulties(d.difficulties)
      })
  }, [userId, id])

  useEffect(() => {
    if (!course) return
    selectNextQuestion()
  }, [course, lessonIdx, difficulties])

  const selectNextQuestion = () => {
    const lesson = course.lessons[lessonIdx]
    const curDiff = difficulties[lesson.id] || 'medium'
    const questions = (lesson.quizzes && lesson.quizzes[curDiff]) || []
    if (questions.length === 0) return
    // For infinite questions, cycle through or random
    const idx = questionIndex % questions.length
    setCurrentQuestion(questions[idx])
    setQuestionIndex(questionIndex + 1)
  }

  const saveProgress = async (p) => {
    setProgress(p)
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, courseId: id, progress: p, difficulties }),
    })
  }

  const submitQuiz = async () => {
    if (!course || !currentQuestion) return
    const lesson = course.lessons[lessonIdx]
    const lessonId = lesson.id
    const curDiff = difficulties[lessonId] || 'medium'
    const correct = currentQuestion.answer
    const correctAnswer = selected === correct

    // adjust difficulty
    const order = ['easy', 'medium', 'hard']
    let idx = order.indexOf(curDiff)
    if (correctAnswer && idx < order.length - 1) idx += 1
    if (!correctAnswer && idx > 0) idx -= 1
    const newDiff = order[idx]
    const newDifficulties = { ...difficulties, [lessonId]: newDiff }
    setDifficulties(newDifficulties)

    // save progress value (example: increment correct count)
    const got = correctAnswer ? (progress + 10) : progress
    setProgress(got)
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, courseId: id, progress: got, difficulties: newDifficulties }),
    })

    alert(correctAnswer ? t('correct_msg') : t('incorrect_msg'))
    setSelected(null)
    selectNextQuestion()
  }

  const { t } = useI18n()

  if (!course) return <div>{t('loading')}</div>

  const lesson = course.lessons[lessonIdx]
  const curDiff = difficulties[lesson.id] || 'medium'

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>{course.title}</h1>
      <div style={{ color: '#555' }}>{course.description}</div>

      <div style={{ marginTop: 20 }}>
        <strong>{t('toc')}</strong>
        <ul>
          {course.lessons.map((l, i) => (
            <li key={l.id} style={{ margin: '6px 0' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); setLessonIdx(i); setSelected(null); setQuestionIndex(0); selectNextQuestion() }}>{i+1}. {l.title}</a>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ background: '#f3f3f3', padding: 24, textAlign: 'center', color: '#666' }}>
          {t('noVideo')}
        </div>
      </div>

      <h2>{t('quizPrefix')} {lesson.title} ({t(`difficulty_${curDiff}`)})</h2>
      {currentQuestion && (
        <div style={{ marginBottom: 12 }}>
          <p>{currentQuestion.question}</p>
          {Object.entries(currentQuestion.options).map(([k, v]) => (
            <label key={k} style={{ display: 'block' }}>
              <input type="radio" name={currentQuestion.id} value={k} onChange={e => setSelected(e.target.value)} /> {k}) {v}
            </label>
          ))}
          <button onClick={submitQuiz} style={{ marginTop: 8 }}>{t('submit')}</button>
        </div>
      )}

      <h3 style={{ marginTop: 24 }}>{t('progress')}: {progress}</h3>
    </div>
  )
}
