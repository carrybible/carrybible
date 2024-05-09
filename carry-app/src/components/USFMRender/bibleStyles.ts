import { StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  root: {},
  view: {},
  /* paragraph: {
    marginTop: 10,
    marginBottom: 10,
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  }, */
  verse: {
    lineHeight: 30,
  },
  text: {
    lineHeight: 30,
  },
  chapter: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  chapterText: {
    color: 'yellow',
    fontSize: 24,
  },
  mt1: {
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 25,
    marginBottom: -15,
    opacity: 0.8,
    // textTransform: 'uppercase',
  },
  wj: {},
  nd: {
    fontStyle: 'italic',
    textTransform: 'uppercase',
  },
  d: {
    lineHeight: 20,
    fontStyle: 'italic',
    marginHorizontal: 80,
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 20,
  },
})

export default styles
