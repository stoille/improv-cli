const { jsonToXStateMachine, impToStream: impToXSStream } = require("./xsParser")
const { impToTimeline } = require("./timelineParser")
const { generateGraphDataObjects } = require("../../improv-plugin/src/scriptParser")
const util = require('util')
const fs = require('fs')

async function parseScript(filePath, text, ops, parent, lastShot) {
  let lines = text.split('\n')
  if (ops.json) {
    let stream = await impToXSStream(filePath, readScriptFileAndParse, lines, parent)
    return JSON.stringify(stream)
  } else if (ops.xs) {
    let stream = await impToXSStream(filePath, readScriptFileAndParse, lines, parent)
    return jsonToXStateMachine(JSON.stringify(stream))
  } else if (ops.timeline) {
    let timeline = await impToTimeline(filePath, ops.outputDir, readScriptFileAndParse, lines, lastShot, ops.firstRun)
    return timeline
  } else if(ops.babylonjs){
    let timeline = await generateGraphDataObjects(filePath, ops.outputDir)
    return timeline
  }
  return null
}
module.exports.parseScript = parseScript

async function readScriptFileAndParse(scriptPath, ops, parent, lastView) {
  const readFile = util.promisify(fs.readFile)
  let rawText = await readFile(scriptPath, 'utf8')
  return parseScript(scriptPath, rawText, ops, parent, lastView)
}
module.exports.readScriptFileAndParse = readScriptFileAndParse