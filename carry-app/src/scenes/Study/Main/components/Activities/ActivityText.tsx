import { H2 } from '@components/Typography'

import { StudyPlan } from '@dts/study'
import useTheme from '@hooks/useTheme'
import Metrics from '@shared/Metrics'
import I18n from 'i18n-js'
import React, { useEffect, useRef } from 'react'
import { Animated, Platform, StyleSheet, View } from 'react-native'
import Markdown, { MarkdownProps } from 'react-native-markdown-renderer'

import AnimatedProgressButton from '../AnimatedProgressButton'

type Props = {
  activity: StudyPlan.TextAct
  onPressNext?: () => void
}

const ActivityText: React.FC<Props> = ({ activity, onPressNext }) => {
  const { color } = useTheme()
  const contentSize = useRef<number>(0)
  const listSize = useRef<number>(0)
  const progressButton = useRef<AnimatedProgressButton | null>(null)

  const markdownStyle = useThemeMarkdown()

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (contentSize.current - listSize.current < 10) {
        progressButton.current?.progress(1)
      }
    }, 250)
    return () => {
      clearTimeout(timeout)
    }
  }, [])

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        onLayout={e => {
          listSize.current = e.nativeEvent.layout.height
        }}
        onScroll={({ nativeEvent }) => {
          progressButton.current?.progress(
            (nativeEvent.contentOffset.y + nativeEvent.layoutMeasurement.height) / nativeEvent.contentSize.height,
          )
        }}
        scrollEventThrottle={16}
        style={[
          styles.scrollList,
          {
            backgroundColor: color.id === 'light' ? color.white : color.black,
          },
        ]}
        contentContainerStyle={styles.scrollListContent}
        onContentSizeChange={(width, height) => {
          contentSize.current = height
        }}>
        {activity.title ? (
          <H2 align="center" style={styles.title}>
            {activity.title}
          </H2>
        ) : null}
        {/*@ts-ignore*/}
        <Markdown style={markdownStyle}>{activity.content}</Markdown>
      </Animated.ScrollView>
      <AnimatedProgressButton
        ref={progressButton}
        text={I18n.t('text.Mark as read')}
        onPress={onPressNext}
        initialEnabled={false}
        hidden={!onPressNext}
        style={styles.buttonWrapper}
        color={color}
      />
    </View>
  )
}

const useThemeMarkdown = (): MarkdownProps['style'] => {
  const { color, typography } = useTheme()
  return React.useMemo(
    () => ({
      codeBlock: {
        borderColor: color.black2,
        backgroundColor: color.id === 'light' ? '#f5f5f5' : '#6f6f6f',
      },
      codeInline: {
        borderColor: color.black2,
        backgroundColor: color.id === 'light' ? '#f5f5f5' : '#6f6f6f',
      },
      del: {
        backgroundColor: color.contrast,
      },
      hr: {
        backgroundColor: color.contrast,
      },
      blockquote: {
        backgroundColor: color.black2,
      },
      table: {
        borderColor: color.contrast,
      },
      tableRow: {
        borderColor: color.contrast,
      },
      blocklink: {
        borderColor: color.contrast,
      },
      u: {
        borderColor: color.contrast,
      },
      heading: {
        color: color.text,
        fontWeight: '700',
      },
      heading1: {
        fontSize: typography.h1,
        lineHeight: typography.h1 * 1.4,
      },
      heading2: {
        fontSize: typography.h2,
        lineHeight: typography.h2 * 1.4,
      },
      heading3: {
        fontSize: typography.h3,
        lineHeight: typography.h3 * 1.4,
      },
      heading4: {
        fontSize: typography.subhead,
        lineHeight: typography.subhead * 1.4,
      },
      heading5: {
        fontSize: typography.footnote,
        lineHeight: typography.footnote * 1.4,
      },
      heading6: {
        fontSize: typography.small,
        lineHeight: typography.small * 1.4,
      },
      text: {
        color: color.text,
        fontSize: typography.body,
        lineHeight: typography.body * 1.4,
        fontWeight: '400',
        ...Platform.select({
          android: { fontFamily: 'Roboto' },
        }),
      },
    }),
    [color, typography],
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: Metrics.insets.horizontal,
  },
  scrollList: {
    flex: 1,
    marginBottom: Metrics.insets.horizontal,
    borderRadius: 20,
  },
  scrollListContent: {
    paddingHorizontal: 18,
    paddingVertical: 30,
  },
  buttonWrapper: {
    marginBottom: Metrics.insets.bottom,
    marginHorizontal: 0,
  },
  title: {
    marginVertical: 10,
  },
})

export default ActivityText
