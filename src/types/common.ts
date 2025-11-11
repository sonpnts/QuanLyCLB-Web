export interface ResponseResult<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}
