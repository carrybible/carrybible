import React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { Text, Title } from '@components/Typography'
import I18n from 'i18n-js'
import { Metrics } from '@shared/index'

const GrowContent: React.FC = () => {
  return (
    <View style={styles.wrapper}>
      <Image source={require('@assets/images/img-grow.png')} style={styles.image} resizeMode="contain" />
      <Title align="center" style={styles.title}>
        {I18n.t('text.Grow with your community')}
      </Title>
      <Text align="center" style={styles.content} color="gray">
        {I18n.t('text.grow_content')}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  image: {
    height: Metrics.screen.height * 0.3,
    marginBottom: '10%',
    marginTop: '-10%',
  },
  title: { marginBottom: '5%' },
  content: { width: '70%' },
})

export default GrowContent
