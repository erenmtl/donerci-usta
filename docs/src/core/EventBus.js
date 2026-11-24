// ============================================================================
// OLAY YÖNETİCİSİ (Pub/Sub EventBus) - Mantık ve Arayüz Katmanlarını Ayırır
// ============================================================================

export class EventBus {
  listeners = {};

  on(event, listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
    return () => this.off(event, listener);
  }

  off(event, listener) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((l) => l !== listener);
  }

  emit(event, payload) {
    if (!this.listeners[event]) return;
    for (const listener of this.listeners[event]) {
      listener(payload);
    }
  }
}

export const bus = new EventBus();
