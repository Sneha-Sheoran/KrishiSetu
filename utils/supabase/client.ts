import { createBrowserClient } from '@supabase/ssr'

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!(
    url &&
    key &&
    url.trim() !== '' &&
    key.trim() !== '' &&
    !url.includes('placeholder') &&
    !url.includes('dummy') &&
    url.startsWith('http')
  )
}

class ClientQueryBuilder {
  private tableName: string
  private filters: Record<string, any> = {}
  private selectFields = '*'
  private isSingle = false
  private limitValue: number | null = null
  private sortColumn: string | null = null
  private sortAscending = true

  constructor(tableName: string) {
    this.tableName = tableName
  }

  select(fields = '*') {
    this.selectFields = fields
    return this
  }

  eq(column: string, value: any) {
    this.filters[column] = value
    return this
  }

  neq(_column: string, _value: any) {
    return this
  }

  gte(_column: string, _value: any) {
    return this
  }

  lte(_column: string, _value: any) {
    return this
  }

  ilike(_column: string, _pattern: string) {
    return this
  }

  or(_conditions: string) {
    return this
  }

  in(_column: string, _values: any[]) {
    return this
  }

  is(_column: string, _value: any) {
    return this
  }

  not(_column: string, _operator: string, _value: any) {
    return this
  }

  order(column: string, { ascending = true } = {}) {
    this.sortColumn = column
    this.sortAscending = ascending
    return this
  }

  limit(n: number) {
    this.limitValue = n
    return this
  }

  range(_from: number, _to: number) {
    return this
  }

  single() {
    this.isSingle = true
    return this
  }

  maybeSingle() {
    this.isSingle = true
    return this
  }

  async insert(data: any) {
    try {
      const res = await fetch('/api/local-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: this.tableName,
          action: 'insert',
          data
        })
      })
      return await res.json()
    } catch (err: any) {
      return { data: null, error: { message: err.message } }
    }
  }

  async update(_data: any) {
    return { data: null, error: null }
  }

  async delete() {
    return { data: null, error: null }
  }

  async upsert(data: any) {
    return this.insert(data)
  }

  then(onfulfilled?: any, onrejected?: any) {
    return this.execute().then(onfulfilled, onrejected)
  }

  private async execute() {
    try {
      const res = await fetch('/api/local-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: this.tableName,
          action: 'select',
          data: {
            fields: this.selectFields,
            single: this.isSingle,
            limit: this.limitValue,
            order: this.sortColumn ? { column: this.sortColumn, ascending: this.sortAscending } : undefined
          },
          filter: this.filters
        })
      })
      return await res.json()
    } catch (err: any) {
      return { data: this.isSingle ? null : [], error: { message: err.message } }
    }
  }
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Supabase is not configured. Local DB shim is disabled in production.')
    }
    return {
      isShim: true,
      auth: {
        async getUser() {
          try {
            const res = await fetch('/api/auth/me')
            const json = await res.json()
            return { data: { user: json.user || null }, error: null }
          } catch (err) {
            return { data: { user: null }, error: null }
          }
        },
        async signOut() {
          const { logout } = await import('@/app/actions/auth')
          await logout()
          return { error: null }
        }
      },
      from(table: string) {
        return new ClientQueryBuilder(table)
      },
      channel(name: string) {
        const fakeChannel = {
          topic: name,
          on: () => fakeChannel,
          subscribe: (callback?: any) => {
            if (typeof callback === 'function') callback('SUBSCRIBED')
            return fakeChannel
          },
          unsubscribe: () => Promise.resolve('ok')
        }
        return fakeChannel
      },
      removeChannel: async (channel: any) => {
        if (channel && typeof channel.unsubscribe === 'function') {
          channel.unsubscribe()
        }
        return Promise.resolve('ok')
      }
    } as any
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
