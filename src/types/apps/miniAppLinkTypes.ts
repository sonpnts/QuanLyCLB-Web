export type MiniAppLinkClassOptionType = {
  classId: string
  classCode: string
  className: string
  branchName: string
  studentCount: number
}

export type MiniAppManagedStudentClassType = {
  classId: string
  classCode: string
  className: string
  branchName: string
}

export type MiniAppLinkedPhoneType = {
  id: string
  phoneNumber: string
  createdAt: string
  updatedAt?: string | null
}

export type MiniAppManagedStudentRowType = {
  studentId: string
  studentCode?: string | null
  studentName: string
  primaryPhoneNumber?: string | null
  classes: MiniAppManagedStudentClassType[]
  linkedPhones: MiniAppLinkedPhoneType[]
}

export type MiniAppManagedStudentPagedType = {
  totalRecords: number
  records: MiniAppManagedStudentRowType[]
}
