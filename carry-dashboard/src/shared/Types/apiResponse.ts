export type ResponseType<T> = {
  success: boolean
  data: T
  message?: string
}
