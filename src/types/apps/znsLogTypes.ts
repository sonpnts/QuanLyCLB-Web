export type ZnsLogType = {
  id: string
  notificationType: string
  studentId?: string | null
  studentName?: string | null
  paymentRecordId?: string | null
  receiptNumber?: string | null
  studentPhoneNumber?: string | null
  userIdZalo?: string | null
  endpointUrl?: string | null
  templateId: string
  errorCode: number
  errorMessage?: string | null
  isSuccess: boolean
  messageId?: string | null
  sentAt: string
  responseJson?: string | null
  templateDataJson: string
  createdAt: string
  canRetry: boolean
}

export type ZnsLogPagedResultType = {
  items: ZnsLogType[]
  totalCount: number
  pageNumber: number
  pageSize: number
}
