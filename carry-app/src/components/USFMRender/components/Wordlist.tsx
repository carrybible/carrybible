import React from 'react'
import { StyleSheet } from 'react-native'
import { Text } from '@components/Typography'

type IProps = {
  value: any
  style: any
}

const Wordlist = (props: IProps) => {
  const [text, strong] = props.value[0].split('|')
  const _handleOnPress = () => {
    const { value } = props
    //Navigator.navigate('FootnoteModal', { value })
  }

  return <Text style={props.style}>{`${text} `}</Text>
}

const s = StyleSheet.create({
  container: {
    fontWeight: '800',
    letterSpacing: -0.75,
  },
})

export default Wordlist
