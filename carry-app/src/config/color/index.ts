import Config from '@shared/Config'
import cc from 'color'
import defaultColor, { generateStreamIOTheme as streamIOTheme } from './color'

const getStreamIOTheme = () => {
  switch (Config.VARIANT) {
    default:
      return streamIOTheme
  }
}

const getColor = () => {
  switch (Config.VARIANT) {
    default:
      return defaultColor
  }
}

export const getOpacityColor = (color: string, opacity = 1): string => {
  return cc('#FFFFFF').mix(cc(color), opacity).hex()
}

export const generateStreamIOTheme = getStreamIOTheme()
export default getColor()
