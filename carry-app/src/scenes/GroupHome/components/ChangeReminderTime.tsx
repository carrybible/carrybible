import React from 'react'
import DatePicker from '@components/DatePicker'
import I18n from 'i18n-js'

interface Props {
  open: boolean
  setOpen: (a: boolean) => void
  onChange: (b: any) => void
  time: Date
}
const ChangeReminderTime: React.FC<Props> = props => {
  const dismissDatePicker = value => {
    props.setOpen(false)
    if (value) {
      props.onChange(value)
    }
  }

  return (
    <DatePicker
      isVisible={props.open}
      handleDismiss={dismissDatePicker}
      current={props.time}
      title={I18n.t('text.Choose a reminder time')}
      confirm={I18n.t('text.Confirm')}
      mode="time"
    />
  )
}

ChangeReminderTime.defaultProps = {
  open: false,
}

export default ChangeReminderTime
