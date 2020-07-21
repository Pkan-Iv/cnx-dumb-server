import { EventEmitter } from 'events'

export const eventEmitter = new EventEmitter

// Creation of a listener
const listener = () => console.log( 'Listener "foo" executed')

// Bind the 'foo' event with the listener function
eventEmitter.addListener('foo', listener)

// Fire the 'foo' event
eventEmitter.emit('foo')

// Remove the binding of listener function
eventEmitter.removeListener('foo', listener)
console.log('Listener "foo" is not listening anymore')