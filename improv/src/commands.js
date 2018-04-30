const { parseLines } = require("./parser")

const parseScript = (text) => {
  let t = text.split('\n')
  return parseLines(t)
}

module.exports.parseScript = parseScript