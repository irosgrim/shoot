export class EventManager extends EventTarget {
  listeners: any;
  constructor() {
    super();
    this.listeners = {};
  }

  broadcast(topic: string, data: any) {
    const customEvent = new CustomEvent(topic, { detail: data });
    this.dispatchEvent(customEvent);
  }

  listen(topic: string, callback: any) {
    const wrappedCallback = (event: any) => callback(event.detail);
    wrappedCallback.originalCallback = callback;

    if (!this.listeners[topic]) {
      this.listeners[topic] = [];
    }

    this.listeners[topic].push(wrappedCallback);
    this.addEventListener(topic, wrappedCallback);

    return wrappedCallback;
  }

  remove(topic: string, originalCallback: any) {
    const wrappedCallbacks = this.listeners[topic] || [];
    for (let i = 0; i < wrappedCallbacks.length; i++) {
      const wrappedCallback = wrappedCallbacks[i];
      if (wrappedCallback.originalCallback === originalCallback) {
        this.removeEventListener(topic, wrappedCallback);
        this.listeners[topic].splice(i, 1);
        break;
      }
    }
  }

  removeAll(topic: string) {
    const wrappedCallbacks = this.listeners[topic] || [];
    for (const wrappedCallback of wrappedCallbacks) {
      this.removeEventListener(topic, wrappedCallback);
    }
    this.listeners[topic] = [];
  }
}