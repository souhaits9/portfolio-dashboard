import { NextResponse } from 'next/server'
import { getSheet, parseNumber } from '@/lib/sheets'

export async function GET() {
  try {
    const sheet = await getSheet('현기준')
    // M18:P30 범위 읽기
    await sheet.loadCells('M18:P30')

    const rows = []
    for (let r = 17; r <= 29; r++) {
      const name = String(sheet.getCell(r, 12).value || '').trim()
      if (!name || name === '구분' || name === '총액') continue
      const amount = parseNumber(sheet.getCell(r, 13).value)
      const current = parseNumber(sheet.getCell(r, 14).value)
      const target = parseNumber(sheet.getCell(r, 15).value)
      if (amount > 0) {
        rows.push({
          name,
          amount,
          current,
          target,
          diff: parseFloat((current - target).toFixed(2)),
        })
      }
    }

    return NextResponse.json({ allocations: rows })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
