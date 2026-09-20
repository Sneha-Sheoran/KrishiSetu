import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 })
  }

  try {
    const { table, action, data, filter } = await req.json()
    const supabase = await createClient()

    if (action === 'insert') {
      const res = await supabase.from(table).insert(data)
      return NextResponse.json(res)
    }

    if (action === 'select') {
      let query: any = supabase.from(table).select(data?.fields || '*')
      if (filter) {
        for (const key of Object.keys(filter)) {
          query = query.eq(key, filter[key])
        }
      }
      if (data?.order?.column) {
        query = query.order(data.order.column, { ascending: data.order.ascending ?? true })
      }
      if (typeof data?.limit === 'number') {
        query = query.limit(data.limit)
      }
      if (data?.single) {
        const res = await query.single()
        return NextResponse.json(res)
      }
      const res = await query
      return NextResponse.json(res)
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
