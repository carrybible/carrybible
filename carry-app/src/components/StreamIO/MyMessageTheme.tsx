import useTheme from '@hooks/useTheme'
import { DeepPartial, Theme } from 'stream-chat-react-native-core'

function MyMessageTheme(): DeepPartial<Theme> {
  const { color } = useTheme()

  return {
    messageSimple: {
      card: {
        authorName: { color: color.white, marginRight: 5, textAlign: 'left' },
        authorNameContainer: { backgroundColor: color.blue },
        footer: {
          title: { marginHorizontal: 0, color: color.white },
          description: { marginHorizontal: 0, color: `${color.white}AA`, lineHeight: 18 },
        },
      },
      content: {
        containerInner: { backgroundColor: color.blue },
        markdown: { text: { color: color.white } },
        errorContainer: {
          paddingRight: 0,
          paddingTop: 10,
        },
      },
    },
  }
}

export function withMyMessageTheme(color: any): DeepPartial<Theme> {
  return {
    messageSimple: {
      card: {
        authorName: { color: color.white, marginRight: 5, textAlign: 'left' },
        authorNameContainer: { backgroundColor: color.blue },
        footer: {
          title: { marginHorizontal: 0, color: color.white },
          description: { marginHorizontal: 0, color: `${color.white}AA`, lineHeight: 18 },
        },
      },
      content: {
        containerInner: { backgroundColor: color.blue },
        markdown: { text: { color: color.white } },
        errorContainer: {
          paddingRight: 0,
          paddingTop: 10,
        },
      },
    },
  }
}

export default MyMessageTheme
