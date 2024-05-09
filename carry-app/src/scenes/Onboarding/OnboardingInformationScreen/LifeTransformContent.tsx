import React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { Text, Title } from '@components/Typography'
import I18n from 'i18n-js'
import { Metrics } from '@shared/index'

const LifeTransformContent: React.FC = () => {
  return (
    <View style={styles.wrapper}>
      <Image source={require('@assets/images/img-life-transform.png')} style={styles.image} resizeMode="contain" />
      <Title align="center" style={styles.title}>
        {I18n.t('text.Prepare for life transformation')}
      </Title>
      {[
        I18n.t('text.Did you know that reading the Bible 4x a week leads to life change'),
        I18n.t('text.Sharing faith increases 228'),
        I18n.t('text.Discipleship increases 231'),
        I18n.t('text.Anxiety decreases 34'),
      ].map((text, index) => (
        <Text key={index} align="center" style={styles.content} color="gray">
          {text}
        </Text>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  image: {
    height: Metrics.screen.height * 0.2,
    marginBottom: '10%',
    marginTop: '-10%',
  },
  title: { marginBottom: '5%' },
  content: { width: '70%', marginBottom: 8 },
})

export default LifeTransformContent
