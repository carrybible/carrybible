import React from 'react'
import { StyleSheet } from 'react-native'
import { Footnote as Foot } from '@components/Typography'
import { Constants } from '@shared/index'
import { NavigationRoot } from '@scenes/root'

type IProps = {
  value: any
  style: any
}

const Footnote = (props: IProps) => {
  const _handleOnPress = () => {
    const { value } = props
    NavigationRoot.navigate(Constants.SCENES.MODAL.FOOTNOTE, { value })
  }

  return (
    <Foot color="accent" style={{ ...s.container, ...props.style }} onPress={_handleOnPress}>
      {` ｢ † ｣ `}
    </Foot>
  )
}

const s = StyleSheet.create({
  container: {
    fontWeight: '800',
    letterSpacing: -0.75,
  },
})

export default Footnote
