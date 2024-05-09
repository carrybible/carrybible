import Firebase from '@shared/Firebase/index'
import { uploadString, ref, getDownloadURL } from 'firebase/storage'

export const uploadBase64Image = async (
  userId: string,
  storageFolder: string,
  storageFileName: string,
  data: string
) => {
  const storage = Firebase.storage
  const storageRef = ref(
    storage,
    `${storageFolder}/${userId}/${storageFileName}`
  )
  const file = await uploadString(storageRef, data, 'data_url')
  const downloadUrl = await getDownloadURL(file.ref)
  return downloadUrl
}
