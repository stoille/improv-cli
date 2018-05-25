const t = require('tap')
const cmd = require('../src/commands')

const scriptName = 'hello'
const scriptPath = `../scripts/${scriptName}.imp`

t.test(`readScriptFile: ${scriptPath}...`, t => {
	return cmd.readScriptFileAndParse(scriptPath).then(parsedScript =>
		t.test(`${scriptName} parsed...`, t => {
			t.matchSnapshot(parsedScript, scriptName)
			t.end()}))
})