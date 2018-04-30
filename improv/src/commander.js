const program = require('commander')

const { parseScript } = require('./commands')
var fs = require('fs')

program
  .version('0.0.1')
  .description('improv compiler')

program
  .command('parse <scriptPath>')
  .alias('p')
  .description('parses an .improv script file')
  .action(scriptPath => {
    let scriptText = fs.readFile(scriptPath, "utf8", (err, text) => {
      let parsedScript = parseScript(text)
      var cache = [];
      console.log(JSON.stringify(parsedScript, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (cache.indexOf(value) !== -1) {
            // Circular reference found, discard key
            return;
          }
          // Store value in our collection
          cache.push(value);
        }
        return value;
      }))
      cache = null
      process.exit(0)
    })
  })

program.parse(process.argv)