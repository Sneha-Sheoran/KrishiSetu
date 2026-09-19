import { createBrowserClient } from '@supabase/ssr'

function isSupabaseConfigured(): boolean {
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

  order(column: string, { ascending = true } = {}) {
    return this
  }

  single() {
    this.isSingle = true
    return this.execute()
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
          data: { fields: this.selectFields, single: this.isSingle },
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
    return {
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
        return {
          on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
          subscribe: () => ({ unsubscribe: () => {} })
        }
      }
    } as any
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
