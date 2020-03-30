const { jsonToXStateMachine, impToStream } = require("./parser")
const util = require('util')
const fs = require('fs')

async function parseScript(filePath, text, ops, parentState) {
  let lines = text.split('\n')
  let stream = await impToStream(filePath, readScriptFileAndParse, lines, parentState)
  if (ops.json) {
    return JSON.stringify(stream)
  } else if (ops.js) {
    return jsonToXStateMachine(JSON.stringify(stream))
  }
  return null
}
module.exports.parseScript = parseScript

async function readScriptFileAndParse(scriptPath, ops, parentState) {
  const readFile = util.promisify(fs.readFile)
  let rawText = await readFile(scriptPath, 'utf8')
  return parseScript(scriptPath, rawText, ops, parentState)
}
module.exports.readScriptFileAndParse = readScriptFileAndParse