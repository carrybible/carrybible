import { getWithTimeout } from './Network'

const baseUrl = 'https://api.unsplash.com'
const clientId = '' // TODO: move to env config

export type UnsplashImage = {
  id?: string | number
  urls: {
    thumb?: string
    full?: string
    regular: string
  }
  source?: 'gallery'
}

export type UnsplashResult = {
  results: Array<UnsplashImage>
  total_pages: number
  total: number
}

export function getRandomImage(
  keyword = 'nature'
): Promise<UnsplashImage | undefined> {
  return getWithTimeout<UnsplashImage>(
    `${baseUrl}/photos/random?client_id=${clientId}&query=${keyword}`
  )
}
