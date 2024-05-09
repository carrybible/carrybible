import cc from 'color'
import Color from '../../dts/color'
import Typography from '../../dts/typography'
import { DeepPartial, Theme } from 'stream-chat-react-native'
import { StyleSheet } from 'react-native'
const colors: { [key: string]: Color } = {
  // dark: {
  light: {
    id: 'light',
    name: 'Light',
    background: '#FFFFFF',
    lavender: '#e2ebff',
    middle: '#FFFFFF',
    contrast: '#35383f',
    text: '#323232',
    shadowColor: '#3E3E3E',
    green: '#3AD8B6',
    green2: '#219653',
    blue: '#7199fe',
    blue0: '#E7EDFF',
    blue1: '#C6D6FF',
    blue2: '#F4F7FF',
    red: '#DF4D4D',
    jesusWords: '#DF4D4D',
    yellow: '#FFDF49',
    notification: '#7199fe',
    gray: cc('#FFFFFF').mix(cc('#323232'), 0.66).hex(),
    gray2: cc('#FFFFFF').mix(cc('#323232'), 0.56).hex(),
    gray3: cc('#FFFFFF').mix(cc('#323232'), 0.46).hex(),
    gray4: cc('#FFFFFF').mix(cc('#323232'), 0.36).hex(),
    gray5: cc('#FFFFFF').mix(cc('#323232'), 0.26).hex(),
    gray6: cc('#FFFFFF').mix(cc('#323232'), 0.16).hex(),
    gray7: cc('#FFFFFF').mix(cc('#323232'), 0.06).hex(),
    gray8: '#4F4F4F',
    gray9: 'rgba(53,56,63,0.78)',
    gray10: '#828282',
    white: '#FFFFFF',
    barStyle: 'dark-content',
    black: '#323232',
    orange: '#FF9D46',
    orange2: '#FFEEE9',
    purple: '#E1BBFF',
    purple1: '#BF80FF',
    purple2: '#BB6BD9',
    blue3: '#56CCF2',
    black2: '#333333',
    whiteSmoke: '#edeef3',
    //
    primary: '#7199fe',
    heading: '',
    bodyText: '',
    accent: '#7199fe',
    accent2: '#7199fe',
    lightAccent: '#C6D6FF',
    lightText: '',
    lightTextSecondary: '#ffffff',
    transparent: 'transparent',
  },
  // light: {
  dark: {
    id: 'dark',
    name: 'Dark',
    background: '#35383f', // #1C1C1E #35383F
    lavender: '#e2ebff',
    middle: '#3e414a',
    contrast: '#FFFFFF',
    text: '#FFFFFF',
    shadowColor: '#FFFFFF',
    white: '#FFFFFF',
    gray: cc('#35383f').mix(cc('#FFFFFF'), 0.66).hex(),
    gray2: cc('#35383f').mix(cc('#FFFFFF'), 0.56).hex(),
    gray3: cc('#35383f').mix(cc('#FFFFFF'), 0.46).hex(),
    gray4: cc('#35383f').mix(cc('#FFFFFF'), 0.36).hex(),
    gray5: cc('#35383f').mix(cc('#FFFFFF'), 0.26).hex(),
    gray6: cc('#35383f').mix(cc('#FFFFFF'), 0.16).hex(),
    gray7: cc('#35383f').mix(cc('#FFFFFF'), 0.06).hex(),
    gray8: '#B0B0B0',
    gray9: 'rgba(53,56,63,0.78)',
    gray10: '#828282',
    green: '#3AD8B6',
    green2: '#219653',
    blue: '#7199fe',
    blue0: '#E7EDFF',
    blue1: '#C6D6FF',
    blue2: '#5a5e66',
    red: '#FF7474',
    jesusWords: '#FF7474',
    yellow: '#FFDF49',
    notification: '#7199fe',
    barStyle: 'light-content',
    black: '#323232',
    orange: '#FF9D46',
    orange2: '#5d5d61',
    purple: '#E1BBFF',
    purple1: '#BF80FF',
    purple2: '#BB6BD9',
    blue3: '#56CCF2',
    black2: '#CCCCCC',
    whiteSmoke: '#edeef3',
    //
    primary: '#7199fe',
    heading: '',
    bodyText: '',
    accent: '#7199fe',
    accent2: '#7199fe',
    lightAccent: '#C6D6FF',
    lightBackground: '',
    lightText: '',
    lightTextSecondary: '#ffffff',
  },
}

export const generateStreamIOTheme = (color: Color, typography: Typography) => {
  const colors =
    color.id === 'dark'
      ? {
          accent_blue: color.blue,
          accent_green: '#20E070',
          accent_red: '#FF3742',
          bg_gradient_end: '#33343B',
          bg_gradient_start: '#32353D',
          black: color.text,
          blue_alice: cc('#35383f').mix(cc('#7199fe'), 0.1).hex(),
          border: color.gray5,
          button_background: '#FFFFFF',
          button_text: '#005FFF',
          grey: color.gray2, //'#7A7A7A',
          grey_gainsboro: color.gray6,
          grey_whisper: color.gray5,
          icon_background: '#FFFFFF',
          modal_shadow: '#000000',
          overlay: '#C5C5C556',
          overlay_dark: '#FFFFFFCC', // CC = 80% opacity
          shadow_icon: '#00000080', // 80 = 50% opacity
          targetedMessageBackground: '#302D22',
          transparent: 'transparent',
          white: color.background,
          white_smoke: color.gray5,
          white_snow: color.background,
        }
      : {
          accent_blue: color.blue,
          accent_green: '#20E070',
          accent_red: color.red, //'#FF3742',
          bg_gradient_end: '#F7F7F7',
          bg_gradient_start: '#FCFCFC',
          black: '#000000',
          blue_alice: '#E9F2FF',
          border: '#00000014', // 14 = 8% opacity; top: x=0, y=-1; bottom: x=0, y=1
          button_background: '#005FFF',
          button_text: '#FFFFFF',
          grey: color.gray, //'#7A7A7A',
          grey_gainsboro: color.gray6, //'#DBDBDB',
          grey_whisper: color.gray5,
          icon_background: '#FFFFFF',
          modal_shadow: '#00000099', // 99 = 60% opacity; x=0, y= 1, radius=4
          overlay: '#00000033', // 33 = 20% opacity
          overlay_dark: '#00000099', // 99 = 60% opacity
          shadow_icon: '#00000040', // 40 = 25% opacity; x=0, y=0, radius=4
          targetedMessageBackground: '#FBF4DD', // dark mode = #302D22
          transparent: 'transparent',
          white: '#FFFFFF',
          white_smoke: '#F2F2F2',
          white_snow: color.background,
        }

  const StreamTheme: DeepPartial<Theme> = {
    colors,
    attachmentPicker: {
      imageOverlaySelectedComponent: { check: { backgroundColor: 'red' } },
      bottomSheetContentContainer: { backgroundColor: color.background },
    },
    attachmentSelectionBar: {
      container: { backgroundColor: color.background, borderTopColor: `${color.gray5}99`, borderTopWidth: StyleSheet.hairlineWidth },
    },
    messageInput: {
      attachmentSelectionBar: { backgroundColor: color.background },
      container: { backgroundColor: color.background, borderTopWidth: 0, padding: 0, paddingHorizontal: 15, paddingVertical: 3 },
      inputBoxContainer: {
        borderRadius: 23,
        borderColor: `${color.gray5}99`,
        borderWidth: StyleSheet.hairlineWidth,
        backgroundColor: color.id === 'dark' ? color.middle : `${color.gray7}`,
      },
      giphyContainer: {
        marginVertical: 2,
      },
      sendButtonContainer: { padding: 0, paddingLeft: 0 },
      inputBox: { color: color.text, fontSize: typography.body },
      suggestions: {
        command: {
          title: { fontSize: typography.subhead },
          args: { fontSize: typography.subhead },
        },
        commandsHeader: { title: { fontSize: typography.subhead } },
      },
    },
    messageList: {},
    reply: {
      messageContainer: { backgroundColor: `${color.blue}30`, borderWidth: 0 },
      markdownStyles: { text: { color: color.text } },
    },
    thread: {
      newThread: {
        backgroundGradientStart: color.background,
        backgroundGradientStop: color.background,
        text: { fontWeight: 'bold' },
      },
    },
    messageSimple: {
      card: {
        container: { paddingHorizontal: 6, paddingBottom: 2 },
        authorName: { color: color.blue, marginRight: 5, textAlign: 'left' },
        authorNameContainer: { paddingHorizontal: 0, paddingRight: 5, backgroundColor: color.id === 'light' ? '#EFF0F2' : '#3F4048' },
        authorNameFooterContainer: { backgroundColor: 'red' },
        footer: {
          flex: 1,
          title: { marginHorizontal: 0, color: color.text, fontSize: typography.subhead },
          description: { marginHorizontal: 0, color: color.gray2, fontSize: typography.footnote, lineHeight: 18 },
        },
      },
      content: {
        containerInner: { backgroundColor: color.id === 'light' ? '#EFF0F2' : '#3F4048', borderWidth: 0 },
        messageUser: { color: color.text },
        replyContainer: { backgroundColor: color.background, paddingBottom: 5 },
        errorContainer: {
          paddingRight: 0,
          paddingTop: 10,
        },
        markdown: {
          text: { color: color.text, fontSize: typography.body },
        },
      },
    },
    imageGallery: {
      blurType: color.id === 'dark' ? 'dark' : 'light',
    },
    channel: {
      selectChannel: { fontWeight: 'bold', padding: 16 },
    },
  }

  return StreamTheme
}

export default colors
