import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'

export async function getSheet(sheetTitle: string) {
  const serviceAccountAuth = new JWT({
    email: process.env.GCP_CLIENT_EMAIL,
    key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  })

  const doc = new GoogleSpreadsheet(process.env.SHEET_ID!, serviceAccountAuth)
  await doc.loadInfo()
  return doc.sheetsByTitle[sheetTitle]
}

export function parseNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0
  const str = String(val).replace(/,/g, '').trim()
  const num = parseFloat(str)
  return isNaN(num) ? 0 : num
}
