
@{% 
function deleteNullProps(obj){
	Object.keys(obj).forEach((key) => (obj[key] == null) && delete obj[key])
	return obj
}
%}

#unit lines are dependent on the unit line that preceded them since they are ambiguous otherwise
unitLine -> TAB:? sceneHeading:? shot:? action:?  exp:? transition:? dialogue:? comment:? {%
	//#this thing returns any of the non-terminals as an object like { ruleName: ruleObject}
	([tab, sceneHeading, shot, action,  exp, transition, dialogue, comment]) => deleteNullProps({ depth: tab ? tab.length : 0, sceneHeading: sceneHeading, shot: shot, action: action, exp: exp, transition: transition, dialogue: dialogue, comment: comment })
%}

transition -> transitionType ":" {% (d) => { 
	return ({transitionType:d[0]}) } %}
transitionType -> ("FADE"|"CUT") _ ("IN"|"OUT") _  {% id %}#TODO: fill in rest _

sceneHeading -> scenePlacement sceneName sceneTime {% 
	([scenePlacement, sceneName, sceneTime]) => {
		return ({ scenePlacement, sceneName, sceneTime}) }
%}
scenePlacement -> scenePlacementName "." _ {% d => d[0].join('') %}
scenePlacementName -> ("INT"|"EXT"|"INT/EXT"|"EXT/INT") _ {% id %}
sceneName -> .:+ SEP {% d => d[0].join('') %}
sceneTime -> ("DAY"|"NIGHT"|"MORNING"|"NOON"|"AFTERNOON"|"DUSK"|"EVENING"|"DAWN") _  {% d => d[0].join('') %} 

SEP -> _ "-" _ {% id %}

shot -> camType camSubject:? camSubject:? camMovement:? timeSpan {%
	([camType, camSource, camTarget, camMovement, timeSpan]) => deleteNullProps({camType, camSource, camTarget, camMovement, timeSpan})
%}
camType -> ("MCU"|"CU"|"EWS"|"MED SHOT"|"MED") SEP {% d => d[0].join('') %} #TODO: fill in rest
camSubject -> word (SUBJSEP word):* SEP {% ([root, path]) => { return ({root, path}) } %}
camMovement -> ("STEADICAM"|"HANDHELD"|"POV"|"P.O.V."|"EASE IN") SEP {% d => d[0].join('') %}

timeSpan -> num ":" num _ {% d => { 
	return ({ min: d[0], sec: d[2] }) } %}
num -> [0-9] [0-9] {% d => parseInt(d[0] + d[1]) %}

action -> sentence:+ {% ([text]) => text.join('') %}
sentence -> word .:* [.?!]:+ _ {% d => d[0].concat(d[1]).concat(d[2]) %}
word -> [a-zA-Z,']:+ {% d => d[0].join('')  %} 

dialogue -> word:+ ":" sentence:+ {% ([speaker, _, text]) => { 
	return ({speaker: speaker, text: text}) } %}

exp -> exp _ AND _ exp {% ([lhs, _, op, __, rhs]) => { return ({lhs, op, rhs}) }  %}
	| exp _ OR _ exp {% ([lhs, _, op, __, rhs]) => { return ({lhs, op, rhs}) } %}
	| AWAIT exp {% ([op, rhs]) => { return ({op, rhs}) } %}
	| input exp {% ([op, rhs]) => { return ({op, rhs}) } %}
	| var {% ([rhs]) => { return ({op: "EQT", rhs}) } %}

var -> [A-Z]:+ {% d => d[0].join('') %}

# Whitespace: `_` is optional, `__` is mandatory.
_  -> wschar:* {% () => ' ' %}
__ -> wschar:+ {% () => ' ' %}
wschar -> [ ] {% id %}
#NL -> [\r\n]:+ {% () => null %}
TAB -> [\t]:+ {% id %}
comment -> "#" .:* {% d => d[1].join('') %} 

input -> ("TOUCH"|"SWIPE"|"TAP") __ ("UP"|"DOWN"):? {% ([userAction, direction]) => ({userAction, direction}) %}
AWAIT -> "AWAIT" _ {% id %}

#TODO: fill in rest
SUBJSEP -> _ "/" _ {% id %}
AND -> "AND" _ {% id %}
OR -> "OR" _ {% id %}