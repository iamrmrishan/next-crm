import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'

// Mock the Supabase client
vi.mock('@/utils/supabase/client')

describe('useAuth', () => {
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2023-01-01T00:00:00Z',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    email_confirmed_at: '2023-01-01T00:00:00Z'
  }

  const mockSupabaseClient = {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn()
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockReturnValue(mockSupabaseClient as unknown as ReturnType<typeof createClient>)
  })

  it('should initialize with loading state and null user', () => {
    // Setup mock to return null user initially
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })
    
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })

    const { result } = renderHook(() => useAuth())

    // Initial state should be loading with null user
    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBe(null)
  })

  it('should set user and stop loading when getUser returns a user', async () => {
    // Setup mock to return a user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })
    
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })

    const { result } = renderHook(() => useAuth())

    // Wait for the effect to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
  })

  it('should handle auth state changes through subscription', async () => {
    let authStateChangeCallback: ((event: string, session: { user: User } | null) => void) | undefined

    // Setup initial state with no user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })
    
    // Capture the callback function
    mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
      authStateChangeCallback = callback
      return {
        data: { subscription: { unsubscribe: vi.fn() } }
      }
    })

    const { result } = renderHook(() => useAuth())

    // Wait for initial load to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toBe(null)

    // Simulate auth state change with user login
    authStateChangeCallback?.('SIGNED_IN', { user: mockUser })

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
    })

    expect(result.current.loading).toBe(false)
  })

  it('should handle auth state changes with null session (logout)', async () => {
    let authStateChangeCallback: ((event: string, session: { user: User } | null) => void) | undefined

    // Setup initial state with a user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })
    
    mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
      authStateChangeCallback = callback
      return {
        data: { subscription: { unsubscribe: vi.fn() } }
      }
    })

    const { result } = renderHook(() => useAuth())

    // Wait for initial load to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)

    // Simulate logout (null session)
    authStateChangeCallback?.('SIGNED_OUT', null)

    await waitFor(() => {
      expect(result.current.user).toBe(null)
    })

    expect(result.current.loading).toBe(false)
  })

  it('should unsubscribe from auth changes on unmount', () => {
    const mockUnsubscribe = vi.fn()
    
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })
    
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    })

    const { unmount } = renderHook(() => useAuth())

    // Unmount the hook
    unmount()

    // Verify unsubscribe was called
    expect(mockUnsubscribe).toHaveBeenCalledOnce()
  })

  it('should handle getUser errors gracefully', async () => {
    // Setup mock to return an error
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Network error' }
    })
    
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    })

    const { result } = renderHook(() => useAuth())

    // Wait for the effect to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should handle error gracefully and set user to null
    expect(result.current.user).toBe(null)
  })
})