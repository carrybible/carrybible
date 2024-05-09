import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from './Typography'

const s = StyleSheet.create({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    marginTop: 20,
  },
  date: {
    fontSize: 15,
    fontWeight: 'bold',
    paddingBottom: 1,
  },
})

interface InlineDateSeparatorProps {
  date?: Date
}

export const InlineDateSeparator = React.memo(({ date }: InlineDateSeparatorProps) => {
  const isToday = new Date().toDateString() === new Date(date || '').toDateString()

  return isToday ? (
    <View style={s.container}>
      <Text style={s.date}>Today</Text>
    </View>
  ) : (
    <></>
  )
})
