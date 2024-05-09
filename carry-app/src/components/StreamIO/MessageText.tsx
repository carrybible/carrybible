import React from 'react'
import { Linking, View, StyleSheet } from 'react-native'
import { Text } from '@components/Typography'
import urlRegex from 'url-regex'

type Props = {
  inGroupGoal?: boolean
  message: any
  theme: any
}

export const MessageText: React.FC<Props> = props => {
  // const hasAttachment = _.size(props.message.attachments) > 0
  const isQuotedReply = props?.message?.groupStyles === undefined

  const message = props.message.text.replace(urlRegex({ strict: false }), function (url) {
    return '$<link>' + url + '$<link>'
  })
  const texts = message.split('$<link>')

  return (
    <View style={styles.container}>
      {texts.map((t, index) => (
        <Text
          key={`${index}-${t}`}
          style={isQuotedReply ? props.theme.theme.reply.markdownStyles.text : props.theme.theme.messageSimple.content.markdown.text}>
          {urlRegex({ strict: false }).test(t) ? (
            <Text
              onPress={() => {
                let url = t
                if (!t.toLowerCase().startsWith('http')) {
                  url = 'https://' + t
                }
                Linking.openURL(url)
              }}
              style={styles.link}>
              {t}
            </Text>
          ) : (
            t
          )}
        </Text>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  link: { color: '#0000EE', textDecorationLine: 'underline' },
})
