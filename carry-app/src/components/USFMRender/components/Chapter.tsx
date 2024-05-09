import React from 'react'
import { StyleSheet, View } from 'react-native'
import { H1 } from '@components/Typography'
import i18n from '@assets/i18n'
import { UsfmReader } from '../../../shared'

type IProps = {
  chapter?: number
  rootID?: number
  version?: string
  content?: string
  text?: string
}

function Chapter(props: IProps) {
  return (
    <View style={styles.container}>
      <H1 align="center" style={styles.chapterText}>
        {/* {`${i18n.t(`book.${UsfmReader.getBookFromChapter(props.rootID)}`)} `} */}
        {(props?.text?.split(' ')?.length || 1) >= 2 ? props.text : props.chapter}
      </H1>
    </View>
  )
}

Chapter.defaultProps = {
  chapter: 0,
}

const styles = StyleSheet.create({
  container: {
    marginTop: 35,
    marginBottom: 25,
    alignContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  chapterText: {
    textAlign: 'center',
  },
})

export default React.memo<IProps>(Chapter)
