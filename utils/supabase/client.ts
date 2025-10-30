import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let clientInstance: SupabaseClient | null = null

export function createClient() {
  if (clientInstance) {
    return clientInstance
  }

  clientInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return clientInstance
}

export class DatabaseManager {
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
        console.error(`Database operation failed (attempt ${attempt}/${this.retryAttempts}) - ${context}:`, error)
        
        if (attempt === this.retryAttempts) {
          throw new Error(`Database operation failed after ${this.retryAttempts} attempts: ${context}`)
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
      const client = createClient()
      const { error } = await client.from('orders').select('count', { count: 'exact', head: true })
      return !error
    } catch (error) {
      console.error('Connection test failed:', error)
      return false
    }
  }
}