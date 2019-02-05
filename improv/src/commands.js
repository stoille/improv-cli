const { parseLines } = require("./parser")
var fs = require('fs')

const parseScript = (text, printToJSON) => {
  //console.log(text)
  let t = text.split('\n')
  let states = parseLines(t)
  if (printToJSON){
    let state = {
      "id": "root",
      "initial": Object.keys(states)[0],
      "states": states
    }
    return printScript(state)
  }
  //console.log(parsedScript)
  return states
}
module.exports.parseScript = parseScript

function printScript(parsedScript) {
  cache = []
  return JSON.stringify(parsedScript, filterParentRefences)
}

const readScriptFileAndParse = (scriptPath, printToJSON) => new Promise((resolve, reject) =>
  fs.readFile(scriptPath, "utf8", (err, text) => {
    if(err){
      console.error('readScriptFileAndParse:'+err)
      reject(err)
    }
    let ps = parseScript(text, printToJSON)
    resolve(ps)
  }))
module.exports.readScriptFileAndParse = readScriptFileAndParse

var cache = []

function filterParentRefences(key, value) {  
  if (typeof value === 'object' && value !== null) {
    if (cache.indexOf(value) !== -1) {
      // Circular reference to parent found, discard key before printing
      if (key === 'parent')
        return
    }
    // Store value in our collection
    cache.push(value)
  }
  
  return value;
}