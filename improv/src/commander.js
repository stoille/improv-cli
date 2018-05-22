const program = require('commander')

const { readScriptFileAndParse } = require('./commands')

program
  .version('0.0.1')
  .description('improv compiler')

program
  .command('parse <scriptPath>')
  .alias('p')
  .description('parses an .improv script file')
  .action(scriptPath => {
    readScriptFileAndParse(scriptPath)
    .then(parsedScript => {
      console.log(parsedScript)
      process.exit(0)
    })
  })

program.parse(process.argv)