import Constants from './Constants'
import { getWithTimeout } from './Network'

const baseUrl = 'https://api.unsplash.com'
const clientId = Constants.UNSPLASH

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

/**
 * Get image from unsplash
 * @param isCurated
 * @param id
 * @param page
 * @param perPage
 * @param orderBy
 */
export function getUnsplashImage(isCurated, id, page = 1, perPage = 30, orderBy = 'latest') {
  const url = isCurated ? `/collections/curated/${id}/photos` : `/collections/${id}/photos`

  return getWithTimeout(`${baseUrl}${url}?client_id=${clientId}&page=${page}&per_page=${perPage}&order_by=${orderBy}`)
}

export async function searchImage(keyword = '', page = 1, perPage = 30): Promise<UnsplashResult | undefined> {
  return getWithTimeout<UnsplashResult | undefined>(
    `${baseUrl}/search/photos?client_id=${clientId}&page=${page}&per_page=${perPage}&query=${keyword}`,
  )
}

export function getRandomImage(keyword = 'nature'): Promise<UnsplashImage | undefined> {
  return getWithTimeout<UnsplashImage>(`${baseUrl}/photos/random?client_id=${clientId}&query=${keyword}`)
}

export default {
  getUnsplashImage,
  searchImage,
  getRandomImage,
}
