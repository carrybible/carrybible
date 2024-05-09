import { Select, Spin } from 'antd'
import type { SelectProps } from 'antd/es/select'
import React, { useState, FC, useCallback, useEffect, useRef } from 'react'
import { getPlans } from '@shared/Firebase/plan'
import { Plan } from '@dts/Plans'

export interface PlanValue {
  label: string
  value: string
}

export type PlanSelectedValue = {
  planId?: string
}

interface Props extends SelectProps {
  value?: PlanSelectedValue
  onChange?: (value: Plan) => void
  autoClose?: boolean
}

const PlanInput: FC<Props> = (props) => {
  const [searchResult, setSearchResult] = useState<PlanValue[]>([])
  const [loadPlans, setLoadPlans] = useState(false)
  const selectRef = useRef<any>()

  const [plans, setPlans] = useState<Plan[]>()

  useEffect(() => {
    const run = async () => {
      setLoadPlans(true)
      const response = await getPlans({
        search: '',
        tab: 'plans',
      })
      if (response.data) {
        const validPlans = response.data.filter(
          (plan) =>
            plan.name &&
            plan.blocks.every((i) => i.name && i.activities?.length)
        )
        setPlans(validPlans)
      }
      setLoadPlans(false)
    }
    run()
  }, [])

  const fetchPlans = useCallback(
    async (key: string): Promise<PlanValue[]> => {
      if (!key || !plans) {
        setSearchResult([])
        return []
      }

      const seachedPlans =
        plans
          .filter((i) => i.name.toLowerCase().includes(key.toLowerCase()))
          .map((g) => ({
            label: g.name,
            value: g.id,
          })) || []

      setSearchResult(seachedPlans)

      return seachedPlans
    },
    [plans]
  )

  return (
    <div className={props.className}>
      <Spin spinning={loadPlans}>
        <Select
          ref={selectRef}
          showSearch
          labelInValue
          showArrow={false}
          filterOption={false}
          onSearch={fetchPlans}
          notFoundContent={null}
          clearIcon
          {...props}
          options={searchResult}
          onChange={(newValue) => {
            const planOriginals = plans?.filter(
              (item) => item.id === newValue.value
            )
            if (Array.isArray(planOriginals) && planOriginals?.length > 0) {
              props.onChange?.(planOriginals[0])
            }
            if (props.autoClose) selectRef?.current?.blur()
          }}
        />
      </Spin>
    </div>
  )
}

export default PlanInput
