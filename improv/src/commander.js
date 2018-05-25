const program = require('commander')

const { readScriptFileAndParse } = require('./commands')

program
  .version('0.1.0')
  .description('improv compiler')
  .command('parse <scriptPath>')
  .alias('p')
  .description('parses an .improv script file')
  .option('-j, --json', 'print to JSON')
  .action((scriptPath, cmd) => {
    readScriptFileAndParse(scriptPath, cmd.json)
    .then(parsedScript => {
      console.log(parsedScript)
      process.exit(0)
    })
  })

program.parse(process.argv)