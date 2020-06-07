import { SignallingClient } from "./SignallingClient";

export class MemorySignaling extends SignallingClient {
  constructor() {
    super()
    this._listeners = new Map();
  }

  emit(event, data, from, to) {
    let listeners = this._listeners.get(event) || [];

    if (to) {
      listeners.forEach((item) => {
        if (to === item.peerId) {
          item.listener(data, from);
        }
      });
    } else {
      listeners.forEach((item) => item.listener(data, from));
    }

    return this;
  }

  on(event, listener, peerId) {
    let listeners = this._listeners.get(event) || [];
    
    listeners.push({
      listener,
      peerId,
    });

    this._listeners.set(event, listeners)

    return this
  }
}
