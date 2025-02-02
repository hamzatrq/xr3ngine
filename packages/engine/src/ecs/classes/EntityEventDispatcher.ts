import { Component } from './Component';
import { Entity } from './Entity';

/**
 * This class provides methods to manage events dispatches.
 */
export class EntityEventDispatcher {
  /** Map to store listeners by event names. */
  _listeners: {}

  /** Keeps count of fired and handled events. */
  stats: { fired: number; handled: number }

  constructor () {
    this._listeners = {};
    this.stats = {
      fired: 0,
      handled: 0
    };
  }

  /** Resets the Dispatcher */
  public reset(): void {
    Object.keys(this._listeners).forEach(key => {
      delete this._listeners[key];
    });
    this.resetCounters();
  }

  /**
   * Adds an event listener.
   * @param eventName Name of the event to listen.
   * @param listener Callback to trigger when the event is fired.
   */
  addEventListener (eventName: string | number, listener: Function): void {
    const listeners = this._listeners;
    if (listeners[eventName] === undefined) {
      listeners[eventName] = [];
    }

    if (listeners[eventName].indexOf(listener) === -1) {
      listeners[eventName].push(listener);
    }
  }

  /**
   * Checks if an event listener is already added to the list of listeners.
   * @param eventName Name of the event to check.
   * @param listener Callback for the specified event.
   */
  hasEventListener (eventName: string | number, listener: Function): boolean {
    return this._listeners[eventName] !== undefined && this._listeners[eventName].indexOf(listener) !== -1;
  }

  /**
   * Removes an event listener.
   * @param eventName Name of the event to remove.
   * @param listener Callback for the specified event.
   */
  removeEventListener (eventName: string | number, listener: Function): void {
    const listenerArray = this._listeners[eventName];
    if (listenerArray !== undefined) {
      const index = listenerArray.indexOf(listener);
      if (index !== -1) {
        listenerArray.splice(index, 1);
      }
    }
  }

  /**
   * Dispatches an event with given Entity and Component and increases fired event's count.
   * @param eventName Name of the event to dispatch.
   * @param entity Entity to emit.
   * @param component Component to emit.
   */
  dispatchEvent (eventName: string | number, entity: Entity, component?: Component<any>): void {
    this.stats.fired++;

    const listenerArray = this._listeners[eventName];
    if (listenerArray !== undefined) {
      const array = listenerArray.slice(0);

      for (let i = 0; i < array.length; i++) {
        array[i].call(this, entity, component);
      }
    }
  }

  /**
   * Reset stats counters.
   */
  resetCounters (): void {
    this.stats.fired = this.stats.handled = 0;
  }
}
