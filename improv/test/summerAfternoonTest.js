const t = require('tap')
//const cmd = require('../src/commands')

const scriptName = 'summerAfternoon'
const scriptPath = `../scripts/${scriptName}.imp`

import { Machine } from 'xstate'
const summerAfternoon = require('./summerAfternoon.json')

t.test(`readScriptFile: ${scriptPath}...`, t => {
	var fs = require('fs')
	fs.readFile(summerAfternoon, "utf8", (err, text) => {
	if (err) {
		console.error('readScriptFileAndParse:' + err)
		reject(err)
	}
	const machine = Machine()
	resolve(ps)
	})
	/*
	return cmd.readScriptFileAndParse(scriptPath).then(parsedScript =>
		t.test(`${scriptName} parsed...`, t => {
			t.matchSnapshot(parsedScript, scriptName)
			t.end()
		}))
		*/
})