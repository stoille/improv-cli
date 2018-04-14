start ->block _

block -> comment | exp:? scene #_ NL:* _ exp:? _ NL:* _ 
{%
    ([comment, exp, scene]) => {
        return ({
            type: "state",
            //comment:  data[0],
            //blockDepth: data[2], // data[1] is "NL"
            condition: exp,
            scene: scene
        })
    }
%}
exp -> var NL:? {% ([varName]) => ({varName}) %}
  | exp _ AND exp NL {% ([lhs, _, op, rhs]) => ({lhs, op, rhs})  %}
  | exp _ OR exp NL {% ([lhs, _, op, rhs]) => ({lhs, op, rhs}) %}
  | AWAIT exp NL {% ([op, rhs]) => ({op, rhs}) %}
  | input exp NL {% ([op, rhs]) => ({op, rhs}) %}

var -> [A-Z]:+ {% id %}

scene -> fromTransition:? sceneHeading:? {% 
    ([fromTransition, sceneHeading, shot]) => 
        { return ({ fromTransition, sceneHeading, shot})} 
%}
sceneHeading -> scenePlacement sceneName sceneTime NL {% 
    ([scenePlacement, sceneName, sceneTime]) => 
        { return ({ scenePlacement, sceneName, sceneTime})} 
%}
sceneName -> WORD:+ SHOTSEP

shot -> shotHeading:? (action|dialogue):+
shotHeading -> shotType shotSource:? shotTarget:? shotMovement:? timeSpan NL {%
    ([shotType, shotSource, shotTarget, shotMovement, time]) => 
        ({shotType, shotSource, shotTarget, shotMovement, time})
%}
action -> sentence:+ NL {% id %}
timeSpan -> num ":" num _ {% d => { return ({min: d[0], sec: d[2]})}%}
num -> [0-9] [0-9] {% d => parseInt(d[0] + d[1]) %}

shotSource -> shotSubject {% id %}
shotTarget -> shotSubject {% id %}
shotSubject -> WORD (SHOT_SUBJECT_SEP WORD):* SHOTSEP {% id %} #TODO: flesh this one out

dialogue -> speakerName ":" sentence:+ NL {% id %} 
speakerName -> (WORD [.-]:? WORD):+ {% id %} #TODO: space support

fromTransition -> transitionType ":" NL {% (d) => ({transitionType:d[0]}) %}
toTransition -> transitionType ":" NL  {% (d) => ({transitionType:d[0]}) %}

# Whitespace: `_` is optional, `__` is mandatory.
_  -> wschar:* {% () => null %}
__ -> wschar:+ {% () => null %}
wschar -> [ ] {% id %}
NL -> _ ("\r" "\n" | "\r" | "\n"):+ {% id %}
TAB -> [\t] {% id %}

sentence -> (WORD _):+ [.?!] _ {% id %}
WORD -> [a-zA-Z]:+ _ {% id %}

comment -> "//" .:* {% () => null %}

input -> ("TOUCH"|"SWIPE"|"TAP") _ {% id %}
transitionType -> ("FADE OUT"|"FADE IN"|"CUT TO") _  {% id %}#TODO: fill in rest _
scenePlacement -> ("INT"|"EXT"|"INT/EXT"|"EXT/INT") "." _ {% d => d[0] %}
sceneTime -> ("DAY"|"NIGHT"|"MORNING"|"NOON"|"AFTERNOON"|"DUSK"|"EVENING"|"DAWN") _  {% id %}#TODO: fill in rest
shotMovement -> ("STEADICAM"|"HANDHELD"|"POV"|"P.O.V."|"EASE IN") _ SHOTSEP
shotType -> ("MCU"|"CU"|"EWS"|"MED SHOT") _ SHOTSEP {% id %}#TODO: fill in rest
SHOT_SUBJECT_SEP ->"/" _ {% id %}
AWAIT ->"AWAIT" _ {% id %}
AND ->"&&" _ {% id %}
OR ->"||" _ {% id %}
SHOTSEP ->"-" _ {% id %}