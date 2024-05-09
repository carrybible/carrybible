import _ from 'lodash'
import { useState, useEffect, useRef } from 'react'
import Database from '@shared/Database'

interface Params {
  table?: string
  filter?: any
  query?: string
}

export default function useSqlite<T>({ table, filter, query }: Params, deps: Array<any> = []): [Array<T>, boolean, any] {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [data, setData] = useState([])
  const tryTime = useRef(0)

  useEffect(() => {
    let sub = true
    tryTime.current = 0
    run(sub)
    return () => {
      sub = false
      tryTime.current = 0
    }
  }, [...deps])

  function run(subscribe: boolean) {
    tryTime.current += 1
    setLoading(true)
    if (query) {
      Database.query(query)
        .then((d: any) => {
          if (d.length === 0) {
            if (tryTime.current < 4)
              Database.reload().then(() => {
                run(subscribe)
              })
          } else if (subscribe) {
            setData(d)
            setLoading(false)
          }
        })
        .catch(e => {
          if (tryTime.current < 4)
            Database.reload().then(() => {
              run(subscribe)
            })
        })
    } else if (table) {
      Database.list(table, filter)
        .then((d: any) => {
          if (subscribe) {
            setData(d)
            setLoading(false)
          }
        })
        .catch(e => {
          setData([])
          setLoading(false)
        })
    }
  }

  return [data, loading, error]
}
