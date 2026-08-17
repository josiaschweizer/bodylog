import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/Database'

let browserClient: ReturnType<typeof createClient<Database>> | null = null

export default function getBrowserClient() {
  if (!browserClient) {
    browserClient = createClient<Database>(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    )
  }

  return browserClient
}
