import { useMessage, useNotification } from 'naive-ui'

/**
 * Thin wrapper around Naive UI feedback components.
 *
 * Transient feedback goes to the message bar; errors are kept as dismissible
 * notifications so they are not missed. Must be called inside setup(), under
 * the Naive UI providers mounted in App.vue.
 */
export function useAppMessage() {
  const message = useMessage()
  const notification = useNotification()

  const error = (content: string, title = 'Error') => {
    notification.error({ title, content, duration: 0, closable: true })
  }

  return {
    success: (msg: string) => message.success(msg),
    info: (msg: string) => message.info(msg),
    warning: (msg: string) => message.warning(msg),
    error
  }
}
