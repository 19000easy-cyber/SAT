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
  const [satScore, setSatScore] = useState(200)

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
        if (d.satScore) setSatScore(d.satScore)
      })
  }, [userId, id])

  const saveProgress = async (p) => {
    setProgress(p)
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, courseId: id, progress: p, difficulties }),
    })
  }

  const submitQuiz = async (q) => {
    if (!course) return
    const lesson = course.lessons[lessonIdx]
    const lessonId = lesson.id
    const curDiff = difficulties[lessonId] || 'medium'
    // find the question in the current difficulty set
    const setForDiff = (lesson.quizzes && lesson.quizzes[curDiff]) || []
    const question = setForDiff.find(x => x.id === q.id) || q
    const correct = question.answer
    const correctAnswer = selected === correct
    const points = question.points || 10

    // adjust difficulty
    const order = ['easy', 'medium', 'hard']
    let idx = order.indexOf(curDiff)
    if (correctAnswer && idx < order.length - 1) idx += 1
    if (!correctAnswer && idx > 0) idx -= 1
    const newDiff = order[idx]
    const newDifficulties = { ...difficulties, [lessonId]: newDiff }
    setDifficulties(newDifficulties)

    // calculate SAT score
    const scoreChange = correctAnswer ? points : -Math.floor(points / 2)
    const newSatScore = Math.max(200, Math.min(800, satScore + scoreChange))
    setSatScore(newSatScore)

    // save progress value (example: 100 correct, 50 incorrect)
    const got = correctAnswer ? 100 : 50
    setProgress(got)
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, courseId: id, progress: got, difficulties: newDifficulties, satScore: newSatScore }),
    })

    alert(correctAnswer ? t('correct_msg') : t('incorrect_msg'))
  }

  const { t } = useI18n()

  if (!course) return <div>{t('loading')}</div>

  const lesson = course.lessons[lessonIdx]
  const curDiff = difficulties[lesson.id] || 'medium'
  // select questions for this lesson/difficulty (fallbacks)
  const questions = ((lesson.quizzes && lesson.quizzes[curDiff]) || lesson.quizzes?.medium || lesson.quizzes?.easy || [])

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>{course.title}</h1>
      <div style={{ color: '#555' }}>{course.description}</div>

      <div style={{ marginTop: 20 }}>
        <strong>{t('toc')}</strong>
        <ul>
          {course.lessons.map((l, i) => (
            <li key={l.id} style={{ margin: '6px 0' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); setLessonIdx(i); setSelected(null) }}>{i+1}. {l.title}</a>
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
            {lesson.passages['en'] || lesson.passages['en']}
          </div>
        </div>
      )}

      <h2>{t('quizPrefix')} {lesson.title} ({t(`difficulty_${curDiff}`)})</h2>
      {questions.map(q => (
        <div key={q.id} style={{ marginBottom: 12 }}>
          <p>{typeof q.question === 'object' ? q.question[lang] || q.question['en'] : q.question}</p>
          {Object.entries(typeof q.options === 'object' && q.options[lang] ? q.options[lang] : q.options).map(([k, v]) => (
            <label key={k} style={{ display: 'block' }}>
              <input type="radio" name={q.id} value={k} onChange={e => setSelected(e.target.value)} /> {k}) {v}
            </label>
          ))}
          <button onClick={() => submitQuiz(q)} style={{ marginTop: 8 }}>{t('submit')}</button>
        </div>
      ))}

      <h3 style={{ marginTop: 24 }}>{t('progress')}: {progress}%</h3>
      <h3 style={{ marginTop: 12 }}>{t('sat_score')}: {satScore}</h3>
    </div>
  )
}
