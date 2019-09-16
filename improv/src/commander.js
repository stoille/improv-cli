const program = require('commander')

const { readScriptFileAndParse } = require('./commands')

program
  .version('0.3.0')
  .description('improv compiler')
  .command('parse <scriptPath>')
  .description('parses an improv (.imp) script file')
  .option('-j, --json', 'export to JSON')
  .option('-js, --js', 'export to JS')
  .option('-u, --unity', 'export to Unity')    
  .action((scriptPath, cmd) => {
    readScriptFileAndParse(scriptPath, {json: cmd.json, js: cmd.js, unity: cmd.unity} )
    .then(parsedScript => {
      if(!parsedScript){
        console.error("Parse command requires output fomat to be defined. For help run: commander parse --help")
        //console.log(program.helpInformation())
      } else {
        console.log(parsedScript)
      }
      process.exit(0)
    })
  })

program.parse(process.argv)