import { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'
import { envConfig } from '../config'
import axios from 'axios'

const authorize = async (): Promise<OAuth2Client> => {
  const oAuth2Client = new OAuth2Client(
    String(envConfig.googleClientID),
    String(envConfig.googleClientSecret),
    String(envConfig.googleRedirectUri)
  )

  const responseTokens = await axios.post(String(envConfig.googleTokenPath), {
    // eslint-disable-next-line camelcase
    client_id: String(envConfig.googleClientID),
    // eslint-disable-next-line camelcase
    client_secret: String(envConfig.googleClientSecret),
    // eslint-disable-next-line camelcase
    refresh_token: String(envConfig.googleRefreshToken),
    // eslint-disable-next-line camelcase
    grant_type: 'refresh_token'
  })

  if (!responseTokens) {
    throw new Error('Error fetching tokens')
  }
  const tokens = {
    // eslint-disable-next-line camelcase
    access_token: responseTokens.data.access_token
  }

  if (tokens) {
    oAuth2Client.setCredentials(tokens)
  } else {
    const authorizationUrl = oAuth2Client.generateAuthUrl({
      // eslint-disable-next-line camelcase
      access_type: 'offline', // Request a refresh token
      scope: responseTokens.data.scope
    })

    console.log('Authorize this app by visiting this url:', authorizationUrl)
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

export default {
  authorize,
  fetchSheetData
}
