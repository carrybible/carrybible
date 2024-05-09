import { config } from 'firebase-functions'
import axios, { AxiosResponse } from 'axios'

const GLIDE_API_KEY: string = config().glide.apikey;
const GLIDE_URL = 'https://api.glideapp.io/api/function/mutateTables'
const GLIDE_APP_ID = "";

async function sendGlideRequest(payload: any) {
  let response: AxiosResponse

  try {

    const postConfig = {
      headers: { Authorization: `Bearer ${GLIDE_API_KEY}` }
    };

    response = await axios.post(GLIDE_URL, payload, postConfig);

    if (response.data) {
      return response.data
    }
  } catch (e) {
    if (axios.isAxiosError(e)) {
      if (e.response) {
        console.log("response error")
        // Request made and server responded
        console.log(e.response)
      } else if (e.request) {
        console.log("request error error")
        // The request was made but no response was received
        console.log(e.request);
      } else {
        console.log("something else error")
        // Something happened in setting up the request that triggered an Error
        console.log('Error', e.message);
      }
    }
  }
  return undefined
}

export async function addRowToGlide(newRow: any, tableName: string) {

  const payload = {
    "appID": GLIDE_APP_ID,
    "mutations": [
      {
        "kind": "add-row-to-table",
        "tableName": tableName,
        "columnValues": newRow
      }
    ]
  }

  const data = await sendGlideRequest(payload)
  const rowId = data[0].rowID
  if (rowId) {
    console.log(`Added row ${rowId} in Glide`)
    return rowId
  } else {
    throw new Error(`Error adding row to glide table ${tableName}`)
  }

}

export async function updateRowToGlide(rowId: string, updateValues: any, tableName: string) {

  const payload = {
    "appID": "mMG4dBNmvafHvKCuAlRV",
    "mutations": [
      {
        "kind": "set-columns-in-row",
        "tableName": tableName,
        "columnValues": updateValues,
        "rowID": rowId
      }
    ]
  }

  const data = await sendGlideRequest(payload)
  console.log(`Glide update result ${data}`)
  if (data) {
    console.log(`Updated row ${rowId} in Glide`)
    return rowId
  } else {
    throw new Error(`Error updating glide table ${tableName}`)
  }
}

export default {
  addRowToGlide,
  updateRowToGlide
}