import { Text } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import { Styles } from '@shared/index'
import React from 'react'
import { Platform, Pressable, StyleSheet, View } from 'react-native'

import { useBigStyle } from './constant'

const HomeActionButton: React.FC<{
  icon: string
  text: string
  badgeNumber?: number
  onPress: () => void
}> = ({ text, icon, onPress, badgeNumber }) => {
  const { color, typography } = useTheme()

  const badgeSize = React.useMemo(() => {
    return {
      size: 25,
      position: -8,
    }
  }, [])

  return (
    <Pressable
      style={({ pressed }) => [
        styles.groupActionButton,
        { backgroundColor: color.background },
        color.id === 'light' ? Styles.shadow : styles.darkThemeShadow,
        pressed && Platform.OS === 'ios' ? { opacity: 0.7 } : null,
      ]}
      android_ripple={{
        color: color.gray7,
      }}
      onPress={onPress}>
      <Text style={styles.iconText} align="center">
        {icon}
      </Text>
      {badgeNumber ? (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: color.accent2,
              width: badgeSize.size,
              height: badgeSize.size,
              top: badgeSize.position,
              right: badgeSize.position,
            },
          ]}>
          <Text style={{ fontSize: useBigStyle ? typography.body : typography.footnote }} bold color="whiteSmoke">
            {badgeNumber > 9 ? '9ᐩ' : badgeNumber}
          </Text>
        </View>
      ) : null}

      <Text numberOfLines={1} style={[styles.text, { fontSize: typography.small }]} bold>
        {text}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  darkThemeShadow: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#ffffff',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  groupActionButton: {
    width: 100,
    height: 100,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    marginBottom: 16,
    marginTop: 16,
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#EDEEF3',
  },

  badge: {
    position: 'absolute',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconText: {
    fontSize: 36,
  },
  text: {
    marginTop: 6,
  },
})

export default HomeActionButton
