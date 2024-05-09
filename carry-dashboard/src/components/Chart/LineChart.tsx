import { H4 } from '@components/Typography'
import classNames from 'classnames'
import React, { useMemo } from 'react'
import { format, parse } from 'date-fns'

import {
  CartesianGrid,
  Line,
  LineChart as RechartLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Props = {
  className?: string
  title: string
  data?: { [day: string]: number }
}

const LineChart: React.FC<Props> = (props) => {
  const chartData = useMemo(() => {
    const sortedData = Object.keys(props?.data ?? {}).sort()

    return sortedData.map((day) => {
      const date = parse(day, 'yyyy-MM-dd', new Date())
      const formatDay = `${format(date, 'MMM')} ${format(date, 'd')}`
      return {
        name: formatDay,
        Members: props.data?.[day],
      }
    })
  }, [props.data])
  return (
    <div
      className={classNames(
        'flex flex-col rounded-2xl bg-neutral-10 px-6 py-6',
        'border-2 border-solid border-neutral-50',
        props.className
      )}
    >
      <H4 className="!mb-6">{props.title}</H4>
      <ResponsiveContainer>
        <RechartLineChart data={chartData}>
          <CartesianGrid vertical={false} x={80} />
          <XAxis
            dataKey="name"
            padding={{ left: 40, right: 40 }}
            stroke="#828282"
            className="text-warning"
            axisLine={false}
            tickLine={false}
          />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />

          <Line
            type="linear"
            dataKey="Members"
            stroke="#696FFF"
            strokeWidth={5}
            dot={false}
          />
        </RechartLineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default LineChart
