import { NextResponse } from 'next/server'
import { getSheet, parseNumber } from '@/lib/sheets'

export async function GET() {
  try {
    const sheet = await getSheet('summary')
    const rows = await sheet.getRows()

    const monthly: { label: string; year: number; month: number; asset: number; profit: number; rate: number }[] = []
    let currentYear = 0

    for (const row of rows) {
      const yearRaw = String(row.get('연도') || '').trim()
      const monthRaw = String(row.get('월') || '').trim()
      const assetRaw = row.get('자산')
      const profitRaw = row.get('수익금')
      const rateRaw = row.get('수익률')

      if (yearRaw) {
        const y = parseInt(yearRaw.replace('년', ''))
        if (!isNaN(y)) currentYear = y
      }
      if (!currentYear) continue

      const month = parseInt(monthRaw.replace('월', ''))
      const asset = parseNumber(assetRaw)
      const profit = parseNumber(profitRaw)
      const rate = parseNumber(rateRaw)

      if (!isNaN(month) && asset > 0) {
        monthly.push({
          label: `${currentYear}년 ${String(month).padStart(2, '0')}월`,
          year: currentYear,
          month,
          asset,
          profit,
          rate,
        })
      }
    }

    return NextResponse.json({ monthly })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
