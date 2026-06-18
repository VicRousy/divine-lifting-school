export const data: Record<string, any[]> = {
  profiles: [], teachers: [], students: [], parents: [], announcements: [],
}

export let currentError: any = null

export function seed(table: string, rows: any[]) { data[table] = rows }
export function setError(err: any) { currentError = err }
export function clear() {
  Object.keys(data).forEach(k => { data[k] = [] })
  currentError = null
}

function buildQuery(table: string) {
  let filter: Record<string, any> = {}
  let single = false

  const q: any = {
    select() { return q },
    eq(c: string, v: any) { filter[c] = v; return q },
    in(c: string, v: any[]) { filter[c] = v; return q },
    order() { return q }, limit() { return q }, range() { return q },
    maybeSingle() { single = true; return q },
    single() { return q.then((r: any[]) => ({ data: r[0] || null, error: currentError })) },
    then(fn: (v: any) => void) {
      let rows = data[table] || []
      for (const [k, v] of Object.entries(filter)) {
        rows = Array.isArray(v) ? rows.filter(r => v.includes(r[k])) : rows.filter(r => r[k] === v)
      }
      fn({ data: (single && rows.length === 0) ? null : (single ? rows.slice(0, 1) : rows), error: currentError })
    },
    insert() { return { select() { return { single() { return Promise.resolve({ data: null, error: null }) } } } } },
  }
  return q
}

export const mockSupabase = {
  from(table: string) { return buildQuery(table) },
  rpc() { return { then(fn: any) { fn({ data: null, error: currentError }) } } },
  auth: {
    getSession() { return Promise.resolve({ data: { session: null }, error: null }) },
    onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } } },
    signOut() { return Promise.resolve({ error: null }) },
    signInWithPassword() { return Promise.resolve({ data: { session: { user: { id: 'mock' } } }, error: null }) },
    admin: {
      createUser() { return Promise.resolve({ data: { user: { id: 'mock' } }, error: null }) },
      listUsers() { return Promise.resolve({ data: { users: [] }, error: null }) },
      updateUserById() { return Promise.resolve({ data: null, error: null }) },
      deleteUser() { return Promise.resolve({ data: null, error: null }) },
    },
    mfa: {
      listFactors() { return Promise.resolve({ data: { all: [] }, error: null }) },
      challenge() { return Promise.resolve({ data: { id: 'mock' }, error: null }) },
      verify() { return Promise.resolve({ data: { status: 'verified' }, error: null }) },
    },
  },
}
