import fs from 'fs'
import path from 'path'

export interface LocalUser {
  id: string
  email: string
  password?: string
  name: string
  phone: string
  role: 'FARMER' | 'BUYER' | 'ADMIN'
  verification_status?: string
  created_at: string
}

export interface LocalFarm {
  id: string
  farmer_id: string
  farm_name: string
  area: number
  area_unit: string
  state: string
  district: string
  village: string
  soil_type: string | null
  soil_ph: number | null
  irrigation_type: string | null
  created_at: string
}

export interface LocalBuyer {
  id: string
  user_id: string
  company_name?: string
  business_name?: string
  business_type?: string
  buyer_type?: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  state?: string
  district?: string
  gstin?: string
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  created_at: string
}

export interface LocalMarketplaceListing {
  id: string
  farmer_id: string
  crop_name: string
  variety?: string
  quantity: number
  unit: string
  expected_price: number
  quality_grade?: string
  harvest_date?: string
  location?: string
  location_text?: string
  description?: string
  status: 'ACTIVE' | 'SOLD' | 'CANCELLED'
  created_at: string
}

export interface LocalDbData {
  users: LocalUser[]
  farms: LocalFarm[]
  buyers: LocalBuyer[]
  marketplace_listings: LocalMarketplaceListing[]
  conversations: any[]
  messages: any[]
}

const DB_DIR = path.join(process.cwd(), 'data')
const DB_FILE = path.join(DB_DIR, 'local_db.json')

const INITIAL_DATA: LocalDbData = {
  users: [
    {
      id: 'd1e1f1a1-0001-4000-8000-000000000001',
      email: 'farmer@krishisetu.com',
      password: 'password123',
      name: 'Ramesh Patel',
      phone: '9876543210',
      role: 'FARMER',
      verification_status: 'VERIFIED',
      created_at: new Date().toISOString()
    },
    {
      id: 'd1e1f1a1-0002-4000-8000-000000000002',
      email: 'buyer@krishisetu.com',
      password: 'password123',
      name: 'Priya Sharma (AgroCorp)',
      phone: '9876543211',
      role: 'BUYER',
      verification_status: 'VERIFIED',
      created_at: new Date().toISOString()
    },
    {
      id: 'd1e1f1a1-0003-4000-8000-000000000003',
      email: 'admin@krishisetu.com',
      password: 'password123',
      name: 'KrishiSetu Admin',
      phone: '9876543212',
      role: 'ADMIN',
      verification_status: 'VERIFIED',
      created_at: new Date().toISOString()
    }
  ],
  farms: [
    {
      id: 'f1a1b1c1-0001-4000-8000-000000000001',
      farmer_id: 'd1e1f1a1-0001-4000-8000-000000000001',
      farm_name: 'Green Valley Farm',
      area: 5.0,
      area_unit: 'Acres',
      state: 'Maharashtra',
      district: 'Pune',
      village: 'Khed',
      soil_type: 'Black Soil (Regur)',
      soil_ph: 6.8,
      irrigation_type: 'Drip',
      created_at: new Date().toISOString()
    }
  ],
  buyers: [
    {
      id: 'b1a1b1c1-0001-4000-8000-000000000001',
      user_id: 'd1e1f1a1-0002-4000-8000-000000000002',
      company_name: 'AgroCorp Traders',
      business_name: 'AgroCorp Traders',
      business_type: 'Wholesaler',
      buyer_type: 'Wholesaler',
      contact_person: 'Priya Sharma',
      phone: '9876543211',
      email: 'buyer@krishisetu.com',
      state: 'Maharashtra',
      district: 'Pune',
      verification_status: 'VERIFIED',
      created_at: new Date().toISOString()
    }
  ],
  marketplace_listings: [
    {
      id: 'm1a1b1c1-0001-4000-8000-000000000001',
      farmer_id: 'd1e1f1a1-0001-4000-8000-000000000001',
      crop_name: 'Wheat (Sharbati)',
      variety: 'Sharbati A-Grade',
      quantity: 50,
      unit: 'Quintal',
      expected_price: 2450,
      location: 'Pune, Maharashtra',
      location_text: 'Pune, Maharashtra',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    },
    {
      id: 'm1a1b1c1-0002-4000-8000-000000000002',
      farmer_id: 'd1e1f1a1-0001-4000-8000-000000000001',
      crop_name: 'Soybean',
      variety: 'Yellow Gold',
      quantity: 30,
      unit: 'Quintal',
      expected_price: 4300,
      location: 'Pune, Maharashtra',
      location_text: 'Pune, Maharashtra',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    }
  ],
  conversations: [],
  messages: []
}

let memoryDb: LocalDbData = { ...INITIAL_DATA }

export function getLocalDb(): LocalDbData {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true })
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8')
      return INITIAL_DATA
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    return memoryDb
  }
}

export function saveLocalDb(data: LocalDbData) {
  memoryDb = data
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true })
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error('Failed to write local_db.json, using memory:', err)
  }
}

export class LocalQueryBuilder implements PromiseLike<any> {
  private tableName: string
  private filters: Array<(row: any) => boolean> = []
  private isSingle = false
  private selectFields = '*'
  private isHead = false
  private pendingInsertData: any = null
  private pendingUpdateData: any = null
  private isDelete = false

  constructor(tableName: string) {
    this.tableName = tableName
  }

  select(fields = '*', options?: { count?: string; head?: boolean }) {
    this.selectFields = fields
    if (options?.head) this.isHead = options.head
    return this
  }

  insert(data: any) {
    this.pendingInsertData = data
    return this
  }

  update(data: any) {
    this.pendingUpdateData = data
    return this
  }

  delete() {
    this.isDelete = true
    return this
  }

  eq(column: string, value: any) {
    this.filters.push((row) => String(row[column]) === String(value))
    return this
  }

  neq(column: string, value: any) {
    this.filters.push((row) => String(row[column]) !== String(value))
    return this
  }

  order(column: string, { ascending = true } = {}) {
    return this
  }

  single() {
    this.isSingle = true
    return this
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }

  private async execute(): Promise<any> {
    const db = getLocalDb()

    // Handle INSERT
    if (this.pendingInsertData !== null) {
      const rows = Array.isArray(this.pendingInsertData) ? this.pendingInsertData : [this.pendingInsertData]
      const inserted = rows.map((r) => ({
        id: r.id || crypto.randomUUID(),
        created_at: r.created_at || new Date().toISOString(),
        ...r
      }))

      const list = (((db as any)[this.tableName] || []) as any[]).slice()
      list.push(...inserted)
      ;(db as any)[this.tableName] = list
      saveLocalDb(db)

      const result = this.isSingle ? inserted[0] : (Array.isArray(this.pendingInsertData) ? inserted : inserted[0])
      return { data: result, error: null }
    }

    // Handle UPDATE
    if (this.pendingUpdateData !== null) {
      const list = (((db as any)[this.tableName] || []) as any[]).slice()
      let count = 0
      for (let i = 0; i < list.length; i++) {
        if (this.filters.every((f) => f(list[i]))) {
          list[i] = { ...list[i], ...this.pendingUpdateData, updated_at: new Date().toISOString() }
          count++
        }
      }
      ;(db as any)[this.tableName] = list
      saveLocalDb(db)
      return { data: null, count, error: null }
    }

    // Handle DELETE
    if (this.isDelete) {
      const list = (((db as any)[this.tableName] || []) as any[]).slice()
      ;(db as any)[this.tableName] = list.filter((r) => !this.filters.every((f) => f(r)))
      saveLocalDb(db)
      return { data: null, error: null }
    }

    // Handle SELECT
    let rows = (((db as any)[this.tableName] || []) as any[]).slice()
    for (const f of this.filters) {
      rows = rows.filter(f)
    }

    if (this.isHead) {
      return { data: null, count: rows.length, error: null }
    }

    if (this.isSingle) {
      const singleRow = rows[0] || null
      return { data: singleRow, count: singleRow ? 1 : 0, error: null }
    }

    return { data: rows, count: rows.length, error: null }
  }
}

export function createLocalServerClient(cookieStore: any) {
  return {
    auth: {
      async getUser() {
        const sessionCookie = cookieStore.get('krishi_session')
        if (!sessionCookie?.value) {
          return { data: { user: null }, error: null }
        }

        const db = getLocalDb()
        const user = db.users.find((u) => u.id === sessionCookie.value || u.email === sessionCookie.value)
        if (!user) {
          return { data: { user: null }, error: null }
        }

        return {
          data: {
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              user_metadata: {
                role: user.role,
                full_name: user.name,
                name: user.name,
                phone: user.phone
              },
              phone: user.phone
            }
          },
          error: null
        }
      },

      async signInWithPassword({ email, password }: { email: string; password?: string }) {
        const db = getLocalDb()
        const trimmedEmail = email.trim().toLowerCase()
        const user = db.users.find((u) => u.email.toLowerCase() === trimmedEmail)

        if (!user) {
          return {
            data: { user: null, session: null },
            error: { message: 'No account found with this email. Please register first.' }
          }
        }

        if (user.password && password && user.password !== password) {
          return {
            data: { user: null, session: null },
            error: { message: 'Incorrect password. Please try again.' }
          }
        }

        cookieStore.set('krishi_session', user.id, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7
        })

        return {
          data: {
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              user_metadata: { role: user.role, full_name: user.name, name: user.name, phone: user.phone },
              phone: user.phone
            },
            session: { access_token: 'local-session-token' }
          },
          error: null
        }
      },

      async signUp({
        email,
        password,
        options
      }: {
        email: string
        password?: string
        options?: { data?: { role?: string; full_name?: string; name?: string; phone?: string } }
      }) {
        const db = getLocalDb()
        const trimmedEmail = email.trim().toLowerCase()
        const existing = db.users.find((u) => u.email.toLowerCase() === trimmedEmail)

        if (existing) {
          return {
            data: { user: null, session: null },
            error: { message: 'An account with this email already exists. Please log in.' }
          }
        }

        const newUser: LocalUser = {
          id: crypto.randomUUID(),
          email: trimmedEmail,
          password: password || 'password123',
          name: options?.data?.full_name || options?.data?.name || trimmedEmail.split('@')[0],
          phone: options?.data?.phone || '',
          role: (options?.data?.role as any) || 'FARMER',
          verification_status: 'VERIFIED',
          created_at: new Date().toISOString()
        }

        db.users.push(newUser)
        saveLocalDb(db)

        cookieStore.set('krishi_session', newUser.id, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7
        })

        return {
          data: {
            user: {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
              role: newUser.role,
              user_metadata: { role: newUser.role, full_name: newUser.name, name: newUser.name, phone: newUser.phone },
              phone: newUser.phone
            },
            session: { access_token: 'local-session-token' }
          },
          error: null
        }
      },

      async signOut() {
        cookieStore.delete('krishi_session')
        return { error: null }
      }
    },

    from(tableName: string) {
      return new LocalQueryBuilder(tableName)
    },

    channel(name: string) {
      return {
        on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
        subscribe: () => ({ unsubscribe: () => {} })
      }
    }
  }
}
