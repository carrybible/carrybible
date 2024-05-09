import { Dimensions } from 'react-native'

export enum HomeButtonStyle {
  // eslint-disable-next-line no-unused-vars
  BLUE = 'BLUE',
  // eslint-disable-next-line no-unused-vars
  WHITE = 'WHITE',
}

const { height: WINDOW_HEIGHT } = Dimensions.get('window')
export const useBigStyle = WINDOW_HEIGHT > 800
