export type CronJobLogType = {
  id: string
  jobKey: string
  scheduledAtLocal: string
  forMonth?: number | null
  forYear?: number | null
  startedAt: string
  finishedAt?: string | null
  status: string
  attemptCount: number
  totalCandidates: number
  totalSent: number
  totalSkippedAlreadySent: number
  totalFailed: number
  errorMessage?: string | null
  createdAt: string
  updatedAt?: string | null
}
