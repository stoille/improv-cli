const { jsonToXStateMachine, impToStream: impToXSStream } = require("./xsParser")
const { impToTimeline } = require("./timelineParser")
const { generateBabylonSource } = require('../../improv-plugin/src/scriptParser')
const util = require('util')
const fs = require('fs')
var os = require("os");

async function parseScript(scriptPath, ops, parent, lastView) {
  const readFile = util.promisify(fs.readFile)
  let rawText = await readFile(scriptPath, 'utf8')
  
  let lines = rawText.split(os.EOL)
  if (ops.json) {
    let stream = await impToXSStream(scriptPath, readScriptFileAndParse, lines, parent)
    return JSON.stringify(stream)
  } else if (ops.xs) {
    let stream = await impToXSStream(scriptPath, readScriptFileAndParse, lines, parent)
    return jsonToXStateMachine(JSON.stringify(stream))
  } else if (ops.timeline) {
    let timeline = await impToTimeline(scriptPath, ops.outputDir, readScriptFileAndParse, lines, lastView, ops.firstRun)
    return timeline
  } else if(ops.babylonjs){
    let babylonScriptParser = await generateBabylonSource(scriptPath, ops.outputDir)
    return babylonScriptParser
  }
  return null
}
module.exports.parseScript = parseScript