export type ZaloLinkClassStatsType = {
  classId: string
  classCode: string
  className: string
  branchName: string
  totalStudents: number
  linkedStudents: number
  unlinkedStudents: number
  linkedRate: number
}

export type ZaloLinkOverviewType = {
  totalStudents: number
  linkedStudents: number
  unlinkedStudents: number
  linkedRate: number
  classes: ZaloLinkClassStatsType[]
}

export type ZaloUnlinkedStudentRowType = {
  studentId: string
  studentCode: string
  studentName: string
  phoneNumber: string
  classId: string
  classCode: string
  className: string
}

export type ZaloLinkLookupResultType = {
  studentId: string
  studentCode: string
  studentName: string
  phoneNumber: string
  userIdZalo?: string | null
  isActive: boolean
  isSuspended: boolean
  classes: {
    classId: string
    classCode: string
    className: string
    branchName: string
    isActiveEnrollment: boolean
  }[]
}

export type ZaloLinkCoachClassStatsType = {
  classId: string
  classCode: string
  className: string
  branchName: string
  totalStudents: number
  linkedStudents: number
  unlinkedStudents: number
  linkedRate: number
}

export type ZaloLinkCoachOverviewType = {
  totalStudents: number
  linkedStudents: number
  unlinkedStudents: number
  linkedRate: number
  classes: ZaloLinkCoachClassStatsType[]
}

export type ZaloLinkCoachStudentRowType = {
  studentId: string
  studentCode: string
  studentName: string
  phoneNumber: string
  userIdZalo?: string | null
  classId: string
  classCode: string
  className: string
  branchName: string
}
