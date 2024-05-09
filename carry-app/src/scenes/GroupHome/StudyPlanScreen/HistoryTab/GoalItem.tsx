import React from 'react'
import { StyleSheet, View, TouchableOpacity } from 'react-native'
import { CircularProgress } from '@components/AnimatedCircularProgress'
import useTheme from '@hooks/useTheme'
import { Metrics, Styles } from '@shared/index'
import { H3, Footnote } from '@components/Typography'
import LottieView from 'lottie-react-native'
import I18n from 'i18n-js'

type IProps = {
  name: string
  time: string
  startDate?: number
  endDate?: number
  status: 'normal' | 'ongoing' | 'future' | 'ended' | 'unknown'
  completed: boolean
  process: any
  onPress: () => void
}

const GoalStatus = ({ status, color, startDate, endDate, completed }) => {
  let statusConfig = { text: { color: color.gray }, color: color.lavender, title: '' }
  const currentTime = new Date().getTime()
  let handleStatus = status
  if (status === 'normal') {
    if (currentTime < startDate) {
      handleStatus = 'future'
    } else if (currentTime > endDate) {
      handleStatus = 'ended'
    } else {
      handleStatus = 'ongoing'
    }
  }

  switch (handleStatus) {
    case 'normal':
      break
    case 'future':
      statusConfig = {
        text: { color: color.gray },
        color: `${color.gray4}33`,
        title: I18n.t('text.Upcoming'),
      }

      break
    case 'ongoing':
      statusConfig = {
        text: { color: color.white },
        color: color.accent2,
        title: I18n.t('text.Active'),
      }
      break
    case 'complete':
      break
    case 'ended':
      statusConfig = {
        text: { color: color.gray },
        color: `${color.gray4}33`,
        title: I18n.t('text.Ended'),
      }
      break
    default:
      return null
  }
  return (
    <View style={[s.status, { backgroundColor: statusConfig.color }]}>
      <Footnote style={statusConfig.text}>{statusConfig.title}</Footnote>
    </View>
  )
}

const GoalItem = (props: IProps) => {
  const { color } = useTheme()

  return (
    <TouchableOpacity style={[s.container, { backgroundColor: color.middle }]} onPress={props.onPress}>
      <View style={s.flex}>
        <GoalStatus status={props.status} color={color} completed={props.completed} startDate={props.startDate} endDate={props.endDate} />
        <H3 style={s.name}>{props.name}</H3>
        <Footnote color="gray">{props.time}</Footnote>
      </View>
      {props.process >= 100 ? (
        <View style={s.lottie}>
          <LottieView
            // ref={lottie}
            autoPlay
            source={require('@assets/animations/lf30_editor_jl64r6mk.json')}
            loop={false}
            speed={1}
          />
        </View>
      ) : (
        <CircularProgress
          //@ts-ignore
          size={55}
          width={4}
          fill={props.process || 0}
          tintColor={props.status === 'ended' && props.process < 100 ? color.gray : color.accent2}
          backgroundColor={color.gray7}
          lineCap="round">
          {fill => {
            return <Footnote bold>{`${Math.round(fill) || 0}%`}</Footnote>
          }}
        </CircularProgress>
      )}
    </TouchableOpacity>
  )
}

GoalItem.defaultProps = {}

const s = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Metrics.insets.horizontal,
    paddingHorizontal: Metrics.insets.horizontal,
    paddingVertical: Metrics.insets.horizontal,
    ...Styles.shadow,
    minHeight: 98,
    marginBottom: 12,
  },
  lottie: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    marginTop: 5,
    marginBottom: 2,
  },
  status: {
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    flex: 0,
    alignSelf: 'flex-start',
  },
})

export default React.memo(
  GoalItem,
  (p, n) => p.process === n.process && p.completed === n.completed && p.status === n.status && p.time === n.time && p.name === n.name,
)
