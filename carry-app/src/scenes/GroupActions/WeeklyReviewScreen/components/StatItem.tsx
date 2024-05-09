import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Subheading, Title } from '@components/Typography'
import { Metrics, Styles } from '@shared/index'
import useTheme from '@hooks/useTheme'

type Props = {
  value: number
  title: string
}

const StatItem: React.FC<Props> = ({ value, title }) => {
  const { color } = useTheme()
  return (
    <View
      style={[
        styles.wrapper,
        // eslint-disable-next-line react-native/no-inline-styles
        {
          backgroundColor: color.background,
          opacity: value === 0 ? 0.25 : 1,
        },
        color.id === 'light' ? Styles.shadow : Styles.shadowDark,
      ]}
    >
      <Title style={styles.valueText}>{value}</Title>
      <Subheading align="center" bold numberOfLines={1}>
        {title}
      </Subheading>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: Metrics.screen.width / 2 - 30,
    marginLeft: 20,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 5,
    marginBottom: 40,
    borderRadius: 10,
  },
  valueText: {
    marginBottom: 9,
    color: '#B8CCFF',
  },
})

export default StatItem
