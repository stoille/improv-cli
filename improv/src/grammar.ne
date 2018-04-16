start -> block _ {% d => d[0] %}

block -> comment | exp:? scene #_ NL:* _ exp:? _ NL:* _ 
{%
    ([comment, exp, scene]) => { 
        return ({
        type: "state",
        //comment:  data[0],
        //blockDepth: data[2], // data[1] is "NL"
        condition: exp,
        scene: scene
    }) }
%}
exp -> var NL:? {% ([varName]) => { 
    return ({varName}) } %}
  | exp _ AND exp NL {% ([lhs, _, op, rhs]) => { 
      return ({lhs, op, rhs}) }  %}
  | exp _ OR exp NL {% ([lhs, _, op, rhs]) => { 
      return ({lhs, op, rhs}) } %}
  | AWAIT exp NL {% ([op, rhs]) => { 
      return ({op, rhs}) } %}
  | input exp NL {% ([op, rhs]) => { 
      return ({op, rhs}) } %}

var -> [A-Z]:+ {% id %}

scene -> fromTransition:? sceneHeading:? shot {% 
    ([fromTransition, sceneHeading, shot]) => {
        return ({ fromTransition, sceneHeading, shot}) }
%}
sceneHeading -> scenePlacement sceneName sceneTime NL {% 
    ([scenePlacement, sceneName, sceneTime]) => {
        return ({ scenePlacement, sceneName, sceneTime}) }
%}
sceneName -> WORD:+ SHOTSEP {% d => d[0] %}

shot -> shotType shotSource:? shotTarget:? shotMovement:? timeSpan NL (action|dialogue):* {%
    ([shotType, shotSource, shotTarget, shotMovement, timeSpan, _, action, dialogue]) => {
        return ({shotType, shotSource, shotTarget, shotMovement, timeSpan, _, action, dialogue}) }
%}
action -> sentence:+ NL:? {% d => { 
    return ({text: d[0]}) } %}
timeSpan -> num ":" num _ {% d => { 
    return ({ min: d[0], sec: d[2] }) } %}
num -> [0-9] [0-9] {% d => parseInt(d[0] + d[1]) %}

shotSource -> shotSubject {% id %}
shotTarget -> shotSubject {% id %}
shotSubject -> WORD (SHOT_SUBJECT_SEP WORD):* SHOTSEP {% ([root, child]) => { 
    return ({root, child}) } %}

dialogue -> speakerName ":" sentence:+ NL {% ([speaker, _, text]) => { 
    return ({speaker: speaker, text: text}) } %}
speakerName -> (WORD [.-]:? WORD):+ {% id %} #TODO: space support

fromTransition -> transitionType ":" NL {% (d) => { 
    return ({transitionType:d[0]}) } %}
toTransition -> transitionType ":" NL  {% (d) => { 
    return ({transitionType:d[0]}) } %}

# Whitespace: `_` is optional, `__` is mandatory.
_  -> wschar:* {% () => null %}
__ -> wschar:+ {% () => null %}
wschar -> [ ] {% id %}
NL -> _ ("\r" "\n" | "\r" | "\n"):* {% () => null %}
TAB -> [\t]:+ {% id %}

sentence -> (WORD _):+ [.?!] _ {% id %}
WORD -> [a-zA-Z]:+ _ {% id %}

comment -> "//" .:* {% () => null %}

input -> ("TOUCH"|"SWIPE"|"TAP") _ {% d => d[0] %}
transitionType -> ("FADE OUT"|"FADE IN"|"CUT TO") _  {% d => d[0] %}#TODO: fill in rest _
scenePlacement -> ("INT"|"EXT"|"INT/EXT"|"EXT/INT") "." _ {% d => d[0] %}
sceneTime -> ("DAY"|"NIGHT"|"MORNING"|"NOON"|"AFTERNOON"|"DUSK"|"EVENING"|"DAWN") _  {% d => d[0] %} #TODO: fill in rest
shotMovement -> ("STEADICAM"|"HANDHELD"|"POV"|"P.O.V."|"EASE IN") _ SHOTSEP {% d => d[0] %}
shotType -> ("MCU"|"CU"|"EWS"|"MED SHOT") _ SHOTSEP _ {% d => d[0] %} #TODO: fill in rest
SHOT_SUBJECT_SEP -> "/" _ {% d => d[0] %}
AWAIT -> "AWAIT" _ {% d => d[0] %}
AND -> "&&" _ {% d => d[0] %}
OR -> "||" _ {% d => d[0] %}
SHOTSEP -> "-" _ {% d => d[0] %}