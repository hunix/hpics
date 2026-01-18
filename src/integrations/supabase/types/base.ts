/**
 * Base types used across all Supabase type definitions
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type PostgrestVersion = "14.1"
