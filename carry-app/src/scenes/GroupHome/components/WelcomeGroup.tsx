import BottomButton from '@components/BottomButton'
import { H2, H3, Text } from '@components/Typography'
import useFadeInUp from '@hooks/animations/useFadeIn'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'
import cc from 'color'
import I18n from 'i18n-js'
import * as React from 'react'
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native'

interface WelcomeItemProps {
  icon: string
  title: string
  desc: string
  iconColor: string
}

const WelcomeItem: React.FC<WelcomeItemProps> = props => {
  const { icon, title, desc, iconColor } = props
  return (
    <View style={styles.welcomeItemContainer}>
      <View style={[styles.iconContainer, { backgroundColor: cc(iconColor).mix(cc('#FFFFFF'), 0.66).hex() }]}>
        <Text>{icon}</Text>
      </View>
      <View style={styles.welcomeContent}>
        <Text bold>
          {title}
          <Text> {desc}</Text>
        </Text>
      </View>
    </View>
  )
}

const WelcomeGroup: React.FC = () => {
  const { color } = useTheme()
  const [opacity] = useFadeInUp(600, 0)

  const onClose = () => {
    NavigationRoot.pop()
  }

  return (
    <Animated.View style={[styles.container, { opacity: opacity }]}>
      <TouchableOpacity activeOpacity={1} style={styles.background} onPress={onClose} />
      <View style={[styles.contentWrapper, { backgroundColor: color.background }]}>
        <Text style={styles.handText}>👋</Text>
        <H2 style={styles.titleText}>{I18n.t('text.Welcome to the group')}</H2>
        <Text color="gray3" style={styles.descText}>
          {I18n.t('text.welcome group desc')}
        </Text>
        <H3 color="gray4" style={styles.howItWorksText}>
          {I18n.t('text.How it works')}
        </H3>
        <WelcomeItem
          iconColor={'#7199FE'}
          icon={'📖'}
          title={I18n.t('We stay connected and growing by')}
          desc={I18n.t('text.doing the daily journey together')}
        />
        <WelcomeItem
          iconColor={'#49D380'}
          icon={'🙏'}
          title={I18n.t('We can pray for each other')}
          desc={I18n.t('text.discuss readings and more each day')}
        />
        <WelcomeItem iconColor={'#B57BFF'} icon={'💬'} title={I18n.t('text.We stay in touch')} desc={I18n.t('with group chat')} />
        <BottomButton onPress={onClose} style={styles.button} rounded title="Got it!" />
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  background: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
  },
  contentWrapper: {
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    paddingTop: 32,
    paddingBottom: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  handText: {
    fontSize: 49,
    alignSelf: 'center',
  },
  titleText: {
    marginTop: 10,
    alignSelf: 'center',
  },
  descText: {
    textAlign: 'center',
    marginTop: 10,
    marginHorizontal: 32,
  },
  howItWorksText: {
    marginTop: 20,
    alignSelf: 'center',
  },
  welcomeItemContainer: {
    flexDirection: 'row',
    marginTop: 8,
    marginHorizontal: 16,
    flexWrap: 'wrap',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EDEEF3',
    alignItems: 'center',
    padding: 15,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  welcomeContent: {
    flex: 1,
  },
  button: {
    marginTop: 10,
  },
})

export default WelcomeGroup
