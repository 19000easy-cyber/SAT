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
    <div style={{ padding: '40px 20px', minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '40px', borderRadius: '8px', marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '12px' }}>📚 {t('title')}</h1>
          <p style={{ fontSize: '18px', opacity: 0.95 }}>{t('desc')}</p>
        </div>

        <div>
          <h2 style={{ fontSize: '28px', marginBottom: '24px', color: '#333' }}>🎯 {t('courses')}</h2>
          <div style={{ display: 'grid', gap: '16px' }}>
            {courses.map(c => (
              <Link key={c.id} href={`/course/${c.id}`}>
                <div style={{ padding: '20px', background: 'white', border: '2px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}>
                  <h3 style={{ fontSize: '20px', color: '#4a90e2', marginBottom: '8px', margin: 0 }}>{c.title}</h3>
                  <p style={{ color: '#666', margin: 0 }}>{c.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
