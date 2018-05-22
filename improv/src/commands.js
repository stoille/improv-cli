const { parseLines } = require("./parser")
var fs = require('fs')

var cache = []

const parseScript = (text) => {
  let t = text.split('\n')
  let parsedScript = parseLines(t)
  cache = []
  return JSON.stringify(parsedScript, filterParentRefences)
}
module.exports.parseScript = parseScript

const readScriptFileAndParse = (scriptPath) => new Promise( resolve =>
  fs.readFile(scriptPath, "utf8", (err, text) => {
    let ps = parseScript(text)
    resolve(ps)
  }))
module.exports.readScriptFileAndParse = readScriptFileAndParse

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