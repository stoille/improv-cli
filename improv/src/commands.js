const { parseLines } = require("./parser")

var cache = []

const parseScript = (text) => {
  let t = text.split('\n')
  let parsedScript = parseLines(t)
  cache = []
  return JSON.stringify(parsedScript, filterParentRefences)
}
module.exports.parseScript = parseScript

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