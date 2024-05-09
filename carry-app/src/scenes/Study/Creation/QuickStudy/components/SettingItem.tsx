/**
 * Setting Item for Goal
 *
 * @format
 *
 */

import Icon from '@components/Icon'
import { Text } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import { Metrics } from '@shared/index'
import React from 'react'
import { StyleSheet } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'

interface Props {
  item: any
  drag: any
  pickedQuestion: any
  onChangePickedQuestion: () => void
  disabled?: boolean
}

const SettingItem: React.FC<Props> = ({ item, drag, pickedQuestion, onChangePickedQuestion, disabled }) => {
  const { color: theme } = useTheme()
  const isPicked = pickedQuestion.includes(item.key)
  return (
    <TouchableOpacity
      disabled={disabled}
      style={[
        s.itemContainer,
        {
          borderColor: isPicked ? theme.text : theme.gray5,
          backgroundColor: theme.background,
        },
      ]}
      onPress={() => {
        if (isPicked) {
          onChangePickedQuestion(pickedQuestion.filter(value => item.key != value))
        } else {
          if (pickedQuestion.length >= 5) {
            toast.info('Please select 1-5 questions')
          } else {
            onChangePickedQuestion([...pickedQuestion, item.key])
          }
        }
      }}
      activeOpacity={0.8}
    >
      <Text style={[s.text, { color: isPicked ? theme.text : theme.gray3 }]}>{item.question}</Text>
      <Icon source={isPicked ? 'check-circle' : 'circle'} size={20} color={isPicked ? theme.text : theme.gray3} style={s.icon} />
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  itemContainer: {
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    marginHorizontal: Metrics.insets.horizontal,
    borderWidth: 1,
    minHeight: 50,
    paddingLeft: 15,
  },
  text: { flex: 1, lineHeight: 23 },
  icon: { marginHorizontal: 15 },
})

export default SettingItem
