import fs from 'fs'
import path from 'path'

const DATA_PATH = path.join(process.cwd(), 'data', 'progress.json')

function readData() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch (e) {
    return {}
  }
}

function writeData(d) {
  try {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true })
    fs.writeFileSync(DATA_PATH, JSON.stringify(d, null, 2))
  } catch (e) {
    console.error('write error', e)
  }
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    const { userId, courseId } = req.query
    const data = readData()
    const user = data[userId] || {}
    const entry = user[courseId]
    // support legacy numeric progress value
    if (typeof entry === 'number' || !entry) {
      const satScore = entry === 100 ? 400 : 200 // simple mapping for legacy
      return res.status(200).json({ progress: entry || 0, difficulties: {}, satScore })
    }
    const satScore = entry.satScore || 200
    return res.status(200).json({ progress: entry.progress || 0, difficulties: entry.difficulties || {}, satScore })
  }

  if (req.method === 'POST') {
    const { userId, courseId, progress, difficulties, satScore } = req.body
    if (!userId || !courseId) return res.status(400).json({ error: 'missing' })
    const data = readData()
    if (!data[userId]) data[userId] = {}
    const prev = data[userId][courseId]
    if (typeof prev === 'number' || !prev) {
      data[userId][courseId] = { progress: progress || (prev || 0), difficulties: difficulties || {}, satScore: satScore || 200 }
    } else {
      data[userId][courseId] = {
        progress: typeof progress === 'number' ? progress : (prev.progress || 0),
        difficulties: { ...(prev.difficulties || {}), ...(difficulties || {}) },
        satScore: typeof satScore === 'number' ? satScore : (prev.satScore || 200)
      }
    }
    writeData(data)
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
