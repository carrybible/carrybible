import Avatar from '@components/Avatar'
import { H2, Text } from '@components/Typography'
import { RootState } from '@dts/state'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'
import { Config, Constants, Metrics } from '@shared/index'
import I18n from 'i18n-js'
import React from 'react'
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useSelector } from 'react-redux'

type GProps = {
  disabled?: boolean
  children: any
  borderRadius: number
  style?: StyleProp<ViewStyle>
  inActive?: boolean
  customColor?: string
}

export const GradientCover: React.FC<GProps> = props => {
  const { color } = useTheme()
  const { customColor } = props
  return props.disabled ? (
    <View style={[styles.gardiantContainer, { borderRadius: props.borderRadius }]}>{props.children}</View>
  ) : (
    <LinearGradient
      style={[styles.gardiantContainer, { borderRadius: props.borderRadius }, props.style]}
      colors={
        Config.VARIANT !== 'carry'
          ? [customColor ? customColor : color.accent2, customColor ? customColor : color.accent2]
          : ['#FF88C1', '#8AB9FF']
      }
      start={{ x: -0.5, y: -0.5 }}
      end={{ x: 0.5, y: 0.5 }}
      locations={[0, 1]}
      useAngle={true}
      angle={226.05}
      angleCenter={{ x: 0.5, y: 0.5 }}>
      <View
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: props.inActive ? 'rgba(0,0,0,0.25)' : 'transparent',
        }}>
        {props.children}
      </View>
    </LinearGradient>
  )
}

type IProps = {
  onPress?: () => void
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

const ConnectionView: React.FC<IProps> = props => {
  const { color: theme } = useTheme()
  const group = useSelector<RootState, RootState['group']>(state => state.group)

  const borderRadius = 15

  return (
    <View style={styles.container}>
      <GradientCover borderRadius={borderRadius} disabled>
        <View
          style={[
            styles.button__container,
            {
              backgroundColor: theme.background,
              borderRadius: borderRadius - 3,
            },
            props.disabled ? styles.margin0 : styles.margin3,
          ]}>
          <View style={styles.content}>
            {group?.org?.image ? (
              <Avatar url={group?.org?.image} size={36} name={group?.org?.name} loading={false} borderWidth={3} borderColor={theme.gray7} />
            ) : (
              <Text style={styles.defaultIcon}>{'📱'}</Text>
            )}
            <H2 style={styles.name}>
              <H2 color="accent" style={styles.nameHighlight}>
                {group?.org?.name}
              </H2>
              {` ${I18n.t('text.wants to stay connected lets make sure your contact info is up to date')}`}
            </H2>
          </View>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.accent }]}
            onPress={() => {
              NavigationRoot.navigate(Constants.SCENES.COMMON.CONNECT_WITH_ORG)
            }}>
            <View style={styles.btnContent}>
              <H2 color={'white'} style={styles.btnText}>
                {I18n.t('text.Update contact info')}
              </H2>
            </View>
          </TouchableOpacity>
        </View>
      </GradientCover>
    </View>
  )
}

ConnectionView.defaultProps = {
  disabled: false,
  style: {},
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Metrics.insets.horizontal,
    marginTop: 15,
    marginBottom: 15,
  },
  button__container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Metrics.insets.horizontal,
  },
  gardiantContainer: {
    backgroundColor: '#CDCDCD',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  margin0: { margin: 0 },
  margin3: { margin: 3 },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 13,
    paddingBottom: 13,
    marginBottom: 50,
  },
  defaultIcon: { fontSize: 31 },
  name: { marginTop: 5, textAlign: 'center', fontWeight: '500' },
  nameHighlight: { textAlign: 'center', fontWeight: '500' },
  btn: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 53,
    position: 'absolute',
    bottom: -3,
    left: -3,
    right: -3,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  btnContent: { justifyContent: 'center', alignItems: 'center' },
  btnText: { fontWeight: '600' },
})

export default ConnectionView
