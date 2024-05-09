let uuid = new Date().getTime()

export default function getUniqueID() {
  uuid += 1
  return `usfm_${uuid.toString(16)}`
}
