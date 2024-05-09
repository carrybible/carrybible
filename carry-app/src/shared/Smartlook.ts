import { NativeModules } from 'react-native'

const noop = () => {
  // doing nothing function
}

let Smartlook
if (NativeModules.RNSmartlook) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Smartlook = require('smartlook-react-native-wrapper').default
} else {
  devLog(`Failed to load smart look`)
  Smartlook = {
    setupAndStartRecording: noop,
    setUserIdentifier: noop,
    trackCustomEvent: noop,
    trackNavigationEvent: noop,
    registerWhitelistedView: noop,
    ViewState: {},
  }
}

export const SMARTLOOK_API_KEY = ''

export const CUSTOM_EVENTS = {
  LOG_OUT: 'LOG_OUT',
  FAILED_CONNECTING_STREAM_IO: 'FAILED_CONNECTING_STREAM_IO',
  INIT_BIBLE_TRANSLATION_FAILED: 'INIT_BIBLE_TRANSLATION_FAILED',
  OPEN_GROUP: 'OPEN_GROUP',
  HANDLE_DYNAMIC_LINK: 'HANDLE_DYNAMIC_LINK',
  BRANCH_ERROR: 'BRANCH_ERROR',
}

export default Smartlook
