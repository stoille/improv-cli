const t = require('tap')
//const cmd = require('../src/commands')

const scriptName = 'summerAfternoon'
const scriptPath = `../scripts/${scriptName}.json`

const Machine = require('xstate').Machine

t.test(`readScriptFile: ${scriptPath}...`, t => {
	var fs = require('fs')
	fs.readFile(scriptPath, "utf8", (err, json) => {
		const machine = Machine(json)
		t.matchSnapshot(machine.value, scriptPath)
		t.end()
	})
	/*
	return cmd.readScriptFileAndParse(scriptPath).then(parsedScript =>
		t.test(`${scriptName} parsed...`, t => {
			t.matchSnapshot(parsedScript, scriptName)
			t.end()
		}))
		*/
})