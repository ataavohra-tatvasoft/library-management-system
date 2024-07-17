/* eslint-disable camelcase */
import { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'
// import axios from 'axios'
import { envConfig } from '../config'
import { HttpError } from '../libs'
import { httpStatusConstant, messageConstant } from '../constant'

const authorize = async (): Promise<OAuth2Client> => {
  const oAuth2Client = new OAuth2Client(
    String(envConfig.googleClientID),
    String(envConfig.googleClientSecret),
    String(envConfig.googleRedirectUri)
  )

  /** Below code stopped working for authorization due to changes and updations from Google Cloud Console, will find new way to authorize it from backend */

  // const responseTokens = await axios.post(String(envConfig.googleTokenPath), {
  //   client_secret: String(envConfig.googleClientSecret),
  //   grant_type: 'refresh_token',
  //   refresh_token: String(envConfig.googleRefreshToken),
  //   client_id: String(envConfig.googleClientID)
  // })

  // if (!responseTokens) {
  //   throw new HttpError(
  //     messageConstant.ERROR_FETCHING_TOKEN,
  //     httpStatusConstant.INTERNAL_SERVER_ERROR
  //   )
  // }

  // const tokens = {
  //   access_token: responseTokens.data.access_token
  // }

  /**Currently below is working by getting token from OAuth 2.0 Playground*/
  const tokens = {
    access_token: String(envConfig.googleAccessToken)
  }

  if (tokens) {
    oAuth2Client.setCredentials(tokens)
  } else {
    /** Below code stopped working for authorization due to changes and updations from Google Cloud Console, will find new way to authorize it from backend */
    // const authorizationUrl = oAuth2Client.generateAuthUrl({
    //   access_type: 'offline',
    //   scope: responseTokens.data.scope
    // })
    // console.log('Authorize this app by visiting this url:', authorizationUrl)
  }

  return oAuth2Client
}

const fetchSheetData = async (spreadsheetId: string, range: string): Promise<any> => {
  const auth = await authorize()
  const sheets = google.sheets({ version: 'v4', auth })

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range
  })

  return response.data.values
}

const getSheetName = async (spreadsheetId: string, sheetname: string): Promise<string> => {
  const auth = await authorize()

  const sheets = google.sheets({ version: 'v4', auth })

  const response = await sheets.spreadsheets.get({
    spreadsheetId
  })

  if (response.data.properties?.title != sheetname) {
    throw new HttpError(messageConstant.INVALID_SHEET_NAME, httpStatusConstant.BAD_REQUEST)
  }

  if (!response.data.sheets || response.data.sheets.length === 0) {
    throw new HttpError(messageConstant.SHEET_NOT_FOUND, httpStatusConstant.NOT_FOUND)
  }
  return response.data.sheets[0].properties?.title || 'sample'
}

const appendDataToSheet = async (
  auth: OAuth2Client,
  sheetID: string,
  range: string,
  values: any[][]
) => {
  const sheets = google.sheets({ version: 'v4', auth })
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: sheetID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  })

  return response.status === 200
}

const clearSheet = async (auth: OAuth2Client, sheetID: string, sheetName: string) => {
  const sheets = google.sheets({ version: 'v4', auth })
  await sheets.spreadsheets.values.clear({
    spreadsheetId: sheetID,
    range: `${sheetName}!A:Z`
  })
}

const updateColumnWidths = async (
  auth: OAuth2Client,
  sheetID: string,
  columnWidthUpdates: {
    startIndex: number
    endIndex: number
    pixelSize: number
  }[]
) => {
  const sheets = google.sheets({ version: 'v4', auth })
  const requests = columnWidthUpdates.map((update) => ({
    updateDimensionProperties: {
      range: {
        sheetId: 0,
        dimension: 'COLUMNS',
        startIndex: update.startIndex,
        endIndex: update.endIndex
      },
      properties: { pixelSize: update.pixelSize },
      fields: 'pixelSize'
    }
  }))

  return await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetID,
    requestBody: { requests }
  })
}

export default {
  authorize,
  fetchSheetData,
  getSheetName,
  appendDataToSheet,
  clearSheet,
  updateColumnWidths
}
