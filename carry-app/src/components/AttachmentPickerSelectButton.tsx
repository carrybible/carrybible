import { Text } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import Metrics from '@shared/Metrics'
import I18n from 'i18n-js'
import React from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'

const AttachmentPickerSelectButton: React.FC<{ totalPhotoSelected: number; closePicker: () => void }> = ({
  totalPhotoSelected,
  closePicker,
}) => {
  const { color } = useTheme()
  const disabled = totalPhotoSelected === 0
  return (
    <TouchableOpacity
      onPress={closePicker}
      style={[
        styles.wrapper,
        {
          backgroundColor: disabled ? `#B8CCFF` : color.accent,
        },
      ]}
      disabled={disabled}
      activeOpacity={0.8}
      delayPressIn={0.1}
      hitSlop={{ top: 5, right: 5, bottom: 5, left: 5 }}>
      <Text color="white" style={styles.text}>
        {I18n.t('text.select-picker', { valueNumber: totalPhotoSelected > 0 ? totalPhotoSelected : '' })}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginHorizontal: Metrics.insets.horizontal,
    marginVertical: Metrics.insets.vertical,
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
  },
  text: {
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
})

export default AttachmentPickerSelectButton
