import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'data', 'courses.json')

export default function handler(req, res) {
  try {
    const raw = fs.readFileSync(FILE, 'utf-8')
    const json = JSON.parse(raw)
    const list = (json.courses || []).map(c => ({ id: c.id, title: c.title, description: c.description }))
    res.status(200).json({ courses: list })
  } catch (e) {
    res.status(500).json({ error: 'failed' })
  }
}
