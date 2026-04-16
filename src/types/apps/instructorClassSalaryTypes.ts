export type SalaryTypeOption = 'PerHour' | 'PerSession'

export const SalaryTypeLabel: Record<SalaryTypeOption, string> = {
  PerHour: 'Theo giờ',
  PerSession: 'Theo buổi',
}

export type InstructorClassSalaryType = {
  id: string
  userId: string
  userName?: string
  classId: string
  className?: string
  role: string
  salaryType: SalaryTypeOption
  rate: number
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export type CreateInstructorClassSalaryRequest = {
  userId: string
  classId: string
  role: string
  salaryType: SalaryTypeOption
  rate: number
  notes?: string
}

export type UpdateInstructorClassSalaryRequest = {
  role: string
  salaryType: SalaryTypeOption
  rate: number
  notes?: string
  isActive: boolean
}
