/* jshint esversion: 6, asi: true, boss: true */

/*!
 * js-logger - https://github.com/jonnyreeves/js-logger
 * Jonny Reeves, https://jonnyreeves.co.uk/
 * js-logger may be freely distributed under the MIT license.
 */
;((global) => {
  'use strict'

  // Inner class which performs the bulk of the work; ContextualLogger instances can be configured independently
  // of each other.
  class ContextualLogger {
    constructor (defaultContext) {
      this.context = defaultContext
      this.setLevel(defaultContext.filterLevel)
      this.log = this.info  // Convenience alias.
    }
  }
  
  class Logger {
    static get VERSION () { return '1.3.1' }
    
    // Predefined logging levels.
    static get CLEAR () { return {value: Infinity, name: 'CLEAR'} }
    static get DEBUG () { return {value: 1,  name: 'DEBUG'} }
    static get INFO  () { return {value: 2,  name: 'INFO' } }
    static get TIME  () { return {value: 3,  name: 'TIME' } }
    static get WARN  () { return {value: 4,  name: 'WARN' } }
    static get ERROR () { return {value: 8,  name: 'ERROR'} }
    static get OFF   () { return {value: 99, name: 'OFF'  } }
    
    constructor (options = {defaultLevel: Logger.DEBUG}) {
      this.logHandlers = []
      this.timers = {}
      
      this.defaultLevel = options.defaultLevel
      this.filterLevel = this.defaultLevel
      this.setLevel(this.defaultLevel)
      
      this.addHandler(this.createDefaultHandler(options))
    }
    
    addHandler (func) { this.logHandlers.push(func) }
    
    // Changes the current logging level for the logging instance.
    setLevel (newLevel) {
      // Ensure the supplied Level object looks valid.
      if (newLevel && 'value' in newLevel)
        this.filterLevel = newLevel
    }
    
    defaultMessageFormatter (messages, context) {
      // Prepend the logger's name to the log message for easy identification.
      if (context.name)
        messages.unshift(`[${context.name}]`)
    }
    
    createDefaultHandler (options = {}) {
      options.formatter = options.formatter || this.defaultMessageFormatter

      // Check for the presence of a logger.
      if (typeof console === 'undefined')
        return () => { /* no console */ }

      return (messages, context) => {
        // Convert arguments object to Array.
        messages = Array.prototype.slice.call(messages)

        var hdlr = console.log
        var timerLabel

        if (context.level.value === Logger.TIME.value) {
          timerLabel = (context.name ? `[${context.name}] ` : '') + messages[0]

          if (messages[1] === 'start') {
            if (console.time)
              console.time(timerLabel)
            else {
              console.log(`${timerLabel}: timer started`)
            }
          } else {
            if (console.timeEnd)
              console.timeEnd(timerLabel)
            else
              console.log(`${timerLabel}: ${new Date().getTime() - this.timers[timerLabel]}ms`)
          }
        } else {
          // Delegate through to custom warn/error loggers if present on the console.
          if (context.level.value === Logger.CLEAR.value)
            hdlr = console.clear
          else if (context.level.value === Logger.WARN.value && console.warn)
            hdlr = console.warn
          else if (context.level.value === Logger.ERROR.value && console.error)
            hdlr = console.error
          else if (context.level.value === Logger.INFO.value && console.info)
            hdlr = console.info
          else if (context.level.value === Logger.DEBUG.value && console.debug)
            hdlr = console.debug

          options.formatter(messages, context)
          hdlr.apply(console, messages)
        }
      }
    }
    
    createWebHandler (options = {}) {
      if (!('element' in options && 'append' in options.element))
        return () => {}
        
      options.formatter = options.formatter || this.defaultMessageFormatter
      options.appender = options.appender || function defaultAppender (innerHtml, context) {
        var e = document.createElement('div')
        e.className = `log ${context.level.name}`
        e.innerHTML = innerHtml
        options.element.append(e)
      }
      options.clearer = options.clearer || function defaultClearer () {
        options.element.innerHTML = ''
      }
      
      return (messages, context) => {
        // Convert arguments object to Array.
        messages = Array.prototype.slice.call(messages)
        
        var timerLabel

        if (context.level.value === Logger.TIME.value) {
          timerLabel = (context.name ? `[${context.name}] ` : '') + messages[0]

          if (messages[1] === 'start')
            options.appender(`${timerLabel}: timer started`, context)
          else
            options.appender(`${timerLabel}: ${new Date().getTime() - this.timers[timerLabel]}ms`, context)
        } else if (context.level.value === Logger.CLEAR.value) {
          options.clearer()
        } else {
          options.formatter(messages, context)
          messages.forEach((m) => options.appender(m, context))
        }
      }
    }
    
    // Is the logger configured to output messages at the supplied level?
    enabledFor (lvl) { return lvl.value >= this.filterLevel.value }

    debug () { this.invoke(Logger.DEBUG, arguments) }
    info  () { this.invoke(Logger.INFO,  arguments) }
    warn  () { this.invoke(Logger.WARN,  arguments) }
    error () { this.invoke(Logger.ERROR, arguments) }
    
    log   () { this.invoke(Logger.DEBUG, arguments) }
    clear () { this.invoke(Logger.CLEAR, arguments) }
    
    time (label) {
      if (typeof label === 'string' && label) {
        this.invoke(Logger.TIME, [label, 'start'])
        this.timers[label] = new Date().getTime()
      }
    }

    timeEnd (label) {
      if (typeof label === 'string' && label)
        this.invoke(Logger.TIME, [label, 'end'])
    }
    
    // Invokes the logger callback if it's not being filtered.
    invoke (level, msgArgs) {
      if (this.enabledFor(level))
        this.logHandlers.forEach(lh => lh(msgArgs, merge({level}, this.context)))
    }
  }
  
  function merge () {
    let args = arguments, target = args[0], key, i
    for (i = 1; i < args.length; i++)
      for (key in args[i])
        if (!(key in target) && args[i].hasOwnProperty(key))
          target[key] = args[i][key]

    return target
  }
  
  global.Logger = Logger
})(this)