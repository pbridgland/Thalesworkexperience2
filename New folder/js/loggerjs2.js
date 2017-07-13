/* jshint esversion: 6, asi: true, boss: true */

;(() => {
  // Element for logging to the browser
  var loggerElem = document.getElementById('logger')
  
  // Init logger
  var L = new Logger()

  // Create handlers for what logging does
  //   - browser: Makes divs in the loggerElem
  var handlers = {
    browser: L.createWebHandler({element: loggerElem})
  }

  // Set up all handlers
  L.addHandler((messages, context) => {
    for (let key in handlers)
      handlers[key](messages, context)
  })

  // Optionally set the logging level (debug, info, time, warn, error)
  // Logger.setLevel(Logger.WARN)
  
  // Example uses
  L.time('Logger Examples')
  L.info('Info message')
  L.warn('Warning message')
  L.error('EMERGENCY')
  L.timeEnd('Logger Examples')
})()