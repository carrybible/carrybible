import { Text } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import I18n from 'i18n-js'
import React, { useEffect, useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import BookTitle from './BookTitle'
import Chapter, { ChapterItemProps } from './Chapter'
import styles from './styles'

type IProps = {
  isChoosen: boolean
  isRefine: boolean
  title: string
  chapters: Array<ChapterItemProps>
  onPress: (arg0: any) => void
  onPressRefine: () => void
  onChapterChange: (arg0: any) => void
}

const BookItem: React.FC<IProps> = props => {
  const { color: theme } = useTheme()
  const [currentChapter, setCurrentChapter] = useState(() => {
    return {
      start: 0,
      end: props.chapters?.length - 1,
    }
  })

  useEffect(() => {
    const newChoosen = {
      start: 0,
      end: props.chapters?.length - 1,
    }
    setCurrentChapter(newChoosen)
    props.onChapterChange(newChoosen)
  }, [props.chapters])

  const onPressChapter = index => {
    let { start, end } = currentChapter
    if (end != -1) {
      start = index
      end = -1
    } else if (index < start) {
      start = index
    } else {
      end = index
    }

    setCurrentChapter({ start, end })
    props.onChapterChange({ start, end })
  }

  const handleOnPress = () => {
    props.onPress(currentChapter)
  }

  return (
    <View style={styles.cover}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleOnPress}
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            borderColor: props.isChoosen ? theme.accent : theme.gray5,
          },
        ]}>
        <BookTitle name={props.title} expanded={props.isRefine} highlighted={props.isChoosen} />

        {props.isChoosen ? (
          <TouchableOpacity onPress={props.onPressRefine}>
            <View style={s.rightText}>
              <Text style={[{ color: theme.accent }, s.text]}>
                {props.isRefine ? I18n.t('text.Choose chapters') : I18n.t('text.Refine')}
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
      {props.isChoosen && props.isRefine ? (
        <>
          <Chapter
            chapters={props.chapters}
            onPressChapter={onPressChapter}
            startChapter={currentChapter.start}
            endChapter={currentChapter.end}
          />
        </>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  rightText: { height: 50, width: 170, paddingHorizontal: 15, justifyContent: 'center', alignItems: 'flex-end' },
  text: { textAlign: 'right' },
})

export default BookItem
