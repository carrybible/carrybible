import auth from '@react-native-firebase/auth'
import storage from '@react-native-firebase/storage'
import ImageResizer from 'react-native-image-resizer'

export async function uploadFile(localPath: string, storageFolder: string, storageFileName: string, resize = true) {
  let uri = localPath
  if (resize) {
    const res = await ImageResizer.createResizedImage(localPath, 500, 500, 'PNG', 70, 0)
    uri = res.uri
  }
  const currentUser = auth().currentUser
  const storageRef = storage().ref()
  const fileRef = `${storageFolder}/${currentUser!.uid}/${storageFileName}`
  await storageRef.child(fileRef).putFile(uri)
  return await storage().ref(fileRef).getDownloadURL()
}

export default {
  upload: uploadFile,
}
