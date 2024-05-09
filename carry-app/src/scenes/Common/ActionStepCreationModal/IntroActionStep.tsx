import BottomButton from '@components/BottomButton'
import { Text, Title, H1 } from '@components/Typography'
import I18n from 'i18n-js'
import React from 'react'
import { StyleSheet, View } from 'react-native'

type Props = {
  onPress: () => void
}

const IntroActionStep: React.FC<Props> = props => {
  return (
    <>
      <View style={s.content}>
        <Title>🙌</Title>
        <H1>{I18n.t('text.Action steps')}</H1>
        <Text>{I18n.t('text.action_steps_descriptions')}</Text>
      </View>
      <BottomButton title={I18n.t('text.Create an action')} rounded onPress={props.onPress} />
    </>
  )
}

const s = StyleSheet.create({
  content: {
    paddingTop: 30,
    marginBottom: 30,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 50,
    flex: 1,
  },
})

export default IntroActionStep
