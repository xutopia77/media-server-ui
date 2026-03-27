type EventCallback = (data: unknown) => void

class EventBus {
  private events: Map<string, EventCallback[]> = new Map()

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(callback)
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event: string, data?: unknown) {
    console.log(`=== EventBus.emit called ===`)
    console.log(`Event: ${event}`)
    console.log(`Data:`, data)
    console.log(`Registered listeners for ${event}:`, this.events.get(event)?.length || 0)
    
    const callbacks = this.events.get(event)
    if (callbacks) {
      console.log(`Executing ${callbacks.length} callbacks for event: ${event}`)
      callbacks.forEach(callback => callback(data))
      console.log(`All callbacks executed for event: ${event}`)
    } else {
      console.log(`No callbacks registered for event: ${event}`)
    }
    console.log(`=== EventBus.emit completed ===`)
  }

  clear(event?: string) {
    if (event) {
      this.events.delete(event)
    } else {
      this.events.clear()
    }
  }
}

export const eventBus = new EventBus()
