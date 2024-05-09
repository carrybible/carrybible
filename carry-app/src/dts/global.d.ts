export {}

declare global {
  const devLog: (...props: any) => void
  const devWarn: (...props: any) => void
  let toast: {
    success: (text: string) => void
    error: (text: string) => void
    info: (text: string) => void
  }

  namespace NodeJS {
    interface Global {
      devLog: (...props: any) => void
      devWarn: (...props: any) => void
      toast: {
        success: (text: string) => void
        error: (text: string) => void
        info: (text: string) => void
      }
    }
  }
}
