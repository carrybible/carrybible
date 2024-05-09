import React, { useEffect } from 'react'
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native'
import i18n from 'i18n-js'

import { Styles } from '@shared/index'

import Icon from '@components/Icon'
import useTheme from '@hooks/useTheme'
import TextField from '@components/TextField'
import { H3 } from '@components/Typography'

type Props = {
  style?: StyleProp<ViewStyle>
  initSearchValue?: string
  placeholder?: string
  autoTrigger?: boolean
  onSearch: (searchValue: string) => void
}

const SearchBar: React.FC<Props> = props => {
  const { placeholder, initSearchValue, onSearch, style, autoTrigger } = props

  const { color, typography } = useTheme()
  const [searchValue, setSearchValue] = React.useState(initSearchValue ?? '')
  const isShowClearButton = searchValue.length > 0
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clean up timeout when unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleChangeText = React.useCallback(
    (id: string, value: string) => {
      setSearchValue(value)
      if (autoTrigger) {
        // debounce trigger onSearch
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => onSearch(value), 200)
      }
    },
    [autoTrigger, onSearch],
  )

  const handleClearSearchValue = React.useCallback(() => {
    setSearchValue('')
    onSearch('')
  }, [onSearch])

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: color.background },
          color.id === 'dark' ? styles.darkThemeShadow : Styles.shadow,
        ]}
      >
        <Icon source={'search'} size={24} color={color.text} style={styles.searchIcon} />
        <TextField
          id={'searchInput'}
          placeholder={placeholder}
          value={searchValue}
          onChangeText={handleChangeText}
          style={styles.textInput}
          numberOfLines={1}
          containerStyle={styles.textInputContainer}
          placeholderWeight="500"
          returnKeyType="search"
          onSubmitEditing={({ nativeEvent: { text } }) => !autoTrigger && onSearch(text)}
        />
        {isShowClearButton && (
          <TouchableOpacity onPress={handleClearSearchValue}>
            <Icon source={'x'} size={24} color={color.text} style={styles.clearIcon} />
          </TouchableOpacity>
        )}
      </View>
      {isShowClearButton && (
        <TouchableOpacity onPress={handleClearSearchValue} style={styles.clearBtn}>
          <H3 style={{ fontSize: typography.small }}>{i18n.t('text.Cancel')}</H3>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    zIndex: 0,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  darkThemeShadow: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#ffffff',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 5,
  },
  textInputContainer: {
    flex: 1,
  },
  clearIcon: {
    marginLeft: 15,
  },
  clearBtn: {
    marginLeft: 17,
  },
  textInput: {
    margin: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
})

SearchBar.defaultProps = {
  autoTrigger: true,
}

export default SearchBar
