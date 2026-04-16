import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'data', 'courses.json')

export default function handler(req, res) {
  const { id } = req.query
  try {
    const raw = fs.readFileSync(FILE, 'utf-8')
    const json = JSON.parse(raw)
    const course = (json.courses || []).find(c => c.id === id)
    if (!course) return res.status(404).json({ error: 'not found' })
    res.status(200).json(course)
  } catch (e) {
    res.status(500).json({ error: 'failed' })
  }
}
