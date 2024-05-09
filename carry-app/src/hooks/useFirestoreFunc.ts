import functions from '@react-native-firebase/functions'
import { useEffect, useState } from 'react'
import { Utils } from '../shared'

function useFirestoreFunc<T>(functionName: string, data: any): { data: T | undefined; loading: boolean; success: boolean } {
  const [res, setRes] = useState({ data: undefined, loading: true, success: false })

  useEffect(() => {
    if (functionName) {
      functions()
        .httpsCallable(functionName)(data)
        .then(r => {
          if (r.data.success) setRes({ data: r.data.response, loading: false, success: r.data.success })
          else {
            setRes({ data: r.data.response, loading: false, success: r.data.success })
          }
        })
        .catch(e => {
          Utils.sendError(e, 'useFirestoreFunc')
          setRes({ data: undefined, loading: false, success: false })
        })
    } else {
      setRes({ data: undefined, loading: false, success: false })
    }
  }, [])

  return res
}

export default useFirestoreFunc
