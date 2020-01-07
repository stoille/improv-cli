const { jsonToXStateMachine, impToStream } = require("./parser")
const util = require('util')
const fs = require('fs')

async function parseScript(filePath, text, ops) {
  let t = text.split('\n')
  let stream = await impToStream(filePath, t, readScriptFileAndParse)
  if (ops.json) {
    return JSON.stringify(stream)
  } else if (ops.js) {
    return jsonToXStateMachine(JSON.stringify(stream))
  }
  return null
}
module.exports.parseScript = parseScript

async function readScriptFileAndParse(scriptPath, ops) {
  const readFile = util.promisify(fs.readFile)
  let rawText = await readFile(scriptPath, 'utf8')
  return parseScript(scriptPath, rawText, ops)
}
module.exports.readScriptFileAndParse = readScriptFileAndParse