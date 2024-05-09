import { Text } from '@components/Typography'
import { Picker } from '@react-native-community/picker'
import { Metrics } from '@shared/index'
import React, { useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import Modal from 'react-native-modal'
import useTheme from 'src/hooks/useTheme'

type IProps = {
  current?: any
  totalChapter: number
  handleDismiss: (value: any) => void
  isVisible: boolean
}

const ChapterReadRatePicker = (props: IProps) => {
  const { color, typography } = useTheme()

  const [selectedValue, setSelectedValue] = useState(
    props.current || {
      count: 1,
      rate: 'day',
    },
  )

  const getChapterCount = () => {
    const items: Array<any> = []
    for (let i = 1; i <= props.totalChapter; i++) {
      const value = i
      const item = <Picker.Item key={value} value={value} label={`${value} Chapter`} />
      items.push(item)
    }
    return items
  }

  const getRates = () => {
    return [<Picker.Item key={'d'} value={'day'} label={'Day'} />, <Picker.Item key={'w'} value={'week'} label={'Week'} />]
  }

  const onValueChange = (selectedCount, selectedRate) => {
    setSelectedValue({ count: selectedCount, rate: selectedRate })
  }

  const renderBody = () => {
    return (
      <View style={styles.body}>
        <Picker
          itemStyle={[styles.item, { fontSize: typography.body }]}
          selectedValue={selectedValue.count}
          style={styles.picker}
          onValueChange={itemValue => onValueChange(itemValue, selectedValue.rate)}>
          {getChapterCount()}
        </Picker>
        <Text style={[styles.separator, { color: color.black }]}>per</Text>
        <Picker
          itemStyle={[styles.item, { fontSize: typography.body }]}
          selectedValue={selectedValue.rate}
          style={styles.picker}
          onValueChange={itemValue => onValueChange(selectedValue.count, itemValue)}>
          {getRates()}
        </Picker>
      </View>
    )
  }

  const handleDismiss = () => {
    props.handleDismiss()
  }

  const onPressSave = () => {
    props.handleDismiss(selectedValue)
  }

  return (
    <Modal isVisible={props.isVisible} style={styles.modal} onBackdropPress={handleDismiss}>
      <View>
        {renderBody()}
        <View style={styles.header}>
          <TouchableOpacity onPress={onPressSave} style={[styles.buttonAction, { backgroundColor: color.white }]}>
            <Text bold style={{ color: color.accent }}>
              {'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

ChapterReadRatePicker.defaultProps = {
  totalChapter: 10,
}

const styles = StyleSheet.create({
  header: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Metrics.insets.vertical,
  },
  buttonAction: {
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  body: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  picker: {
    flex: 1,
  },
  separator: {
    alignSelf: 'center',
    fontSize: 16,
  },
  item: { textAlign: 'center', fontWeight: '700' },
  modal: { justifyContent: 'flex-end' },
})

export default ChapterReadRatePicker
