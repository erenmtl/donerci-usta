// ============================================================================
// OLAY YÖNETİCİSİ (Pub/Sub EventBus) - Mantık ve Arayüz Katmanlarını Ayırır
// ============================================================================

type Listener = (payload?: any) => void;

export class EventBus {
  private listeners: Record<string, Listener[]> = {};

  public on(event: string, listener: Listener): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
    return () => this.off(event, listener);
  }

  public off(event: string, listener: Listener): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((l) => l !== listener);
  }

  public emit(event: string, payload?: any): void {
    if (!this.listeners[event]) return;
    for (const listener of this.listeners[event]) {
      listener(payload);
    }
  }
}

export const bus = new EventBus();
