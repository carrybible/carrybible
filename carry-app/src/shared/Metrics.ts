import { Dimensions, Platform, StatusBar } from 'react-native'

const screen = Dimensions.get('window')

export function isIphoneX() {
  const dimen = screen
  return (
    Platform.OS === 'ios' &&
    !Platform.isPad &&
    !Platform.isTVOS &&
    (dimen.height === 780 ||
      dimen.width === 780 ||
      dimen.height === 812 ||
      dimen.width === 812 ||
      dimen.height === 844 ||
      dimen.width === 844 ||
      dimen.height === 896 ||
      dimen.width === 896 ||
      dimen.height === 926 ||
      dimen.width === 926)
  )
}

export function isIOS() {
  return Platform.OS === 'ios'
}

function statusHeight({ width, height }) {
  const isLandscape = width > height
  if (Platform.OS === 'ios') {
    if (isLandscape) {
      return 0
    }
    if (isIphoneX()) {
      return 44
    }
    return 20
  }
  return StatusBar.currentHeight // 24
}

function calculateHeaderHeight({ width, height }) {
  const isLandscape = width > height
  let headerHeight = 44

  if (Platform.OS === 'android') {
    headerHeight = 56
  } else if (isLandscape) {
    headerHeight = 36
  }

  return headerHeight
}

export default {
  screen: {
    width: Math.min(screen.width, screen.height),
    height: Math.max(screen.width, screen.height),
  },
  insets: {
    horizontal: 16,
    vertical: 8,
    top: 15,
    bottom: 5,
  },
  safeArea: {
    bottom: Platform.OS === 'android' ? 5 : isIphoneX() ? 34 : 5,
  },
  header: {
    height: calculateHeaderHeight(screen),
  },
  status: {
    height: statusHeight(screen),
  },
  verseBookmark: {
    width: 45,
    left: 8,
  },
  drawer: {
    width: Math.min(320, screen.width - 30),
  },
}
