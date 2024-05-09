/**
 * https://github.com/bmcmahen/firestore-pagination-hook/blob/master/src/index.ts
 */

import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'
import { add } from 'date-fns'
import { useEffect, useReducer } from 'react'

type DocumentData = {
  [key: string]: any
}

type StateType = {
  hasMore: boolean
  items: DocumentData[]
  after: FirebaseFirestoreTypes.QueryDocumentSnapshot | null
  lastLoaded: FirebaseFirestoreTypes.QueryDocumentSnapshot | null
  loadingMore: boolean
  limit: number
  loadingMoreError: null | Error
  loading: boolean
  loadingError: null | Error
  updated: number
}

type Action<K, V = void> = V extends void ? { type: K } : { type: K } & V

export type ActionType =
  | Action<'LOAD-MORE'>
  | Action<
      'LOADED',
      {
        value: FirebaseFirestoreTypes.QuerySnapshot
        limit: number
        direction: 'asc' | 'desc'
        sort: string
      }
    >

const initialState = {
  hasMore: false,
  after: null,
  limit: 0,
  items: [],
  lastLoaded: null,
  loading: true,
  loadingError: null,
  loadingMore: false,
  loadingMoreError: null,
  updated: new Date().valueOf(),
}

function reducer(state: StateType, action: ActionType): StateType {
  switch (action.type) {
    case 'LOADED': {
      const items: any[] = []
      action.value.docs.forEach(snap => {
        items.push(snap.data())
      })
      const nextLimit = items.length + action.limit
      const end = items.length < action.limit || nextLimit === state.limit

      return {
        ...state,
        hasMore: !end,
        limit: nextLimit,
        loading: false,
        loadingError: null,
        lastLoaded: action.value.docs[action.value.docs.length - 1],
        loadingMore: false,
        items,
        updated: new Date().valueOf(),
      }
    }

    case 'LOAD-MORE': {
      return {
        ...state,
        loadingMore: true,
        after: state.lastLoaded,
        updated: new Date().valueOf(),
      }
    }
  }
}

interface PaginationOptions {
  // how many documents should we fetch at a time?
  limit?: number
  sort?: string
  direction?: 'asc' | 'desc'
}

export default function useFirestoreThreadSnapshot<T>(
  ref?: FirebaseFirestoreTypes.CollectionReference,
  { limit = 25, direction = 'desc', sort = 'updated' }: PaginationOptions = {},
) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    let unsubscribe = () => {
      // do nothing
    }
    const toDay = new Date()
    const addTime = add(toDay, { hours: 1 })
    const currentDate = firestore.Timestamp.fromDate(addTime)
    if (ref) {
      const fn = ref
        .orderBy(sort, direction)
        .where(sort, '<=', currentDate)
        .limit(state.limit || limit)

      unsubscribe = fn.onSnapshot(
        snap => {
          dispatch({ type: 'LOADED', value: snap, limit, direction, sort })
        },
        error => {
          console.error(error)
        },
      )
    }

    return () => unsubscribe()
  }, [state.after])

  // trigger firebase to load more
  function loadMore() {
    dispatch({ type: 'LOAD-MORE' })
  }

  return {
    data: state.items as T[],
    updated: new Date().valueOf(),
    action: {
      loadMore,
    },
    status: {
      loadingMore: state.loadingMore,
      loadingError: state.loadingError,
      loadingMoreError: state.loadingMoreError,
      loading: state.loading,
      hasMore: state.hasMore,
    },
  }
}
