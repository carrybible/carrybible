import { CameraRoll } from '@react-native-camera-roll/camera-roll'
import { useFocusEffect } from '@react-navigation/native'
import I18n from 'i18n-js'
import React, { useRef, useState } from 'react'
import { InteractionManager, PermissionsAndroid, Platform } from 'react-native'
import { UnsplashImage } from '../shared/Unsplash'

const checkPermission = async () => {
  if (Platform.OS !== 'android') {
    return true
  }

  const hasPermission = await PermissionsAndroid.check(
    Platform.Version >= 33 ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
  )

  if (hasPermission) {
    return true
  }

  const status = await PermissionsAndroid.request(
    Platform.Version >= 33 ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
  )
  return status === 'granted'
}

function useCameraRollPaging(
  limit = 30,
): [UnsplashImage[], () => void, (v: boolean) => void, { loading: boolean; ended: boolean; refreshing: boolean; loadingMore: boolean }] {
  const [data, setData] = useState<UnsplashImage[]>([])
  const cursor = useRef<string | undefined>(undefined)
  const ended = useRef(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(true)
  const loadingMore = useRef(false)

  async function getPhotos(isSubscribed = true, prevData: UnsplashImage[] = []) {
    if (!isSubscribed) return

    if (!(await checkPermission())) {
      toast.error(I18n.t('error.Do not have permission'))
    }

    // Camera Roll params

    const images = await CameraRoll.getPhotos({
      first: limit,
      after: cursor.current,
      assetType: 'Photos',
      groupTypes: 'All',
    })

    const listImage = images.edges
    const listImageFormat: UnsplashImage[] = []
    listImage.forEach((item, index) => {
      const image: UnsplashImage = {
        urls: {
          thumb: item.node.image.uri,
          full: item.node.image.uri,
          regular: item.node.image.uri,
        },
        id: index,
        source: 'gallery',
      }
      listImageFormat.push(image)
    })

    if (isSubscribed) {
      setLoading(false)
      setRefreshing(false)
      loadingMore.current = false

      cursor.current = images.page_info.end_cursor
      ended.current = !images.page_info.has_next_page
      setData([...prevData, ...listImageFormat])
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      let isSubscribed = true
      const task = InteractionManager.runAfterInteractions(() => {
        cursor.current = undefined
        ended.current = false
        getPhotos(isSubscribed)
      })

      return () => {
        isSubscribed = false
        task.cancel()
      }
    }, []),
  )

  function loadMore() {
    if (!loading && !ended.current && !loadingMore.current) {
      loadingMore.current = true
      getPhotos(true, data)
    }
  }

  function refresh(pullToRefresh = true) {
    if (pullToRefresh) setRefreshing(true)
    cursor.current = undefined
    ended.current = false
    getPhotos(true)
  }

  return [data, loadMore, refresh, { ended: ended.current, refreshing, loading, loadingMore: loadingMore.current }]
}

export default useCameraRollPaging
