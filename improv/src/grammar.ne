script -> state:+ {% d => [].concat.apply([], d[0]) %} 

state -> [\t]:* (scene | exp) {%
	([depth, scene, subStates]) => {
		return ({
			depth,
			scene,
			subStates
		})
	}
%}

scene -> fromTransition:? sceneHeading shot:+ {% 
	([fromTransition, setting, shots]) => {
		return ({ fromTransition, setting, shots}) }
%}
fromTransition -> transitionType ":" NL {% (d) => { 
	return ({transitionType:d[0]}) } %}
toTransition -> transitionType ":" NL  {% (d) => { 
	return ({transitionType:d[0]}) } %}

exp -> var NL state NL {% ([varName, nl, subStates]) => { return ({varName, subStates}) } %}
	| exp _ AND exp {% ([lhs, _, op, rhs]) => { return ({lhs, op, rhs}) }  %}
	| exp _ OR exp {% ([lhs, _, op, rhs]) => { return ({lhs, op, rhs}) } %}
	| AWAIT exp {% ([op, rhs]) => { return ({op, rhs}) } %}
	| input exp {% ([op, rhs]) => { return ({op, rhs}) } %}

var -> [A-Z]:+ {% d => d[0].join('') %}

sceneHeading -> scenePlacement sceneName sceneTime NL {% 
	([scenePlacement, sceneName, sceneTime]) => {
		return ({ scenePlacement, sceneName, sceneTime}) }
%}
scenePlacement -> ("INT"|"EXT"|"INT/EXT"|"EXT/INT") "." _ {% d => d[0].join('') %}
sceneName -> .:+ SEP {% d => d[0].join('') %}
sceneTime -> ("DAY"|"NIGHT"|"MORNING"|"NOON"|"AFTERNOON"|"DUSK"|"EVENING"|"DAWN") _  {% d => d[0].join('') %} 

#TODO: replace .:* for action here
#TODO: restore (exp|dialogue|action)
#TODO: investigate why action:+ runs out of memory
shot -> camType camSubject:? camSubject:? camMovement:? timeSpan NL (action) {%
	([camType, camSource, camTarget, camMovement, timeSpan, _, actions, dialogue]) => {
		return ({camType, camSource, camTarget, camMovement, timeSpan, actions}) }
%}
camType -> ("MCU"|"CU"|"EWS"|"MED SHOT"|"MED") SEP {% d => d[0].join('') %} #TODO: fill in rest
camSubject -> word (SUBJSEP word):* SEP {% ([root, path]) => { return ({root, path}) } %}
camMovement -> ("STEADICAM"|"HANDHELD"|"POV"|"P.O.V."|"EASE IN") SEP {% d => d[0].join('') %}

timeSpan -> num ":" num _ {% d => { 
	return ({ min: d[0], sec: d[2] }) } %}
num -> [0-9] [0-9] {% d => parseInt(d[0] + d[1]) %}

#TODO: investigate why sentences sometimes ignore _:* after punctuation? ex: 'space. ok' vs. 'no space.not ok'
action -> sentence:+ NL:* {% ([text]) => { 
	return text.join('') } %}
sentence -> .:+ [.?!]:+ _ {% d => d[0].concat(d[1]).join('') %}
word -> [a-zA-Z,']:+ {% d => d[0].join('')  %} #took out '-'

dialogue -> word:+ ":" sentence:+ NL {% ([speaker, _, text]) => { 
	return ({speaker: speaker, text: text}) } %}

# Whitespace: `_` is optional, `__` is mandatory.
_  -> wschar:* {% () => ' ' %}
__ -> wschar:+ {% () => ' ' %}
wschar -> [ ] {% id %}
NL -> [\r\n\t ]:+ {% () => null %}
#TAB -> [\t ]:* {% id %} #TODO: investigate if space is needed

comment -> "//" .:* {% () => null %} #TODO: fix comment

input -> ("TOUCH"|"SWIPE"|"TAP") __ {% d => d[0].join('') %}
transitionType -> ("FADE OUT"|"FADE IN"|"CUT TO") _  {% d => d[0].join('') %}#TODO: fill in rest _
#TODO: fill in rest
SUBJSEP -> _ "/" _ {% d => d[0].join('') %}
AWAIT -> _ "AWAIT" _ {% d => d[0].join('') %}
AND -> _ "&&" _ {% d => d[0].join('') %}
OR -> _ "||" _ {% d => d[0].join('') %}
SEP -> _ "-" _ {% id %}