type PendingTx = {
  org_id: string
  asset_id: string
  type: 'check_in' | 'check_out'
  from_location_id?: string | null
  to_location_id?: string | null
  notes?: string
  created_at: string
}

const KEY = 'bez-offline-queue'
const UI_KEY = 'bez-offline-ui-queue'

export function addPendingTransaction(tx: PendingTx) {
  try {
    const raw = localStorage.getItem(KEY)
    const list: PendingTx[] = raw ? JSON.parse(raw) : []
    localStorage.setItem(KEY, JSON.stringify([tx, ...list]))
  } catch {}
}

export async function processQueue(insertFn: (tx: PendingTx)=> Promise<void>) {
  try {
    const raw = localStorage.getItem(KEY)
    const list: PendingTx[] = raw ? JSON.parse(raw) : []
    if (!list.length) return
    const remaining: PendingTx[] = []
    for (const tx of list) {
      try {
        await insertFn(tx)
      } catch {
        remaining.push(tx)
      }
    }
    localStorage.setItem(KEY, JSON.stringify(remaining))
  } catch {}
}

export function enqueue(item: any) {
  try {
    const raw = localStorage.getItem(UI_KEY)
    const list: any[] = raw ? JSON.parse(raw) : []
    localStorage.setItem(UI_KEY, JSON.stringify([item, ...list]))
  } catch {}
}

export function getQueue(): any[] {
  try {
    const raw = localStorage.getItem(UI_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function clearQueue() {
  try {
    localStorage.removeItem(UI_KEY)
  } catch {}
}
