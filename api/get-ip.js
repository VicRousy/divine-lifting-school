export default function handler(req, res) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown'
  res.setHeader('Cache-Control', 'no-store')
  res.json({ ip })
}
