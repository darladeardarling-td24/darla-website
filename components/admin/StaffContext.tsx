'use client'
import { createContext, useContext } from 'react'
import type { Profile } from '@/lib/types'

export const StaffCtx = createContext<Profile | null>(null)
export function useStaff() {
  const p = useContext(StaffCtx)
  return { profile: p, isAdmin: p?.role === 'admin' }
}
