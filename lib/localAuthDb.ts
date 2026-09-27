/* eslint-disable @typescript-eslint/no-explicit-any */
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

export interface LocalBuyerRequirement {
  id: string
  buyer_id: string
  crop: string
  required_quantity: number
  unit: string
  target_price: number
  required_by?: string | null
  location: string
  status: 'ACTIVE' | 'FULFILLED' | 'CANCELLED'
  created_at: string
}

export interface LocalCrop {
  id: string
  farm_id?: string | null
  farmer_id: string
  crop_name: string
  variety?: string | null
  season?: string | null
  sowing_date?: string | null
  expected_harvest_date?: string | null
  actual_harvest_date?: string | null
  area?: number | null
  expected_yield?: number | null
  actual_yield?: number | null
  status: 'PLANTED' | 'HARVESTED' | 'FAILED'
  created_at: string
}

export interface LocalHarvest {
  id: string
  farmer_id: string
  crop_id: string
  harvest_date: string
  quantity: number
  unit: string
  quality_grade?: string | null
  created_at: string
}

export interface LocalTransaction {
  id: string
  farmer_id: string
  direction: 'IN' | 'OUT'
  amount: number
  category: string
  transaction_date: string
  description?: string | null
  related_crop_id?: string | null
  receipt_image_url?: string | null
  source: 'manual' | 'ocr'
  ocr_metadata?: any | null
  created_at: string
}

export interface LocalDbData {
  users: LocalUser[]
  farms: LocalFarm[]
  buyers: LocalBuyer[]
  marketplace_listings: LocalMarketplaceListing[]
  conversations: any[]
  messages: any[]
  buyer_requirements: LocalBuyerRequirement[]
  transactions: any[]
  farm_transactions: LocalTransaction[]
  crops: LocalCrop[]
  harvests: LocalHarvest[]
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
  messages: [],
  buyer_requirements: [],
  transactions: [],
  farm_transactions: [],
  crops: [],
  harvests: []
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
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed.buyer_requirements)) {
      parsed.buyer_requirements = []
    }
    if (!Array.isArray(parsed.transactions)) {
      parsed.transactions = []
    }
    if (!Array.isArray(parsed.farm_transactions)) {
      parsed.farm_transactions = []
    }
    if (!Array.isArray(parsed.crops)) {
      parsed.crops = []
    }
    if (!Array.isArray(parsed.harvests)) {
      parsed.harvests = []
    }
    if (!Array.isArray(parsed.conversations)) {
      parsed.conversations = []
    }
    if (!Array.isArray(parsed.messages)) {
      parsed.messages = []
    }
    if (Array.isArray(parsed.conversations) && parsed.conversations.length > 1) {
      const seen = new Map<string, any>()
      const reassignments = new Map<string, string>() // duplicate_id -> kept_id
      // Keep oldest record (earliest created_at, tie-break by id)
      const sorted = parsed.conversations.slice().sort((a: any, b: any) => {
        const timeA = new Date(a.created_at || 0).getTime()
        const timeB = new Date(b.created_at || 0).getTime()
        if (timeA !== timeB) return timeA - timeB
        return String(a.id).localeCompare(String(b.id))
      })
      for (const conv of sorted) {
        const key = conv.requirement_id
          ? `req::${conv.requirement_id}::${conv.farmer_id}`
          : `list::${conv.listing_id}::${conv.buyer_id}`
        if (!seen.has(key)) {
          seen.set(key, conv)
        } else {
          const kept = seen.get(key)
          reassignments.set(conv.id, kept.id)
        }
      }
      if (reassignments.size > 0) {
        if (Array.isArray(parsed.messages)) {
          parsed.messages = parsed.messages.map((m: any) => {
            if (reassignments.has(m.conversation_id)) {
              return { ...m, conversation_id: reassignments.get(m.conversation_id) }
            }
            return m
          })
        }
        parsed.conversations = Array.from(seen.values())
        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8')
        } catch {}
      }
    }
    return parsed
  } catch {
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
  private sortColumn: string | null = null
  private sortAscending = true
  private rangeFrom: number | null = null
  private rangeTo: number | null = null

  private limitCount: number | null = null
  private pendingUpsertData: any = null

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

  upsert(data: any) {
    this.pendingUpsertData = data
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

  gte(column: string, value: any) {
    this.filters.push((row) => Number(row[column]) >= Number(value))
    return this
  }

  lte(column: string, value: any) {
    this.filters.push((row) => Number(row[column]) <= Number(value))
    return this
  }

  ilike(column: string, pattern: string) {
    const clean = pattern.replace(/%/g, '').toLowerCase()
    this.filters.push((row) => String(row[column] || '').toLowerCase().includes(clean))
    return this
  }

  or(conditions: string) {
    const parts = conditions.split(',').map((p) => p.trim()).filter(Boolean)
    const parsedClauses: Array<(row: any) => boolean> = parts.map((part) => {
      const [col, op, ...rest] = part.split('.')
      const rawVal = rest.join('.')
      const val = rawVal.replace(/^%/, '').replace(/%$/, '').toLowerCase()
      if (op === 'ilike') {
        return (row: any) => String(row[col] || '').toLowerCase().includes(val)
      }
      if (op === 'eq') {
        return (row: any) => String(row[col] || '').toLowerCase() === val
      }
      return () => false
    })
    this.filters.push((row) => parsedClauses.some((fn) => fn(row)))
    return this
  }

  in(column: string, values: any[]) {
    const set = new Set((values || []).map(String))
    this.filters.push((row) => set.has(String(row[column])))
    return this
  }

  is(column: string, value: any) {
    this.filters.push((row) => {
      const val = row[column]
      if (value === null) {
        return val === null || val === undefined
      }
      return val === value
    })
    return this
  }

  not(column: string, operator: string, value: any) {
    if (operator === 'eq') {
      this.filters.push((row) => String(row[column]) !== String(value))
    } else if (operator === 'is') {
      this.filters.push((row) => {
        const val = row[column]
        if (value === null) {
          return val !== null && val !== undefined
        }
        return val !== value
      })
    } else if (operator === 'in') {
      const set = new Set((Array.isArray(value) ? value : [value]).map(String))
      this.filters.push((row) => !set.has(String(row[column])))
    } else {
      this.filters.push((row) => row[column] !== value)
    }
    return this
  }

  order(column: string, { ascending = true } = {}) {
    this.sortColumn = column
    this.sortAscending = ascending
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  range(from: number, to: number) {
    this.rangeFrom = from
    this.rangeTo = to
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
      const list = (((db as any)[this.tableName] || []) as any[]).slice()

      if (this.tableName === 'conversations') {
        for (const row of rows) {
          const hasListing = row.listing_id !== undefined && row.listing_id !== null && String(row.listing_id).trim() !== ''
          const hasReq = row.requirement_id !== undefined && row.requirement_id !== null && String(row.requirement_id).trim() !== ''
          if ((hasListing && hasReq) || (!hasListing && !hasReq)) {
            return {
              data: null,
              error: {
                message: 'check constraint "check_conversation_source" violated',
                code: '23514'
              }
            }
          }
          if (hasListing) {
            const duplicate = list.find(
              (c: any) => String(c.listing_id) === String(row.listing_id) && String(c.buyer_id) === String(row.buyer_id)
            )
            if (duplicate) {
              return {
                data: null,
                error: {
                  message: 'duplicate key value violates unique constraint "conversations_listing_id_buyer_id_key"',
                  code: '23505'
                }
              }
            }
          } else {
            const duplicate = list.find(
              (c: any) => String(c.requirement_id) === String(row.requirement_id) && String(c.farmer_id) === String(row.farmer_id)
            )
            if (duplicate) {
              return {
                data: null,
                error: {
                  message: 'duplicate key value violates unique constraint "conversations_requirement_id_farmer_id_key"',
                  code: '23505'
                }
              }
            }
          }
        }
      }

      const inserted = rows.map((r) => ({
        id: r.id || crypto.randomUUID(),
        created_at: r.created_at || new Date().toISOString(),
        ...r
      }))

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

    // Handle UPSERT
    if (this.pendingUpsertData !== null) {
      const rows = Array.isArray(this.pendingUpsertData) ? this.pendingUpsertData : [this.pendingUpsertData]
      const list = (((db as any)[this.tableName] || []) as any[]).slice()
      const upserted: any[] = []

      for (const row of rows) {
        const existingIdx = row.id ? list.findIndex((item) => String(item.id) === String(row.id)) : -1
        if (existingIdx >= 0) {
          list[existingIdx] = {
            ...list[existingIdx],
            ...row,
            updated_at: row.updated_at || new Date().toISOString()
          }
          upserted.push(list[existingIdx])
        } else {
          const newRow = {
            id: row.id || crypto.randomUUID(),
            created_at: row.created_at || new Date().toISOString(),
            ...row
          }
          list.push(newRow)
          upserted.push(newRow)
        }
      }

      ;(db as any)[this.tableName] = list
      saveLocalDb(db)

      const result = this.isSingle ? upserted[0] : (Array.isArray(this.pendingUpsertData) ? upserted : upserted[0])
      return { data: result, error: null }
    }

    // Handle DELETE
    if (this.isDelete) {
      const list = (((db as any)[this.tableName] || []) as any[]).slice()
      ;(db as any)[this.tableName] = list.filter((r) => !this.filters.every((f) => f(r)))
      saveLocalDb(db)
      return { data: null, error: null }
    }

    // Handle SELECT
    let rows: any[] = []
    if (this.tableName === 'public_users') {
      rows = (db.users || []).map((u) => ({
        id: u.id,
        name: u.name,
        verification_status: u.verification_status || 'PENDING'
      }))
    } else if (this.tableName === 'public_buyers') {
      rows = (db.buyers || []).map((b) => ({
        id: b.id,
        user_id: b.user_id,
        business_name: b.business_name || b.company_name || 'Agro Buyer',
        buyer_type: b.buyer_type || b.business_type || 'Wholesaler',
        state: b.state || '',
        district: b.district || '',
        verification_status: b.verification_status || 'PENDING'
      }))
    } else {
      rows = (((db as any)[this.tableName] || []) as any[]).slice()
    }

    for (const f of this.filters) {
      rows = rows.filter(f)
    }

    // Apply sorting
    if (this.sortColumn) {
      const col = this.sortColumn
      const asc = this.sortAscending
      rows.sort((a, b) => {
        const valA = a[col]
        const valB = b[col]
        if (typeof valA === 'number' && typeof valB === 'number') {
          return asc ? valA - valB : valB - valA
        }
        const timeA = Date.parse(valA)
        const timeB = Date.parse(valB)
        if (!isNaN(timeA) && !isNaN(timeB)) {
          return asc ? timeA - timeB : timeB - timeA
        }
        const strA = String(valA ?? '').toLowerCase()
        const strB = String(valB ?? '').toLowerCase()
        return asc ? strA.localeCompare(strB) : strB.localeCompare(strA)
      })
    }

    const totalCount = rows.length

    // Apply pagination range
    if (this.rangeFrom !== null && this.rangeTo !== null) {
      rows = rows.slice(this.rangeFrom, this.rangeTo + 1)
    }

    // Apply limit
    if (this.limitCount !== null) {
      rows = rows.slice(0, this.limitCount)
    }

    if (this.isHead) {
      return { data: null, count: totalCount, error: null }
    }

    if (this.isSingle) {
      const singleRow = rows[0] || null
      return { data: singleRow, count: singleRow ? 1 : 0, error: null }
    }

    return { data: rows, count: totalCount, error: null }
  }
}

export function createLocalServerClient(cookieStore: any) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local DB shim is disabled in production.')
  }

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
          verification_status: 'PENDING',
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

    async removeChannel(channel?: any) {
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe()
      }
      return Promise.resolve('ok')
    }
  }
}

// -------------------------------------------------------------
// Helper functions for Farm Records (Crops, Harvests, Transactions)
// -------------------------------------------------------------

export function getCropsByFarmer(farmerId: string): LocalCrop[] {
  const db = getLocalDb()
  return (db.crops || [])
    .filter((c) => String(c.farmer_id) === String(farmerId))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export function addCropForFarmer(crop: Omit<LocalCrop, 'id' | 'created_at'>): LocalCrop {
  const db = getLocalDb()
  const newCrop: LocalCrop = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...crop,
    status: crop.status || 'PLANTED'
  }
  if (!Array.isArray(db.crops)) {
    db.crops = []
  }
  db.crops.unshift(newCrop)
  saveLocalDb(db)
  return newCrop
}

export function getHarvestsByFarmer(farmerId: string): LocalHarvest[] {
  const db = getLocalDb()
  return (db.harvests || [])
    .filter((h) => String(h.farmer_id) === String(farmerId))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export function addHarvestForFarmer(harvest: Omit<LocalHarvest, 'id' | 'created_at'>): LocalHarvest {
  const db = getLocalDb()
  const newHarvest: LocalHarvest = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...harvest
  }
  if (!Array.isArray(db.harvests)) {
    db.harvests = []
  }
  db.harvests.unshift(newHarvest)
  saveLocalDb(db)
  return newHarvest
}

export function getTransactionsByFarmer(farmerId: string): LocalTransaction[] {
  const db = getLocalDb()
  const txList = (db.farm_transactions && db.farm_transactions.length > 0) ? db.farm_transactions : (db.transactions || [])
  return txList
    .filter((t: any) => String(t.farmer_id) === String(farmerId) && t.direction)
    .sort((a: any, b: any) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime() || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export function addTransactionForFarmer(tx: Omit<LocalTransaction, 'id' | 'created_at'>): LocalTransaction {
  const db = getLocalDb()
  const newTx: LocalTransaction = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...tx
  }
  if (!Array.isArray(db.farm_transactions)) {
    db.farm_transactions = []
  }
  db.farm_transactions.unshift(newTx)
  saveLocalDb(db)
  return newTx
}

