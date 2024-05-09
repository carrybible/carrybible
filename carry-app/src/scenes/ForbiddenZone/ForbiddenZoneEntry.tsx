import { RootState } from '@dts/state'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'
import Constants from '@shared/Constants'
import Metrics from '@shared/Metrics'
import React, { useState } from 'react'
import { Alert, Image, StyleSheet, TouchableOpacity } from 'react-native'
import { useSelector } from 'react-redux'

const ForbiddenZoneEntry = () => {
  const [show, setShow] = useState(true)
  const { color } = useTheme()

  const { currentScreen } = useSelector<RootState, RootState['screen']>(state => state.screen)

  if (!show || currentScreen?.includes('ForbiddenZone')) {
    return null
  }

  return (
    <TouchableOpacity
      style={[styles.fbzIcon, { backgroundColor: color.shadowColor }]}
      activeOpacity={0.7}
      onLongPress={async () => {
        await Alert.alert(
          'Are you sure?',
          'This will hide ForbiddenZone entry button, you need to re-launch the app to show the button again',
          [
            {
              text: 'OK',
              style: 'destructive',
              onPress: () => {
                setShow(false)
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ],
        )
      }}
      onPress={() => {
        NavigationRoot.navigate(Constants.SCENES.FORBIDDEN_ZONE.HOME)
      }}
    >
      <Image source={require('@assets/icons/ic-debug.png')} style={[styles.icon, { tintColor: color.background }]} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  fbzIcon: {
    width: 15,
    height: 15,
    borderRadius: 10,
    position: 'absolute',
    right: 0,
    top: Metrics.screen.height / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: 12, height: 12 },
})

export default ForbiddenZoneEntry
