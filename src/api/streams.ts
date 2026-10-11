import http from './http'

/**
 * Admin stream list API.
 *
 * Contract (media-server, endpoint implemented in parallel): GET /api/v1/streams ->
 * { code: 200, data: [...] }. Each stream carries fields such as roomId,
 * streamId, type, videoCodec, audioCodec, gopCache, viewers, subscribeTotal,
 * duration. The Admin page adapts its columns to the fields actually present,
 * so unknown/missing fields are tolerated; adjust here if the real backend
 * response shape differs during integration.
 */
export interface StreamInfo {
  roomId?: string
  streamId?: string
  type?: string
  videoCodec?: string
  audioCodec?: string
  gopCache?: boolean
  viewers?: number
  subscribeTotal?: number
  duration?: number
  [key: string]: unknown
}

/** Fetch all streams currently known to the server. */
export async function getStreams(): Promise<StreamInfo[]> {
  const resp = await http.get<{ data?: unknown }>('/api/v1/streams')
  const data = resp.data?.data
  if (Array.isArray(data)) return data as StreamInfo[]
  if (Array.isArray((data as { streams?: unknown })?.streams)) {
    return (data as { streams: StreamInfo[] }).streams
  }
  return []
}
