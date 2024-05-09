import React, { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import { Modalize } from 'react-native-modalize'
import { Metrics } from '@shared/index'
import { Footnote } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type IProps = {
  onClosed?: () => void
}

const FootnoteModal = (props: IProps) => {
  const modal = useRef(null)
  const insets = useSafeAreaInsets()
  const { color: theme } = useTheme()
  const [value, setValue] = useState([])

  // Component did mount
  useEffect(() => {
    // Open modal
    openModal()

    // Update text value
    setValue(props.route.params.value)
    // Component did unmount
    return () => {
      modal.current = undefined
    }
  }, [])

  const onClosed = () => {
    if (props.onClosed) {
      props.onClosed()
    }
    props.navigation.pop()
  }

  const openModal = () => {
    if (modal.current) {
      modal.current.open()
    }
  }

  const closeModal = () => {
    if (modal.current) {
      modal.current.close()
    }
  }

  const flattenFt = array => {
    if (!array) return
    let result = []
    for (item of array) {
      if (typeof item === 'object') result.push(...flattenFt(item.value || item.xt || item[item.type]))
      else if (typeof item === 'string') result.push(item)
    }
    return result
  }

  const renderFr = array => {
    return array.filter(i => i.type === 'fr').map(i => i.fr)
  }

  const renderFqa = array => {
    return array.map(i => i.fqa)
  }

  return (
    <Modalize
      ref={modal}
      onClosed={onClosed}
      adjustToContentHeight
      modalStyle={{ ...s.container, backgroundColor: theme.background }}
      withHandle={true}
    >
      <Footnote style={{ marginBottom: insets.bottom || 20 }}>
        †<Footnote style={{ fontWeight: 'bold' }}>{renderFr(value)}</Footnote>
        {flattenFt(value.filter(i => i.type === 'ft'))}
        <Text style={{ fontStyle: 'italic' }}>{renderFqa(value.filter(i => i.type === 'fqa'))}</Text>
      </Footnote>
    </Modalize>
  )
}

FootnoteModal.defaultProps = {}

const s = StyleSheet.create({
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: Metrics.insets.horizontal,
  },
})

export default FootnoteModal
