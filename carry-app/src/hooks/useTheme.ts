/**
 * useTheme hook
 *
 */

import React from 'react'
import Theme from '../shared/Theme'
import { Color, Typography } from '../dts'

const useTheme: () => {
  color: Color
  typography: Typography
  changeTheme: (colorId: string, typographyId?: string) => void
} = () => {
  const { color, typography, changeTheme } = React.useContext(Theme.ThemeContext)
  return { color, typography, changeTheme }
}

export default useTheme
