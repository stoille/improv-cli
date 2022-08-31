const program = require('commander')
const util = require('util')
const fs = require('fs')
const { resolveHome } = require('./common')

const { parseScript } = require('./commands')
const { parse } = require('path')

program
	.version('0.4.0')
	.description('improv compiler')
	.command('parse <scriptPath>')
	.description('parses an improv (.imp) script file')
	.option('-j, --json', 'export to JSON (raw)')
	.option('-x, --xs', 'export to XState format (JSON)')
	//.option('-u, --unity', 'export to Unity (TODO)')
	.option('-t, --timeline', 'export to timeline format (JSON)')
	.option('-b, --babylonjs', 'export to babylon.js graph format (lGraph JSON)')
	.option('-o, --output-dir <dir>', 'path to export to')
	.action(async (scriptPath, cmd) => {
		let parsedScript = await parseScript(scriptPath, { json: cmd.json, xs: cmd.xs, timeline: cmd.timeline, babylonjs: cmd.babylonjs, outputDir: cmd.outputDir, firstRun: true })

		if (!parsedScript) {
			console.error("Parse command requires output fomat to be defined. For help run: commander parse --help")
		} else {
			const writeFile = util.promisify(fs.writeFile)
			let path = scriptPath.slice(0, scriptPath.lastIndexOf('.'))
			let name = path.slice(path.lastIndexOf('/') + 1)
			path = cmd.outputDir ? `${resolveHome(cmd.outputDir)}/${name}.json` : `${path}.json`
			parsedScript = isString(parsedScript) ? parsedScript : JSON.stringify(parsedScript)
			await writeFile(path, parsedScript)
		}
		process.exit(0)
	})

program.parse(process.argv)

function isString(obj) {
	return (Object.prototype.toString.call(obj) === '[object String]');
}