import firestore from '@react-native-firebase/firestore'
import { useEffect, useState } from 'react'
import { Utils } from '@shared/index'

function useFirestoreDoc(collection: string, doc?: string, deps = []) {
  if (!doc) return [{}, false]
  const [data, setData] = useState<{ document: any; loading: boolean }>({ document: {}, loading: true })

  useEffect(() => {
    if (doc) {
      firestore()
        .collection(collection)
        .doc(doc)
        .get()
        .then(d => {
          setData({ document: d.data(), loading: false })
        })
        .catch(e => {
          Utils.sendError(e, 'useFirestoreDoc')
          setData({ document: undefined, loading: false })
        })
    }
  }, deps)

  return [data.document, data.loading]
}

export default useFirestoreDoc
