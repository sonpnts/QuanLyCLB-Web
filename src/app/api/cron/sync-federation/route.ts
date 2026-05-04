/**
 * Vercel Cron Job – Đồng bộ danh sách hội viên liên đoàn
 *
 * Route: GET /api/cron/sync-federation
 * Vercel gọi route này theo lịch định nghĩa trong vercel.json.
 *
 * Bảo mật:
 *  - Vercel tự động gắn header `Authorization: Bearer <CRON_SECRET>` khi gọi cron.
 *  - Route kiểm tra header này để từ chối mọi request không hợp lệ từ bên ngoài.
 *
 * Env vars cần thiết:
 *  - CRON_SECRET          : chuỗi bí mật dùng để xác thực request từ Vercel cron
 *  - API_URL              : base URL backend (vd: https://api.truongson.id.vn)
 *  - FEDERATION_SYNC_KEY  : API key truyền vào ?key= khi gọi endpoint sync backend
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  // ── 1. Xác thực request từ Vercel Cron ──────────────────────────────────────
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[cron/sync-federation] CRON_SECRET chưa được cấu hình')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[cron/sync-federation] Unauthorized request – sai hoặc thiếu Authorization header')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Gọi backend sync API ──────────────────────────────────────────────────
  const apiUrl = process.env.API_URL
  const syncKey = process.env.FEDERATION_SYNC_KEY

  if (!apiUrl) {
    console.error('[cron/sync-federation] API_URL chưa được cấu hình')
    return NextResponse.json({ error: 'Server misconfigured: API_URL missing' }, { status: 500 })
  }

  if (!syncKey) {
    console.error('[cron/sync-federation] FEDERATION_SYNC_KEY chưa được cấu hình')
    return NextResponse.json({ error: 'Server misconfigured: FEDERATION_SYNC_KEY missing' }, { status: 500 })
  }

  const targetUrl = `${apiUrl}/api/FederationMembers/sync?key=${encodeURIComponent(syncKey)}`

  console.log(`[cron/sync-federation] Bắt đầu sync – ${new Date().toISOString()}`)
  console.log(`[cron/sync-federation] Gọi: ${apiUrl}/api/FederationMembers/sync?key=***`)

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const text = await response.text()
    let data: unknown

    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }

    if (!response.ok) {
      console.error(`[cron/sync-federation] Backend trả về lỗi ${response.status}:`, data)
      return NextResponse.json(
        {
          success: false,
          status: response.status,
          message: 'Backend sync thất bại',
          detail: data
        },
        { status: response.status }
      )
    }

    console.log(`[cron/sync-federation] Sync thành công – status ${response.status}`)

    return NextResponse.json({
      success: true,
      syncedAt: new Date().toISOString(),
      backendStatus: response.status,
      data
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định'

    console.error('[cron/sync-federation] Lỗi khi gọi backend:', message)

    return NextResponse.json(
      {
        success: false,
        message,
        syncedAt: new Date().toISOString()
      },
      { status: 502 }
    )
  }
}
