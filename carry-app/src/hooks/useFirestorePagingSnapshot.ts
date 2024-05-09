/**
 * https://github.com/bmcmahen/firestore-pagination-hook/blob/master/src/index.ts
 */

import { useReducer, useEffect, useCallback } from 'react'
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'
import { useFocusEffect } from '@react-navigation/native'
import { InteractionManager } from 'react-native'

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
      const items = [...state.items]
      let isAdding = false

      action.value.docChanges().forEach(change => {
        if (change.type === 'added') {
          isAdding = true
          addItem(change.doc, items, action.direction)
        } else if (change.type === 'modified') {
          updateItem(change.doc, items)
        } else if (change.type === 'removed') {
          deleteItem(change.doc, items)
        }
      })

      const nextLimit = items.length + action.limit

      const end = items.length < action.limit || nextLimit === state.limit
      const sortedItems = items.sort((a, b) => {
        if (action.sort === 'updated' || action.sort === 'created') {
          if (!a[action.sort] || !b[action.sort]) return 1000
          return action.direction === 'desc'
            ? b[action.sort]._seconds - a[action.sort]._seconds
            : a[action.sort]._seconds - b[action.sort]._seconds
        }
        return action.direction === 'desc' ? b[action.sort] - a[action.sort] : a[action.sort] - b[action.sort]
      })

      return {
        ...state,
        hasMore: isAdding ? !end : state.hasMore,
        limit: nextLimit,
        loading: false,
        loadingError: null,
        lastLoaded: action.value.docs[action.value.docs.length - 1],
        loadingMore: false,
        items: [...sortedItems],
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

function findIndexOfDocument(doc: FirebaseFirestoreTypes.QueryDocumentSnapshot, items: DocumentData[]) {
  return items.findIndex(item => {
    return item.id === doc.id
  })
}

function updateItem(doc: FirebaseFirestoreTypes.QueryDocumentSnapshot, items: DocumentData[]) {
  const i = findIndexOfDocument(doc, items)
  items[i] = doc.data()
}

function deleteItem(doc: FirebaseFirestoreTypes.QueryDocumentSnapshot, items: DocumentData[]) {
  const i = findIndexOfDocument(doc, items)
  items.splice(i, 1)
}

function addItem(doc: FirebaseFirestoreTypes.QueryDocumentSnapshot, items: DocumentData[], direction: 'asc' | 'desc' = 'asc') {
  const i = findIndexOfDocument(doc, items)
  if (i === -1) {
    items.push(doc.data())
  }
}

interface PaginationOptions {
  // how many documents should we fetch at a time?
  limit?: number
  sort?: string
  direction?: 'asc' | 'desc'
}

export default function useFirestorePagingSnapshot(
  ref?: FirebaseFirestoreTypes.CollectionReference,
  { limit = 25, direction = 'desc', sort = 'updated' }: PaginationOptions = {},
) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // useFocusEffect(
  //   useCallback(() => {
  //     let isSubscribed = true
  //     let unsubscribe = () => {}

  //     const task = InteractionManager.runAfterInteractions(() => {
  //       if (ref) {
  //         const fn = ref.orderBy(sort, direction).limit(state.limit || limit)

  //         unsubscribe = fn.onSnapshot(snap => {
  //           dispatch({ type: 'LOADED', value: snap, limit, direction, sort })
  //         })
  //       }
  //     })

  //     return () => {
  //       unsubscribe()
  //       task.cancel()
  //     }
  //   }, [state.after]),
  // )
  // when "after" changes, we update our query
  useEffect(() => {
    let unsubscribe = () => {}

    if (ref) {
      const fn = ref.orderBy(sort, direction).limit(state.limit || limit)

      unsubscribe = fn.onSnapshot(snap => {
        dispatch({ type: 'LOADED', value: snap, limit, direction, sort })
      })
    }

    return () => unsubscribe()
  }, [state.after])

  // trigger firebase to load more
  function loadMore() {
    dispatch({ type: 'LOAD-MORE' })
  }

  return {
    data: state.items,
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
