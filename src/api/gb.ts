import http from './http'

/**
 * GB28181 HTTP API wrapper.
 *
 * Server contract (media-server, HttpApiSrv.cpp / GbSrv.cpp):
 * - GET  /api/v1/gb/status -> { code, status, data: { users: [...] } }
 *   Each user is one registered SIP device:
 *   { id, ip, port, devices: [{ id, model }] } (catalog channels).
 * - POST /api/v1/run_cmd   -> { code, status }
 *   gb_get_catalog: data = { userId }   (the registered SIP device id)
 *   gb_play:        data = { devId }    (a catalog channel id)
 *   gb_play_stop:   data = { devId }
 */

/** One catalog channel reported by the device (server exposes id + model). */
export interface GbCatalogDevice {
  id: string
  model: string
}

/** One registered SIP device ("user" in server terms). */
export interface GbUser {
  id: string
  ip: string
  port: number
  devices: GbCatalogDevice[]
}

export interface GbStatus {
  users: GbUser[]
}

export interface GbRunCmdResult {
  code: number
  status?: string
}

/** Fetch GB service status (registered devices + catalog channels). */
export async function getGbStatus(): Promise<GbStatus> {
  const resp = await http.get<{ data?: GbStatus }>('/api/v1/gb/status')
  return resp.data?.data ?? { users: [] }
}

/** POST /api/v1/run_cmd with a gb command; rejects on non-zero code. */
export async function runGbCmd(cmd: string, data?: unknown): Promise<GbRunCmdResult> {
  const resp = await http.post<GbRunCmdResult>('/api/v1/run_cmd', { cmd, data })
  return resp.data
}

/** Ask the registered device `userId` to report its channel catalog. */
export function queryGbCatalog(userId: string): Promise<GbRunCmdResult> {
  return runGbCmd('gb_get_catalog', { userId })
}

/** Send INVITE to start point-to-point play on channel `devId`. */
export function gbPlay(devId: string): Promise<GbRunCmdResult> {
  return runGbCmd('gb_play', { devId })
}

/** Send BYE to stop the ongoing play on channel `devId`. */
export function gbPlayStop(devId: string): Promise<GbRunCmdResult> {
  return runGbCmd('gb_play_stop', { devId })
}

/**
 * HTTP-FLV pull URL for a playing GB channel. The server republishes the
 * PS stream under app "2001" with the channel id as stream name (see
 * media-test-suite case12); 8090 is the default http-flv media port.
 */
export function gbFlvUrl(devId: string): string {
  return `http://${window.location.hostname}:8090/flv_real/2001/${devId}`
}
