const program = require('commander')

const { readScriptFileAndParse } = require('./commands')

program
  .version('0.2.0')
  .description('improv compiler')
  .command('parse <scriptPath>')
  .description('parses an improv (.imp) script file')
  .option('-j, --json', 'print to JSON')
  .option('-js, --js', 'print to JS')
  .action((scriptPath, cmd) => {
    readScriptFileAndParse(scriptPath, cmd.json, cmd.js)
    .then(parsedScript => {
      console.log(parsedScript)
      process.exit(0)
    })
  })

program.parse(process.argv)