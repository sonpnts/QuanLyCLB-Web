import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface LogPayload {
  level?: string
  className?: string
  method?: string
  message: string
  stack?: string
}

function padZero(n: number) {
  return n.toString().padStart(2, '0')
}

function getLogFilePath(): string {
  const now = new Date()
  const dd = padZero(now.getDate())
  const mm = padZero(now.getMonth() + 1)
  const yyyy = now.getFullYear()
  const fileName = `${dd}${mm}${yyyy}.txt`
  const logsDir = path.join(process.cwd(), 'logs')

  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
  }

  return path.join(logsDir, fileName)
}

function formatTimestamp(): string {
  const now = new Date()
  const dd = padZero(now.getDate())
  const mm = padZero(now.getMonth() + 1)
  const yyyy = now.getFullYear()
  const hh = padZero(now.getHours())
  const min = padZero(now.getMinutes())
  const ss = padZero(now.getSeconds())

  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`
}

export async function POST(req: Request) {
  try {
    const body: LogPayload = await req.json()
    const { level = 'ERROR', className = '', method = '', message = '', stack = '' } = body

    const timestamp = formatTimestamp()
    const content =
      `==${timestamp}==\n` +
      `- Level: ${level}\n` +
      `- ClassName: ${className}\n` +
      `- Method: ${method}\n` +
      `- Message: ${message}\n` +
      (stack ? `- StackTrace: ${stack}\n` : '') +
      `==END==\n\n`

    const filePath = getLogFilePath()
    fs.appendFileSync(filePath, content, 'utf8')

    return NextResponse.json({ ok: true })
  } catch {
    // Silently fail — logging must never break the app
    return NextResponse.json({ ok: false })
  }
}
