/**
 * Verse Component
 *
 * @format
 *
 */

import { Footnote } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import { Constants } from '@shared/index'
import _ from 'lodash'
import React, { forwardRef, ForwardRefRenderFunction, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Platform, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native'

type IProps = {
  style?: StyleProp<ViewStyle>
  verse: number
  rootID: string | number
  children?: any
  onPress?: any
}

type RefType = {
  props: { rootID: string | number; verse: number }
  toogle: () => void
  select: () => void
  disable: () => void
  unselect: () => void
  highlight: (color?: string) => void
}

const Verse: ForwardRefRenderFunction<RefType, IProps> = (props, ref) => {
  const { color: theme } = useTheme()
  const [disabled, setDisabled] = useState(false)
  const innerRef = useRef<Text>(null)
  const selected = useRef(false)
  const highlightColor = useRef('transparent')

  const updateHighlight = useCallback(
    color => {
      const c = _.find(Constants.HIGHLIGHTS[theme.id], { id: color })
      innerRef.current?.setNativeProps({
        style: { backgroundColor: c ? c.color : 'transparent' },
      })
    },
    [theme.id],
  )

  useImperativeHandle(ref, () => ({
    props: {
      rootID: props.rootID,
      verse: props.verse,
    },
    toogle: () => {
      selected.current = !selected.current
      updateSelectStyle()
      return [selected.current, highlightColor.current]
    },
    select: () => {
      selected.current = true
      updateSelectStyle()
    },
    disable: () => {
      updateFadeStyle()
      setDisabled(true)
    },
    unselect: () => {
      selected.current = false
      updateSelectStyle()
    },
    highlight: color => {
      const c = color ? color : 'transparent'
      highlightColor.current = c
      if (innerRef.current) {
        updateHighlight(color)
      }
    },
  }))

  useEffect(() => {
    updateHighlight(highlightColor.current)
  }, [updateHighlight])

  const updateSelectStyle = () => {
    innerRef.current?.setNativeProps({
      style: {
        ...Platform.select({
          ios: {
            opacity: selected.current ? 0.6 : 1,
            color: selected.current ? theme.accent : theme.text,
          },
          android: {
            textShadowRadius: selected.current ? 1 : 0,
            textShadowColor: selected.current ? theme.accent : 'transparent',
            color: selected.current ? theme.accent : theme.text,
          },
        }),
      },
    })
  }

  const updateFadeStyle = () => {
    innerRef.current?.setNativeProps({
      style: {
        ...Platform.select({
          ios: {
            opacity: 0.3,
          },
          android: {
            color: `${theme.text}30`,
          },
        }),
      },
    })
  }

  const _handlePress = () => {
    const { onPress, rootID } = props
    if (onPress) {
      onPress(rootID)
    }
  }

  return (
    <Text onPress={disabled ? undefined : _handlePress} style={props.style} ref={innerRef} suppressHighlighting selectable>
      <Footnote style={[props.style, s.verseNumber, { color: `${theme.text}99` }]}>{`  ${props.verse} `}</Footnote>
      {props.children}
    </Text>
  )
}

const s = StyleSheet.create({
  verseNumber: {
    fontWeight: '700',
  },
})

export default forwardRef<RefType, IProps>(Verse)
