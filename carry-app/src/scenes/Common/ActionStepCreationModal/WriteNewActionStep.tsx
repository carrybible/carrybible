import BottomButton from '@components/BottomButton'
import { H1, Subheading } from '@components/Typography'
import BorderTextInput from '@scenes/Study/Creation/AdvancedStudy/components/BorderTextInput'
import I18n from 'i18n-js'
import React from 'react'
import { Animated, StyleSheet, View } from 'react-native'

type Props = {
  onPress: () => void
  value: string
  onChange: (newValue: string) => void
  opacity: any
}

const WriteNewActionStep: React.FC<Props> = props => {
  const { onChange, value, onPress } = props
  return (
    <Animated.View
      style={[
        s.wrapper,
        {
          opacity: props.opacity,
        },
      ]}
    >
      <View style={s.content}>
        <H1 style={s.title}>{I18n.t('text.Write an action')}</H1>
        <Subheading color="gray2">{I18n.t('text.We will queue this up for your group')}</Subheading>
      </View>
      <BorderTextInput
        style={s.textInput}
        maxLength={150}
        numberOfLines={1}
        value={value}
        onChangeText={onChange}
        placeholder={I18n.t('text.Write your own action here')}
      />
      <BottomButton title={I18n.t('text.Next')} rounded onPress={onPress} disabled={value.length === 0} />
    </Animated.View>
  )
}

const s = StyleSheet.create({
  content: {
    paddingTop: 50,
    marginBottom: 15,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 50,
    flex: 1,
  },
  wrapper: {
    flex: 1,
  },
  title: {
    marginBottom: 15,
  },
  textInput: {
    marginHorizontal: 15,
    marginBottom: 20,
  },
})

export default WriteNewActionStep
