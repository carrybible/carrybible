import BottomButton from '@components/BottomButton'
import { H1, H3, Subheading } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import { Picker } from '@react-native-community/picker'
import I18n from 'i18n-js'
import React, { useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import Modal from 'react-native-modal'

type Props = {
  onPress: (duration: number) => void
}

const SelectDurationActionStep: React.FC<Props> = props => {
  const { color } = useTheme()
  const { onPress } = props

  const [count, setCount] = useState(1)
  const [pace, setPace] = useState<'week' | 'day'>('week')

  const [visible, setVisible] = useState(false)

  return (
    <View style={s.wrapper}>
      <View style={s.content}>
        <H1 style={s.title}>{I18n.t('text.Choose a duration')}</H1>
        <Subheading color="gray3" align="center">
          {I18n.t('text.action_step_choose_duration_desc')}
        </Subheading>
      </View>
      <TouchableOpacity style={[s.selectDuration, { borderColor: color.accent }]} onPress={() => setVisible(true)}>
        <H3 color="accent" align="center">
          {`${count} ${count > 1 ? `${pace}s` : pace}`}
        </H3>
      </TouchableOpacity>
      <BottomButton title={I18n.t('text.Done')} rounded onPress={() => onPress(calculateDuration(count, pace))} />

      <Modal isVisible={visible} style={s.modal} onBackdropPress={() => setVisible(false)} useNativeDriver={false}>
        <SelectDuration maxCount={7} count={count} pace={pace} onCountChange={setCount} onPaceChange={setPace} />
      </Modal>
    </View>
  )
}

const SelectDuration: React.FC<{
  maxCount: number
  count: number
  pace: 'week' | 'day'
  onCountChange: (newCount: number) => void
  onPaceChange: (newPace: 'week' | 'day') => void
}> = props => {
  const { maxCount, count, pace, onCountChange, onPaceChange } = props
  const { color, typography } = useTheme()
  return (
    <View>
      <View
        style={[
          s.durationBody,
          {
            backgroundColor: color.background,
          },
        ]}
      >
        <Picker
          itemStyle={[s.pickerItem, { fontSize: typography.body }]}
          selectedValue={count}
          style={s.picker}
          onValueChange={itemValue => onCountChange(itemValue as number)}
        >
          {[...Array(maxCount).keys()].map(index => {
            return <Picker.Item key={index} value={index + 1} label={`${index + 1}`} color={color.text} />
          })}
        </Picker>
        <Picker
          itemStyle={[s.pickerItem, { fontSize: typography.body }]}
          selectedValue={pace}
          style={s.picker}
          onValueChange={itemValue => onPaceChange(itemValue as 'week' | 'day')}
        >
          {['week', 'day'].map(paceValue => {
            return <Picker.Item key={paceValue} value={paceValue} label={paceValue} color={color.text} />
          })}
        </Picker>
      </View>
    </View>
  )
}

const calculateDuration = (count: number, pace: 'week' | 'day') => {
  if (pace === 'week') {
    return count * 7
  }
  return count
}

const s = StyleSheet.create({
  content: {
    paddingTop: 50,
    marginBottom: 15,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 50,
  },
  wrapper: {
    justifyContent: 'space-between',
    flex: 1,
  },
  title: {
    marginBottom: 15,
  },
  selectDuration: {
    marginHorizontal: 15,
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingVertical: 13,
  },
  durationBody: {
    flexDirection: 'row',
    borderRadius: 8,
  },
  picker: {
    flex: 1,
  },
  pickerItem: {
    textAlign: 'center',
    fontWeight: '700',
  },
  modal: {
    justifyContent: 'flex-end',
  },
})

export default SelectDurationActionStep
