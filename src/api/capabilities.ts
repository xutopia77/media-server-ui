import http from './http'

/**
 * Server capability flags API.
 *
 * Contract (media-server HttpApiSrv): GET /capabilities ->
 * { code: 200, data: { gb, gb_device, debug } }
 * Used by the nav menu to show/hide feature pages.
 */
export interface Capabilities {
  gb: boolean
  gb_device: boolean
  debug: boolean
}

/** Fetch server capability flags from GET /capabilities. */
export async function getCapabilities(): Promise<Partial<Capabilities>> {
  const resp = await http.get<{ data?: Partial<Capabilities> }>('/capabilities')
  const data = resp.data?.data
  // Missing data (e.g. the endpoint is not deployed yet and the server's
  // catch-all route returns the SPA index.html) is treated as a failure so
  // callers can fall back to showing every menu.
  if (!data || typeof data !== 'object') {
    throw new Error('capabilities data missing')
  }
  return data
}
