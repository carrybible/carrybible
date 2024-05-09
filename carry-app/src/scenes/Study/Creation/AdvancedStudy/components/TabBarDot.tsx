import useTheme from '@hooks/useTheme'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { NavigationState, Route, SceneRendererProps } from 'react-native-tab-view/lib/typescript/types'

const TabBarDot = (
  props: SceneRendererProps & {
    navigationState: NavigationState<Route>
  },
) => {
  const { color } = useTheme()
  const { navigationState } = props
  return (
    <View style={styles.wrapper}>
      {navigationState.routes.map((route, index) => {
        return (
          <View
            key={route.key}
            style={[
              styles.dot,
              { backgroundColor: color.gray },
              index === navigationState.index
                ? {
                    backgroundColor: color.text,
                  }
                : null,
            ]}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
})

export default TabBarDot
