import React from 'react'
import { Text, StyleSheet } from 'react-native'

/**
 *
 * @param children
 * @param styles
 * @param type
 * @returns {*}
 */
export default function applyStyle(children, styles, type) {
  let style = styles
  if (!(style instanceof Array)) {
    style = [styles]
  }

  return children.map(child => {
    if (child.type.displayName === type) {
      return <Text key={child.key} {...child.props} style={StyleSheet.flatten([child.props.style, ...style])} />
    }
    return child
  })
}
