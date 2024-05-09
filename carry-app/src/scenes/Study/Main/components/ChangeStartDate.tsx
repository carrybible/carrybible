import React, { useState } from 'react'
import DatePicker from '@components/DatePicker'

interface Props {
  open: boolean
  setOpen: (a: boolean) => void
  onChange: (a: boolean) => void
}
const ChangeStartDate: React.FC<Props> = props => {
  const dismissDatePicker = () => {
    props.setOpen(false)
    // if (value) {
    //   props.onChange(value)
    // }
  }

  return (
    <DatePicker
      isVisible={props.open}
      handleDismiss={dismissDatePicker}
      current={new Date()}
      title="Choose a start date"
      confirm="Confirm"
      minimumDate={new Date()}
    />
  )
}

ChangeStartDate.defaultProps = {
  open: false,
}

export default ChangeStartDate
