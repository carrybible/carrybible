import Container from '@components/Container'
import React from 'react'
import { StatusBar } from 'react-native'

interface Props {
  children: any
}

const StartBackground: React.FC<Props> = props => {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <Container safe>{props.children}</Container>
    </>
  )
}

export default StartBackground
