const { impToJSON, impToXML } = require("./parser")
var fs = require('fs')

const parseScript = (text, toJSON, toXML, isPrint) => {
  //console.log(text)
  let t = text.split('\n')
  let parsedScript = toJSON ? impToJSON(t) : toXML ? impToXML(t) : t
  if (isPrint){
    return printScript(parsedScript)
  }
  //console.log(parsedScript)
  return parsedScript
}
module.exports.parseScript = parseScript

function printScript(parsedScript) {
  return parsedScript
}

const readScriptFileAndParse = (scriptPath, toJSON, toXML, isPrint) => new Promise((resolve, reject) =>
  fs.readFile(scriptPath, "utf8", (err, text) => {
    if(err){
      console.error('readScriptFileAndParse:'+err)
      reject(err)
    }
    let ps = parseScript(text, toJSON, toXML, isPrint)
    resolve(ps)
  }))
module.exports.readScriptFileAndParse = readScriptFileAndParse