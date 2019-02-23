const { parseLines } = require("./parser")
var fs = require('fs')

const parseScript = (text, printToJSON) => {
  //console.log(text)
  let t = text.split('\n')
  let parsedScript = parseLines(t)
  if (printToJSON){
    return printScript(parsedScript)
  }
  //console.log(parsedScript)
  return parsedScript
}
module.exports.parseScript = parseScript

function printScript(parsedScript) {
  isCyclic(parsedScript)
  return JSON.stringify(parsedScript)
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

function isCyclic(obj) {
  var keys = [];
  var stack = [];
  var stackSet = new Set();
  var detected = false;

  function detect(obj, key) {
    if (obj && typeof obj != 'object') {
      return;
    }

    if (stackSet.has(obj)) { // it's cyclic! Print the object and its locations.
      var oldindex = stack.indexOf(obj);
      var l1 = keys.join('.') + '.' + key;
      var l2 = keys.slice(0, oldindex + 1).join('.');
      console.log('CIRCULAR: ' + l1 + ' = ' + l2 + ' = ' + obj);
      console.log(obj);
      detected = true;
      return;
    }

    keys.push(key);
    stack.push(obj);
    stackSet.add(obj);
    for (var k in obj) { //dive on the object's children
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        detect(obj[k], k);
      }
    }

    keys.pop();
    stack.pop();
    stackSet.delete(obj);
    return;
  }

  detect(obj, 'obj');
  return detected;
}