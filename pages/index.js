import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useI18n } from '../lib/i18n'

export default function Home() {
  const [courses, setCourses] = useState([])

  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.json())
      .then(d => setCourses(d.courses || []))
  }, [])

  const { t } = useI18n()

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>{t('title')}</h1>
      <p>{t('desc')}</p>

      <h2>{t('courses')}</h2>
      <ul>
        {courses.map(c => (
          <li key={c.id} style={{ margin: '12px 0' }}>
            <Link href={`/course/${c.id}`} style={{ fontSize: 18 }}>
              {c.title}
            </Link>
            <div style={{ color: '#555' }}>{c.description}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
