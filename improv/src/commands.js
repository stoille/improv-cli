const { jsonToXStateMachine, impToStream } = require("./parser")
var fs = require('fs')

const parseScript = (text, ops) => {
  let t = text.split('\n')
  let stream = impToStream(t)
  if(ops.json){
    return JSON.stringify(stream)
  } else if(ops.js){
    return jsonToXStateMachine(JSON.stringify(stream))
  } 
  return null
}
module.exports.parseScript = parseScript

const readScriptFileAndParse = (scriptPath, ops) => new Promise((resolve, reject) =>
  fs.readFile(scriptPath, "utf8", (err, text) => {
    if(err){
      console.error('readScriptFileAndParse:'+err)
      reject(err)
    }
    let ps = parseScript(text, ops)
    resolve(ps)
  }))
module.exports.readScriptFileAndParse = readScriptFileAndParse