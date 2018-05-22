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
      console.log(parsedScript)
      process.exit(0)
    })
  })

program.parse(process.argv)