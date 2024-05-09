import Database from '@shared/Database'
import { useState } from 'react'

const useQuery = () => {
  const [loading, setLoading] = useState(true)

  const runQuery = async query => {
    setLoading(true)
    try {
      return Database.query(query)
    } catch (e: any) {
      devWarn('query data fail in query', e.message)
      setLoading(false)
      return []
    }
  }

  const reloadDatabase = () => {
    return Database.reload()
  }

  return { runQuery, loading, reloadDatabase }
}

export default useQuery
