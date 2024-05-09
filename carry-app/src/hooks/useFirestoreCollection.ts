import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Utils } from '@shared/index'
import { useFocusEffect } from '@react-navigation/native'
import { InteractionManager } from 'react-native'

type Params = {
  collection?: string
  ref?: FirebaseFirestoreTypes.CollectionReference | FirebaseFirestoreTypes.Query
  orderBy?: string
  direction?: 'asc' | 'desc'
  where?: string
  limit?: number
  condition?: any
  isSync?: boolean | undefined
}

type Result<T> = { data: (T & { id: string })[]; loading: boolean; unsubscribe: any; updated: number }

function useFirestoreCollection<T>(params: Params, deps: any[] = []): Result<T> {
  const [data, setData] = useState<{ list: Array<T & { id: string }>; loading: boolean; updated: number }>({
    list: [],
    loading: true,
    updated: new Date().valueOf(),
  })
  let unsubscribe = useRef<any>().current

  function updateState(snap) {
    if (snap) {
      const list = snap.docs?.map(value => ({ ...value.data(), id: value.id } as T & { id: string })) || []
      setData({ list, loading: false, updated: new Date().valueOf() })
    }
  }

  function handleErr(e) {
    Utils.sendError(e, 'useFirestoreCollection')
    setData({ list: [], loading: false, updated: new Date().valueOf() })
  }

  useEffect(() => {
    let mounted = true
    const task = InteractionManager.runAfterInteractions(() => {
      if (params.isSync && params.ref) {
        unsubscribe = params.ref.orderBy(params.orderBy || 'created', params.direction || 'desc').onSnapshot(d => {
          if (mounted) updateState(d)
        })
      } else {
        if (params.collection) {
          let ref = firestore()
            .collection(params.collection)
            .orderBy(params.orderBy || 'created', params.direction || 'desc')
          if (params.limit) ref = ref.limit(params.limit)
          ref
            .get()
            .then(d => {
              if (mounted) updateState(d)
            })
            .catch(handleErr)
        }
        if (params.ref && params.where) {
          params.ref
            .where(params.where, '==', params.condition)
            .orderBy(params.orderBy || 'created', params.direction || 'desc')
            .get()
            .then(d => {
              if (mounted) updateState(d)
            })
            .catch(handleErr)
        } else if (params.ref) {
          params.ref
            .orderBy(params.orderBy || 'created', params.direction || 'desc')
            .get()
            .then(d => {
              if (mounted) updateState(d)
            })
            .catch(handleErr)
        }
      }
    })
    return () => {
      mounted = false
      if (typeof unsubscribe === 'function') unsubscribe()
      task.cancel()
    }
  }, deps)

  return { data: data.list, loading: data.loading, unsubscribe, updated: data.updated }
}

export default useFirestoreCollection
