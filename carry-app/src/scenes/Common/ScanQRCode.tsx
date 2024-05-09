import Button from '@components/Button'
import Container from '@components/Container'
import { Text } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import { NavigationRoot } from '@scenes/root'
import { wait } from '@shared/Utils'
import React, { FC, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { BarCodeReadEvent, RNCamera } from 'react-native-camera'

type Params = { onSuccess?: (e: string) => void }
type Props = StackScreenProps<{ ScanQRCode: Params }, 'ScanQRCode'>

const ScanQRCode: FC<Props> = props => {
  const { color } = useTheme()
  const { onSuccess } = props.route.params

  useEffect(() => {
    checkPermission()
  }, [])

  const checkPermission = async () => {
    // const cameraPermission = await Camera.getCameraPermissionStatus()
    // if (cameraPermission !== 'authorized') await Camera.requestCameraPermission()
  }

  const onRead = async (event: BarCodeReadEvent) => {
    devLog('[Found QR Code]', JSON.stringify(event))
    NavigationRoot.pop()
    await wait(500)
    onSuccess?.(event.data)
  }

  return (
    <Container safe>
      <RNCamera captureAudio={false} style={s.camera} onBarCodeRead={onRead} />
      <Text color={'background'} style={s.label}>
        {'Scanning...'}
      </Text>
      <View style={[s.header, { backgroundColor: color.background }]}>
        <Button.Icon icon="x" size={35} color={color.text} onPress={() => NavigationRoot.pop()} />
      </View>
    </Container>
  )
}

const s = StyleSheet.create({
  header: {
    position: 'absolute',
    backgroundColor: 'white',
    height: 60,
    width: 60,
    borderRadius: 30,
    bottom: 50,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  label: {
    position: 'absolute',
    borderRadius: 30,
    bottom: 120,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default ScanQRCode
