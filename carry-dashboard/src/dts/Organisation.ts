export type Organisation = {
  id: string
  image: string
  name: string
  billing?: {
    enabled: boolean
    url: string
  }
  giving?: {
    allowSetup?: boolean
    isConnected?: boolean
  }
  settings?: {
    showUsers?: boolean
    showCampuses?: boolean
  }
  enableGeneratePlanFromSermon?: boolean
}
