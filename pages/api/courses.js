import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'data', 'courses.json')

export default function handler(req, res) {
    try {
        const raw = fs.readFileSync(FILE, 'utf-8');
        const data = JSON.parse(raw);
        const courses = data.courses || [];
        res.status(200).json({ courses });
    } catch (e) {
        // 에러가 발생했을 때 프로그램이 멈추지 않게 처리합니다.
        res.status(500).json({ error: 'failed to load data' });
    }
}