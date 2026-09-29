import { COST_LIST, COST_WRITE } from '../config'
import type { PlaylistItemResource } from '../domain/item'
import type { Thumbnails } from '../domain/types'
import { isWritable } from '../state/settings'
import { ApiError, request } from './client'

export interface PlaylistResource {
  id: string
  snippet: { title: string; description?: string; thumbnails?: Thumbnails; channelTitle?: string }
  contentDetails?: { itemCount: number }
  status?: { privacyStatus: string }
}

interface Page<T> {
  items: T[]
  nextPageToken?: string
  pageInfo?: { totalResults: number }
}

async function listAll<T>(path: string, params: Record<string, string | number | boolean>, onPage?: (loaded: number, total: number) => void): Promise<T[]> {
  const all: T[] = []
  let pageToken: string | undefined
  do {
    const page = await request<Page<T>>(path, { params: { ...params, maxResults: 50, pageToken }, cost: COST_LIST })
    all.push(...page.items)
    onPage?.(all.length, page.pageInfo?.totalResults ?? all.length)
    pageToken = page.nextPageToken
  } while (pageToken)
  return all
}

export function listMyPlaylists(): Promise<PlaylistResource[]> {
  return listAll<PlaylistResource>('/playlists', { part: 'snippet,contentDetails,status', mine: true })
}

export function listPlaylistItems(playlistId: string, onPage?: (loaded: number, total: number) => void): Promise<PlaylistItemResource[]> {
  return listAll<PlaylistItemResource>('/playlistItems', { part: 'snippet,contentDetails', playlistId }, onPage)
}

function guard(playlistId: string) {
  if (!isWritable(playlistId)) throw new ApiError(0, 'readOnly', 'Запись в этот плейлист не разрешена. Включите её в настройках.')
}

export async function moveItem(playlistId: string, itemId: string, videoId: string, position: number): Promise<void> {
  guard(playlistId)
  await request('/playlistItems', {
    method: 'PUT',
    params: { part: 'snippet' },
    body: { id: itemId, snippet: { playlistId, position, resourceId: { kind: 'youtube#video', videoId } } },
    cost: COST_WRITE
  })
}

export async function insertItem(playlistId: string, videoId: string, position: number): Promise<PlaylistItemResource> {
  guard(playlistId)
  return request<PlaylistItemResource>('/playlistItems', {
    method: 'POST',
    params: { part: 'snippet,contentDetails' },
    body: { snippet: { playlistId, position, resourceId: { kind: 'youtube#video', videoId } } },
    cost: COST_WRITE
  })
}

export async function deleteItem(playlistId: string, itemId: string): Promise<void> {
  guard(playlistId)
  await request('/playlistItems', { method: 'DELETE', params: { id: itemId }, cost: COST_WRITE })
}
