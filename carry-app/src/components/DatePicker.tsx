import React, { useState } from 'react'
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import Modal from 'react-native-modal'
import { Text } from '@components/Typography'
import useTheme from 'src/hooks/useTheme'
import { Metrics } from '@shared/index'
import I18n from 'i18n-js'

type IProps = {
  current?: Date
  minimumDate?: Date
  handleDismiss: (value?: Date) => void
  isVisible: boolean
  title: string
  confirm: string
  mode: any
}

const DatePicker = (props: IProps) => {
  const { color } = useTheme()
  const [value, setValue] = useState<any>(new Date() || props.current)

  const renderBodyIOS = () => {
    return (
      <Modal isVisible={props.isVisible} style={styles.modalWrapper} onBackdropPress={handleDismiss}>
        <View>
          <View style={[styles.body, { backgroundColor: color.background }]}>
            <Text bold>{props.title}</Text>
            <DateTimePicker
              value={value}
              is24Hour={true}
              minimumDate={props.minimumDate}
              display="default"
              onChange={(event, date) => {
                setValue(date)
                if (Platform.OS === 'android') props.handleDismiss(date)
              }}
              mode={props.mode}
              style={styles.datePicker}
              textColor={color.text}
            />
          </View>
          <View style={styles.header}>
            <TouchableOpacity onPress={onPressSave} style={[styles.buttonAction, { backgroundColor: color.middle }]}>
              <Text bold style={{ color: color.accent }}>
                {props.confirm || I18n.t('text.Save')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )
  }

  const renderBodyAndroid = () => {
    return props.isVisible ? (
      <DateTimePicker
        value={value}
        is24Hour={true}
        locale={I18n.currentLocale()}
        minimumDate={props.minimumDate}
        display="default"
        onChange={(event, date) => {
          props.handleDismiss(date)
        }}
        mode={props.mode}
        style={styles.datePickerAndroid}
      />
    ) : null
  }

  const handleDismiss = () => {
    props.handleDismiss()
  }

  const onPressSave = () => {
    props.handleDismiss(value)
  }

  return Platform.OS === 'ios' ? renderBodyIOS() : renderBodyAndroid()
}

DatePicker.defaultProps = {
  totalChapter: 10,
  mode: 'date',
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
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  modalWrapper: {
    justifyContent: 'flex-end',
  },
  datePicker: {
    width: 100,
    height: 50,
    alignSelf: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: 15,
  },
  datePickerAndroid: {
    width: '100%',
  },
})

export default DatePicker
