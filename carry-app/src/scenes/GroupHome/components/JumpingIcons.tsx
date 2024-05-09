import JumpingAvatars from '@components/JumpingAvatars'
import { Text } from '@components/Typography'
import React, { FC } from 'react'
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native'

type Props = {
  containerStyle?: StyleProp<ViewStyle>
  isRunning?: boolean
}

const JumpingIcons: FC<Props> = props => {
  const icons = [
    {
      text: '📖️',
      backgroundColor: '#cdf1e8',
    },
    {
      text: '💬',
      backgroundColor: '#eec5fd',
    },
    {
      text: '🙏',
      backgroundColor: '#cad9ff',
    },
    {
      text: '🎥',
      backgroundColor: '#fbd3af',
    },
    {
      text: '🎉',
      backgroundColor: '#dddefb',
    },
  ]
  return (
    <View style={[s.container, props.containerStyle]}>
      <JumpingAvatars
        jumpHeight={10}
        delayTime={100}
        duration={400}
        itemSize={35}
        isRunning={props.isRunning}
        data={icons.map(icon => {
          return (
            <View style={[s.icon, { backgroundColor: icon.backgroundColor }]}>
              <Text>{icon.text}</Text>
            </View>
          )
        })}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  icon: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
})

export default JumpingIcons
