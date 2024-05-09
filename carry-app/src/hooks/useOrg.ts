import Firestore from '@shared/Firestore'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import useLoading from './useLoading'

const useOrg: () => { org: App.Organisation | undefined } = () => {
  const me = useSelector<any, App.User>(s => s.me)
  const [org, setOrg] = useState<App.Organisation>()
  const { showLoading, hideLoading } = useLoading()

  useEffect(() => {
    showLoading()
    const unsubscribe = Firestore.Organisations.ref(me?.organisation?.id || '').onSnapshot(snap => {
      if (snap && snap.exists) {
        devLog('[User belong to Org]', snap.data())
        setOrg(snap.data() as App.Organisation)
      }
      hideLoading()
    })
    return () => {
      unsubscribe()
    }
  }, [me?.organisation?.id])

  return { org }
}

export default useOrg
