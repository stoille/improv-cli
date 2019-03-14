const program = require('commander')

const { readScriptFileAndParse } = require('./commands')

program
  .version('0.1.0')
  .description('improv compiler')
  .command('parse <scriptPath>')
  .description('parses an improv (.imp) script file')
  .option('-j, --json', 'export to JSON')
  .option('-x, --xml', 'export to XML')
  .option('-p, --print', 'print to console')
  .action((scriptPath, cmd) => {
    readScriptFileAndParse(scriptPath, cmd.json, cmd.xml, cmd.print, )
    .then(parsedScript => {
      console.log(parsedScript)
      process.exit(0)
    })
  })

program.parse(process.argv)