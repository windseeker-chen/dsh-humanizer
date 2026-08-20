/**
 * Persistent storage for Voice Profiles: a single JSON file under the user's
 * home directory. Deliberately decoupled from the harness storage subsystem so
 * the plugin boots with no storage backend requirement.
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import type { StyleFingerprint } from '@dsh/writing-core'

export interface VoiceProfile {
  id: string
  createdAt: string
  updatedAt: string
  sampleCount: number
  platforms: string[]
  fingerprint: StyleFingerprint
  sampleExcerpts: string[]
}

interface StoreFile {
  version: 1
  profiles: Record<string, VoiceProfile>
}

function expandHome(path: string): string {
  if (path === '~') return homedir()
  if (path.startsWith('~/')) return join(homedir(), path.slice(2))
  return path
}

function emptyStore(): StoreFile {
  return { version: 1, profiles: {} }
}

export class ProfileStore {
  private readonly filePath: string
  private cache: StoreFile | null = null

  constructor(filePath: string) {
    this.filePath = expandHome(filePath)
  }

  private async load(): Promise<StoreFile> {
    if (this.cache) return this.cache
    try {
      const raw = await readFile(this.filePath, 'utf8')
      const parsed = JSON.parse(raw) as StoreFile
      this.cache = parsed && parsed.version === 1 && parsed.profiles ? parsed : emptyStore()
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
      this.cache = emptyStore()
    }
    return this.cache
  }

  private async save(): Promise<void> {
    const data = this.cache ?? emptyStore()
    await mkdir(dirname(this.filePath), { recursive: true })
    const tmp = `${this.filePath}.tmp`
    await writeFile(tmp, JSON.stringify(data, null, 2), 'utf8')
    await rename(tmp, this.filePath)
  }

  async list(): Promise<VoiceProfile[]> {
    const data = await this.load()
    return Object.values(data.profiles).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async get(id: string): Promise<VoiceProfile | undefined> {
    const data = await this.load()
    return data.profiles[id]
  }

  async upsert(profile: VoiceProfile): Promise<VoiceProfile> {
    const data = await this.load()
    profile.updatedAt = new Date().toISOString()
    data.profiles[profile.id] = profile
    await this.save()
    return profile
  }

  async remove(id: string): Promise<boolean> {
    const data = await this.load()
    if (!data.profiles[id]) return false
    delete data.profiles[id]
    await this.save()
    return true
  }
}
