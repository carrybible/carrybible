import React from 'react'
import { StyleSheet, View } from 'react-native'
import { H1 } from '@components/Typography'
// import { UsfmReader } from '../../../shared'

type IProps = {
  chapter?: string
  rootID?: number
  version?: string
}

function Book(props: IProps) {
  return (
    <View style={styles.container}>
      <H1 align="center" style={styles.chapterText}>
        {/* {`${i18n.t(`book.${UsfmReader.getBookFromChapter(props.rootID)}`)} `} */}
        {`${props.chapter}`}
      </H1>
    </View>
  )
}

Book.defaultProps = {
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

export default React.memo<IProps>(Book)
