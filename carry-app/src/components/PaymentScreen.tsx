import useTheme from '@hooks/useTheme'
import React from 'react'
import { ScrollView, StyleSheet, Text } from 'react-native'

interface Props {
  children: any
}

const PaymentScreen: React.FC<Props> = ({ children }) => {
  const { color } = useTheme()

  return (
    <ScrollView
      accessibilityLabel="payment-screen"
      style={[styles.container, { backgroundColor: color.background }]}
      keyboardShouldPersistTaps="always">
      {children}
      {/* eslint-disable-next-line react-native/no-inline-styles */}
      <Text style={{ opacity: 0 }}>appium fix</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
})

export default PaymentScreen
