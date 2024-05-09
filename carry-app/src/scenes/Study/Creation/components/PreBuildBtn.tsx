import { H3, Subheading } from '@components/Typography'
import Color from '@dts/color'
import useTheme from '@hooks/useTheme'
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'

const PreBuildBtn: React.FC<{
  icon: Element
  title: string
  description: string
  onPress: () => void
  colorIcon?: keyof Color
  customBottom?: any
  customLabel?: any
}> = ({ icon, title, description, onPress, colorIcon = 'black', customBottom, customLabel }) => {
  const { color } = useTheme()
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={s.container}>
        <View>{customLabel}</View>
        <View
          style={[s.icon, { backgroundColor: color[colorIcon] }, colorIcon === 'white' ? { borderColor: color.gray6, borderWidth: 1 } : {}]}
        >
          {icon}
        </View>
        <H3 bold style={s.title}>
          {title}
        </H3>
        <Subheading color="gray">{description}</Subheading>
        {customBottom}
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EDEEF3',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 24,
    paddingVertical: 42,
  },
  title: {
    marginTop: 19,
    marginBottom: 9,
  },
  icon: {
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
})

export default PreBuildBtn
