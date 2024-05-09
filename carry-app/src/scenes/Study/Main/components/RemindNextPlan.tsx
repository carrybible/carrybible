import { StyleSheet, TouchableOpacity, View } from 'react-native'
import React from 'react'

import useTheme from '@hooks/useTheme'

import { H3, Text, Title } from '@components/Typography'
import I18n from 'i18n-js'
import Button from '@components/Button'
import Metrics from '@shared/Metrics'
import Constants from '@shared/Constants'
import { NavigationRoot } from '@scenes/root'
import { useSelector } from 'react-redux'
import { RootState } from '@dts/state'
import { useNavigation } from '@react-navigation/native'

interface Props {
  onPressClose: () => void
}

const RemindNextPlan: React.FC<Props> = props => {
  const { color } = useTheme()
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const navigation = useNavigation()
  const onCreateNextPlan = () => {
    NavigationRoot.push(Constants.SCENES.STUDY_PLAN.PICK_STUDY, { groupId: group.id, isFromGroup: true, isHaveActive: true })
  }

  return (
    <View style={[styles.contentWrapper, { backgroundColor: color.middle }]}>
      <View style={styles.mainIconContainer}>
        <Title style={styles.mainIcon}>⏰</Title>
      </View>
      <H3 align="center" style={styles.title}>
        {I18n.t('text.It is time to plan your next study')}
      </H3>
      <Text align="center" style={styles.contentText} color="gray3">
        {I18n.t('text.Your current study is almost finished. Let is queue up the next one')}
      </Text>
      <View style={styles.buttonContainer}>
        <Button.Full
          text={I18n.t('text.Create next plan')}
          style={[
            styles.button,
            {
              backgroundColor: color.accent,
            },
          ]}
          textStyle={[styles.buttonConfirmText, { color: color.white }]}
          onPress={onCreateNextPlan}
        />
        <TouchableOpacity style={styles.buttonText} onPress={() => navigation.pop()}>
          <H3 color="gray3" bold>
            {I18n.t('text.Not now')}
          </H3>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Metrics.insets.horizontal,
  },
  mainIcon: {
    fontSize: 50,
  },
  title: {
    marginVertical: 10,
  },
  contentText: {
    marginBottom: 139,
  },
  buttonText: {
    marginTop: 20,
    marginBottom: 32,
  },
  button: {
    borderRadius: 10,
  },
  buttonConfirmText: { fontWeight: '700', flex: 1 },
  mainIconContainer: {
    width: 135,
    height: 135,
    borderRadius: 67.5,
    backgroundColor: '#E7EDFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
  },
})

export default RemindNextPlan
