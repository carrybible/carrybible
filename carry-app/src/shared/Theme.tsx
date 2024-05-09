import { useAsyncStorage } from '@react-native-async-storage/async-storage'
import React, { useEffect } from 'react'
import { Appearance, Platform, StatusBar } from 'react-native'
import colors, { generateStreamIOTheme } from '../config/color'
import typographies from '../config/typography'

const initialState = {
  color: colors.light,
  typography: typographies.normal,
  changeTheme: (theme: string, typo?: string) => {
    // do nothing
  },
}
const ThemeContext = React.createContext(initialState)

function ThemeProvider({ children }: { children: any }) {
  const colorScheme = Appearance.getColorScheme()
  const defaultColor = colorScheme === 'dark' ? colorScheme : 'light'
  const { getItem: retrieveColor, setItem: saveColorId } = useAsyncStorage('@theme')
  const { getItem: retrieveTypo, setItem: saveTypoId } = useAsyncStorage('@typography')
  const [colorId, setColorId] = React.useState(defaultColor)
  const [typoId, setTypoId] = React.useState('normal')

  // Read default settings from async storage
  const sync = async () => {
    const color = await retrieveColor()
    if (color && color !== colorId) {
      setColorId(color)
    }

    const typo = await retrieveTypo()
    if (typo && typo !== typoId) {
      setTypoId(typo)
    }
  }

  // Component did load
  useEffect(() => {
    sync()
  }, [])

  // To toggle between dark and light modes
  function changeTheme(colorId: string, typoId?: string): void {
    saveColorId(colorId).then(() => {
      setColorId(colorId)
    })
    if (typoId) {
      saveTypoId(typoId).then(() => {
        setTypoId(typoId)
      })
    }
  }

  // Filter the styles based on the theme selected
  const color = colors[colorId]
  const typography = typographies[typoId]
  color.chat = generateStreamIOTheme(color, typography)

  StatusBar.setBarStyle(color.barStyle)
  if (Platform.OS === 'android') {
    StatusBar.setBackgroundColor(color.background)
  }

  return <ThemeContext.Provider value={{ color, typography, changeTheme }}>{children}</ThemeContext.Provider>
}

export default { ThemeProvider, ThemeContext }
