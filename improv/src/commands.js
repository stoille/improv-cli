
const nearley = require("nearley")
const grammar = require("./grammar")

const parseScript = (text) => {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar))
  parser.feed(text)
  //console.info(`text: ${text}`)
  //console.info(`parsed text: ${parser.results}`)
  return parser.results
}

module.exports = { parseScript }