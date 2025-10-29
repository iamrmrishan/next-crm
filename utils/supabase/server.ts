import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export class ServerDatabaseManager {
  private static retryAttempts = 3
  private static retryDelay = 1000

  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        console.error(`Server database operation failed (attempt ${attempt}/${this.retryAttempts}) - ${context}:`, error)
        
        if (attempt === this.retryAttempts) {
          throw new Error(`Server database operation failed after ${this.retryAttempts} attempts: ${context}`)
        }
        
        // Exponential backoff
        await this.delay(this.retryDelay * Math.pow(2, attempt - 1))
      }
    }
    
    throw new Error('Unexpected error in retry logic')
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  static async testConnection(): Promise<boolean> {
    try {
      const client = await createClient()
      const { error } = await client.from('orders').select('count', { count: 'exact', head: true })
      return !error
    } catch (error) {
      console.error('Server connection test failed:', error)
      return false
    }
  }
}