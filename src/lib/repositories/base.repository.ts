import { SupabaseClient } from '@supabase/supabase-js'
import { DatabaseError, NotFoundError } from '../errors/app-error'

export abstract class BaseRepository<T extends { id: string }> {
  protected constructor(
    protected readonly supabase: SupabaseClient,
    protected readonly tableName: string
  ) {}

  protected get table() {
    return this.supabase.from(this.tableName)
  }

  async findById(id: string): Promise<T | null> {
    const { data, error } = await this.table
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      throw new DatabaseError(
        `Failed to find ${this.tableName}: ${error.message}`
      )
    }

    return data as T | null
  }

  async findAll(): Promise<T[]> {
    const { data, error } = await this.table
      .select('*')
      .is('deleted_at', null)

    if (error) {
      throw new DatabaseError(
        `Failed to fetch ${this.tableName}: ${error.message}`
      )
    }

    return (data as T[]) ?? []
  }

  async create(data: Record<string, unknown>): Promise<T> {
    const { data: result, error } = await this.table
      .insert(data as never)
      .select()
      .single()

    if (error) {
      throw new DatabaseError(
        `Failed to create ${this.tableName}: ${error.message}`
      )
    }

    return result as T
  }

  async update(id: string, data: Record<string, unknown>): Promise<T> {
    const { data: result, error } = await this.table
      .update(data as never)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new DatabaseError(
        `Failed to update ${this.tableName}: ${error.message}`
      )
    }

    return result as T
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.table
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      throw new DatabaseError(
        `Failed to delete ${this.tableName}: ${error.message}`
      )
    }
  }

  async restore(id: string): Promise<void> {
    const { error } = await this.table
      .update({
        deleted_at: null,
      })
      .eq('id', id)

    if (error) {
      throw new DatabaseError(
        `Failed to restore ${this.tableName}: ${error.message}`
      )
    }
  }

  protected ensureExists(entity: T | null): T {
    if (!entity) {
      throw new NotFoundError(`${this.tableName} not found`)
    }

    return entity
  }
}