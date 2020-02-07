const program = require('commander')
const util = require('util')
const fs = require('fs')

const { readScriptFileAndParse } = require('./commands')

program
	.version('0.3.0')
	.description('improv compiler')
	.command('parse <scriptPath>')
	.description('parses an improv (.imp) script file')
	.option('-j, --json', 'export to JSON')
	.option('-js, --js', 'export to JS')
	.option('-u, --unity', 'export to Unity')
	.action(async (scriptPath, cmd) => {
		let parsedScript = await readScriptFileAndParse(scriptPath, { json: cmd.json, js: cmd.js, unity: cmd.unity })

		if (!parsedScript) {
			console.error("Parse command requires output fomat to be defined. For help run: commander parse --help")
			//console.log(program.helpInformation())
		} else {
			//console.log(parsedScript)
			const writeFile = util.promisify(fs.writeFile)
			let path = scriptPath.slice(0, scriptPath.lastIndexOf('.'))
			path = `${path}.json`
			await writeFile(path, parsedScript)
		}
		process.exit(0)
	})

program.parse(process.argv)