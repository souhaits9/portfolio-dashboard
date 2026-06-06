import { NextResponse } from 'next/server'
import { getSheet, parseNumber } from '@/lib/sheets'

export async function GET() {
  try {
    const sheet = await getSheet('현기준')
    const rows = await sheet.getRows()

    const accounts: Record<string, number> = {}
    const stocks: any[] = []
    let currentAccount = ''

    for (const row of rows) {
      const acct = String(row.get('계좌') || '').trim()
      const name = String(row.get('종목') || '').trim()
      const code = String(row.get('종목코드') || '').trim()
      const qty = parseNumber(row.get('주식수'))
      const price = parseNumber(row.get('현재주식가격'))
      const value = parseNumber(row.get('현재 가치'))
      const totalStr = String(row.get('연금 총액') || '').trim()
      const todayChange = parseNumber(row.get('자산 변동'))

      if (acct) currentAccount = acct

      if (totalStr && !isNaN(parseFloat(totalStr.replace(/,/g, ''))) && acct) {
        accounts[acct] = parseNumber(totalStr)
      }

      if (!name || name === '안전자산비율' || name === '현금1') continue
      if (!currentAccount) continue

      stocks.push({
        account: currentAccount,
        name,
        code,
        qty,
        price,
        value: value > 0 ? value : qty * price,
        todayChange,
      })
    }

    // 계좌별 집계
    const accountSummary = Object.entries(
      stocks.reduce((acc, s) => {
        if (!acc[s.account]) acc[s.account] = { value: 0, todayChange: 0, count: 0 }
        acc[s.account].value += s.value
        acc[s.account].todayChange += s.todayChange
        acc[s.account].count++
        return acc
      }, {} as Record<string, { value: number; todayChange: number; count: number }>)
    ).map(([account, data]) => ({ account, value: (data as any).value, todayChange: (data as any).todayChange, count: (data as any).count }))

    const totalValue = stocks.reduce((s, x) => s + x.value, 0)
    const totalTodayChange = stocks.reduce((s, x) => s + x.todayChange, 0)

    // 종목별 집계
    const stockSummary = Object.entries(
      stocks.reduce((acc, s) => {
        if (!acc[s.name]) acc[s.name] = { value: 0, todayChange: 0 }
        acc[s.name].value += s.value
        acc[s.name].todayChange += s.todayChange
        return acc
      }, {} as Record<string, { value: number; todayChange: number }>)
    )
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value)

    return NextResponse.json({
      totalValue,
      totalTodayChange,
      accountSummary,
      stockSummary,
      stocks,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
