import Loading from '@components/Loading'
import useTheme from '@hooks/useTheme'
import BibleApiFormatter from '@shared/BibleApiFormatter'
import React, { FC, useCallback } from 'react'
import { StyleSheet } from 'react-native'

import { WebView } from 'react-native-webview'

type Props = {
  source: string
  style?: any
  onVersePress?: (s: string, h: boolean, t: string) => void
  onScroll?: (data: any) => void
  backgroundColor?: string
}

const BibleApiView: FC<Props> = ({ source, style, onVersePress, onScroll, backgroundColor, ...props }) => {
  const { color } = useTheme()
  const html = BibleApiFormatter.processHtml(source, color, !!onVersePress, backgroundColor || '')

  const onMessage = useCallback(
    event => {
      const { action, data, highlight, text } = JSON.parse(event.nativeEvent.data)
      if (action === 'clicked') {
        onVersePress?.(data, highlight, text)
      }
      if (action === 'scroll') {
        onScroll?.({
          layoutHeight: Number(data?.layoutHeight),
          maxScrollHeight: Number(data?.maxScrollHeight),
          offsetY: Number(data?.offsetY),
        })
      }
    },
    [onVersePress],
  )

  const renderLoading = () => {
    return <Loading style={styles.loading} />
  }

  return (
    <WebView
      {...props}
      source={{ html }}
      style={[
        styles.container,
        style,
        { backgroundColor: backgroundColor ? backgroundColor : color.id === 'light' ? color.white : color.black },
      ]}
      javaScriptEnabled={true}
      onMessage={onMessage}
      renderLoading={renderLoading}
      startInLoadingState
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
})

export default BibleApiView
