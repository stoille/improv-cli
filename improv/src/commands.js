const { generateMachine, printMachine, impToStream } = require("./parser")
var fs = require('fs')

const parseScript = (text, toJSON, toJS) => {
  let t = text.split('\n')
  let stream = impToStream(t)
  if(toJSON){
    return JSON.stringify(stream)
  } else if(toJS){
    return printMachine(JSON.stringify(stream))
  }
  return generateMachine(stream)
}
module.exports.parseScript = parseScript

const readScriptFileAndParse = (scriptPath, toJSON, toJS, isPrint) => new Promise((resolve, reject) =>
  fs.readFile(scriptPath, "utf8", (err, text) => {
    if(err){
      console.error('readScriptFileAndParse:'+err)
      reject(err)
    }
    let ps = parseScript(text, toJSON, toJS, isPrint)
    resolve(ps)
  }))
module.exports.readScriptFileAndParse = readScriptFileAndParse