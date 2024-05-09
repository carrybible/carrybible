import BookItem from '@components/BookItem'
import BottomButton from '@components/BottomButton'
import Loading from '@components/Loading'
import ModalHeader from '@components/ModalHeader'
import { StudyPlan } from '@dts/study'
import { useBibleBooks } from '@hooks/useBible'
import useLayoutAnimation from '@hooks/useLayoutAnimations'
import I18n from 'i18n-js'
import React, { useCallback } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'

type Book = { id: number; abbr: string; name: string; chapters: number }

const ChooseBookChapter = ({
  chapter,
  setChapter,
  onNextPress,
}: {
  chapter?: StudyPlan.StudyChapter
  setChapter: (newChapter: Partial<StudyPlan.StudyChapter>) => void
  onNextPress: () => void
}) => {
  const { custom } = useLayoutAnimation()
  const [data, loading] = useBibleBooks()

  const handlePressChapter = useCallback(
    selectedChapter => {
      setChapter({
        chapterId: selectedChapter.id,
        chapterNumber: selectedChapter.number,
      })
    },
    [setChapter],
  )

  const renderItem = useCallback(
    ({ item }: { item: Book }) => {
      const handlePress = () => {
        custom()
        setChapter({
          bookId: item.id,
          bookName: item.name,
          bookAbbr: item.abbr,
          chapterId: undefined,
          chapterNumber: undefined,
        })
      }
      return (
        <BookItem.Single
          name={item.name}
          chapters={item.chapters}
          currentChapter={item.abbr === chapter?.bookAbbr ? chapter?.chapterNumber : -1}
          currentBook={chapter?.bookAbbr}
          bookId={item.abbr}
          selected={item.abbr === chapter?.bookAbbr}
          expanded={item.abbr === chapter?.bookAbbr}
          onPress={handlePress}
          onChapterPress={handlePressChapter}
        />
      )
    },
    [chapter, custom, setChapter, handlePressChapter],
  )

  return (
    <View style={styles.flex}>
      <ModalHeader
        handlePosition="inside"
        title={chapter?.bookName ? I18n.t('text.Choose a chapter') : I18n.t('text.Ic Choose a book')}
        style={styles.modalHeader}
      />
      <FlatList
        initialScrollIndex={loading ? 0 : Math.max((chapter?.bookId || 0) - 2, 0)}
        data={loading ? [] : data}
        renderItem={renderItem}
        contentContainerStyle={styles.listBook}
        ListEmptyComponent={<Loading />}
        keyExtractor={item => item.id.toString()}
        extraData={chapter}
      />
      <BottomButton title={I18n.t('text.Next')} rounded onPress={onNextPress} disabled={chapter?.chapterId == null} />
    </View>
  )
}

const styles = StyleSheet.create({
  listBook: {
    paddingBottom: 20,
  },
  flex: {
    flex: 1,
  },
  modalHeader: {
    borderBottomWidth: 0,
  },
})

export default ChooseBookChapter
