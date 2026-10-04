import axios from 'axios'

/**
 * Shared axios instance.
 *
 * The backend uses different success codes (0 for RTC APIs, 200 for sys APIs);
 * anything else is treated as an error and the server `msg` is surfaced to callers.
 */
const http = axios.create({
  baseURL: '/',
  timeout: 30000
})

http.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data && typeof data === 'object' && 'code' in data) {
      const ok = data.code === 0 || data.code === 200
      if (!ok) {
        const msg = (data.msg as string) || (data.message as string) || `Request failed (code=${data.code})`
        return Promise.reject(new Error(msg))
      }
    }
    return response
  },
  (error) => {
    const msg = error?.response?.data?.msg || error?.message || 'Network error'
    return Promise.reject(new Error(msg))
  }
)

export default http
