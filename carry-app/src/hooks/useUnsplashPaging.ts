import { useFocusEffect } from '@react-navigation/native'
import React from 'react'
import { useState, useRef } from 'react'
import { InteractionManager } from 'react-native'
import Unsplash, { UnsplashImage } from '../shared/Unsplash'

function useUnsplashPaging(
  limit = 30,
  key = 'landscape',
): [
  UnsplashImage[],
  () => void,
  (v: boolean) => void,
  (k: string) => void,
  { loading: boolean; ended: boolean; refreshing: boolean; loadingMore: boolean },
] {
  const page = useRef<number>(1)
  const keyword = useRef(key)
  const ended = useRef(false)
  const loadingMore = useRef(false)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<UnsplashImage[]>([])
  const [loading, setLoading] = useState(true)

  function search(isSubscribed = true, prevData: UnsplashImage[] = []) {
    Unsplash.searchImage(keyword.current, page.current, limit).then(unsplashData => {
      if (unsplashData) {
        if (page.current === unsplashData.total_pages) {
          ended.current = true
        }

        if (isSubscribed) {
          setData([...prevData, ...unsplashData.results])
          setRefreshing(false)
          loadingMore.current = false
          setLoading(false)
        }
      }
    })
  }

  useFocusEffect(
    React.useCallback(() => {
      let isSubscribed = true
      const task = InteractionManager.runAfterInteractions(() => {
        page.current = 1
        ended.current = false
        search(isSubscribed)
      })

      return () => {
        isSubscribed = false
        task.cancel()
      }
    }, []),
  )

  // useEffect(() => {
  //   let isSubscribed = true

  //   page.current = 1
  //   ended.current = false
  //   search(isSubscribed)

  //   // eslint-disable-next-line no-return-assign
  //   return () => {
  //     isSubscribed = false
  //   }
  // }, [])

  const loadMore = () => {
    if (!loading && !ended.current && !loadingMore.current) {
      loadingMore.current = true
      page.current += 1
      search(true, data)
    }
  }

  const setKeyword = (k: string) => {
    setData([])
    setLoading(true)
    page.current = 1
    keyword.current = k
    search()
  }

  const refresh = (pullToRefresh = true) => {
    if (pullToRefresh) setRefreshing(true)
    page.current = 1
    ended.current = false
    search(true)
  }

  return [data, loadMore, refresh, setKeyword, { ended: ended.current, refreshing, loading, loadingMore: loadingMore.current }]
}

export default useUnsplashPaging
