import { TithingFundDetail } from '@dts/Giving'
import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { updateGiving } from '@redux/slices/giving'
import { getTithingFundDetail } from '@shared/Firebase/giving'
import { useEffect, useState } from 'react'

const useTithingFundDetailData = ({
  fundId,
}: {
  fundId: string
}): { fund?: TithingFundDetail; loading: boolean } => {
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)

  const fundInfos = useAppSelector((state) => state.giving.fundInfos)

  useEffect(() => {
    const run = async () => {
      if (fundId) {
        try {
          setLoading(true)
          const res = await getTithingFundDetail(fundId)
          if (res) {
            await dispatch(updateGiving({ fundInfos: res.data }))
          }
          setLoading(false)
        } catch (error) {
          setLoading(false)
        }
      }
    }
    run()
  }, [dispatch, fundId])

  return {
    fund: fundInfos,
    loading,
  }
}

export default useTithingFundDetailData
