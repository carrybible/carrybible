import BookItem from '@components/BookItem'
import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import Loading from '@components/Loading'
import { useBibleBooks } from '@hooks/useBible'
import useLayoutAnimations from '@hooks/useLayoutAnimations'
import useTheme from '@hooks/useTheme'
import { Constants, Utils } from '@shared/index'
import I18n from 'i18n-js'
import React, { useMemo, useState } from 'react'
import { View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'

interface Props {
  navigation: any
  route: any
}

const ChooseABook: React.FC<Props> = props => {
  const anim = useLayoutAnimations()
  const [choosenBook, setChoosenBook] = useState<any>(null)
  const [isRefine, setRefine] = useState(false)
  const [choosenChapter, setChoosenChapter] = useState<any>({ start: 0, end: 0 })
  const { color: theme } = useTheme()
  const [data, loading] = useBibleBooks()

  const chapters = useMemo(() => {
    if (!choosenBook?.id) return []
    setChoosenChapter({ start: 0, end: choosenBook.chapters - 1 })
    return Array.from({ length: choosenBook.chapters }, (_, i) => ({
      id: i + 1,
      rootId: Utils.getRootID(choosenBook.id, i + 1, 0),
      bookId: choosenBook.id,
      number: i + 1,
      title: `${i + 1}`,
    }))
  }, [choosenBook])

  const handlePressRight = () => {
    const choosenChapterEnd = choosenChapter.end === -1 ? choosenChapter.start : choosenChapter.end
    props.navigation.navigate(Constants.SCENES.STUDY_PLAN.QUICK_STUDY_SETTING, {
      ...props.route.params,
      from: chapters[choosenChapter.start],
      to: chapters[choosenChapterEnd],
      chapters: chapters.filter((value, index) => {
        if (index >= choosenChapter.start && index <= choosenChapterEnd) return true
        return false
      }),
      book: choosenBook,
    })
  }

  const renderItem = ({ item }) => {
    return (
      <BookItem.Range
        title={item.name}
        chapters={chapters} //item.chapters}
        isChoosen={choosenBook?.id === item.id}
        isRefine={isRefine}
        onPressRefine={() => {
          anim.custom()
          setRefine(!isRefine)
        }}
        onPress={chapter => {
          anim.linear()
          setChoosenBook(item)
          setChoosenChapter(chapter)
        }}
        onChapterChange={values => {
          setChoosenChapter(values)
        }}
      />
    )
  }

  const keyExtractor = item => `${item.id}`
  // eslint-disable-next-line react-native/no-inline-styles
  const Separator = () => <View style={{ height: 15 }} />

  return (
    <Container safe>
      <HeaderBar
        title={I18n.t('text.Choose what to read')}
        iconLeft={'chevron-left'}
        iconLeftSize={28}
        colorLeft={theme.text}
        onPressLeft={() => {
          props.navigation.pop()
        }}
        textRight={I18n.t('text.Next')}
        colorRight={theme.accent}
        onPressRight={handlePressRight}
        disableRight={choosenBook == null}
        borderedBottom
      />
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={loading ? <Loading /> : Separator}
      />
    </Container>
  )
}

export default ChooseABook
