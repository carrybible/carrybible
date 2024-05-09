/**
 * BookTitle
 *
 * @format
 *
 */

import Icon from '@components/Icon'
import { H3 } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import I18n from 'i18n-js'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import styles from './styles'

interface Props {
  name: string
  highlighted?: boolean
  expanded?: boolean
}

const BookTitle: React.FC<Props> = props => {
  const { color } = useTheme()
  return (
    <View style={styles.titleContainer}>
      <Icon
        source={'chevron-right'}
        size={22}
        color={props.highlighted ? color.accent : color.gray3}
        style={[styles.icon, { transform: props.expanded ? [{ rotate: '90deg' }] : [] }]}
      />
      <H3 color={props.highlighted ? 'accent' : 'text'} style={[s.bible, styles.title]}>
        {I18n.t(`bible.${props.name}`)}
      </H3>
    </View>
  )
}

BookTitle.defaultProps = {}

const s = StyleSheet.create({
  bible: { fontWeight: '700' },
})

export default BookTitle
