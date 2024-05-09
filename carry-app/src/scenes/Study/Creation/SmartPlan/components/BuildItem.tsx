import { Text } from '@components/Typography'
import useFadeInUp from '@hooks/animations/useFadeInUp'
import useFadeIn from '@hooks/animations/useFadeIn'
import useTheme from '@hooks/useTheme'
import { delay } from '@shared/Utils'
import * as React from 'react'
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native'

const BuildItem: React.FC<{
  title: string
  icon: string
  desc: string
  runningText: string
  showVerticalLine?: boolean
  style?: StyleProp<ViewStyle>
  manualRun?: boolean
  canEnd?: boolean
}> = props => {
  const { title, icon, desc, showVerticalLine, style, runningText, manualRun, canEnd } = props
  const { color } = useTheme()
  const [getting, setGetting] = React.useState(true)
  const [opacityRunningText, translateYRunningText, runStartAnim, runEndAnim] = useFadeInUp(1000, 200, 1200, !manualRun)
  const [opacityItem, translateYItem, runStartAnimItem] = useFadeInUp(1000, 2000, 0, !manualRun)
  const [opacityVerticalLine, runAnim] = useFadeIn(300, 3000, !manualRun)
  React.useEffect(() => {
    init()
  }, [])

  const init = async () => {
    if (!manualRun) {
      await delay(2000)
      setGetting(false)
    } else {
      runStartAnim()
    }
  }

  React.useEffect(() => {
    const continueAnim = async () => {
      await delay(500)
      runEndAnim()
      await delay(1000)
      setGetting(false)
      runStartAnimItem()
      runAnim()
    }
    if (canEnd) {
      continueAnim()
    }
  }, [canEnd])

  return (
    <>
      {getting ? (
        <Animated.View style={{ opacity: opacityRunningText, transform: [{ translateY: translateYRunningText }] }}>
          <Text style={showVerticalLine ? s.top60 : s.top40}>{runningText}</Text>
        </Animated.View>
      ) : null}
      <View style={[s.buildItemContainer, style]}>
        {showVerticalLine ? (
          <Animated.View style={[s.verticalLine, { backgroundColor: color.gray6, opacity: opacityVerticalLine }]} />
        ) : null}
        <Animated.View style={{ opacity: opacityItem, transform: [{ translateY: translateYItem }] }}>
          <View style={s.row}>
            <View style={[s.column, s.icon2]}>
              <Text style={s.icon}>{icon}</Text>
            </View>
            <View style={s.column}>
              <Text bold>{title}</Text>
              <Text>{desc}</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </>
  )
}

const s = StyleSheet.create({
  buildItemContainer: {
    flexDirection: 'column',
    // width: '70%',
    marginTop: 20,
  },
  row: {
    flexDirection: 'column',
  },
  column: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  verticalLine: {
    width: 1,
    height: 21,
    marginBottom: 21,
    alignSelf: 'center',
  },
  icon: {
    fontSize: 30,
  },
  icon2: { alignItems: 'center' },
  top60: { marginTop: 60 },
  top40: { marginTop: 40 },
})

export default BuildItem
