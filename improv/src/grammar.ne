block -> (TAB state):+ {% d => [].concat.apply([], d[0]) %} 

state -> scene exp:* {%
	([scene, subStates]) => {
		return ({
			scene,
			subStates
		})
	}
%}

scene -> fromTransition:? sceneHeading:? shot {% 
	([fromTransition, sceneHeading, shot]) => {
		return ({ fromTransition, sceneHeading, shot}) }
%}

exp -> TAB var NL block {% ([tab, varName, nl, tabs, subStates]) => { return ({varName, subStates}) } %}
	| TAB exp _ AND exp {% ([tab, lhs, _, op, rhs]) => { return ({lhs, op, rhs}) }  %}
	| TAB exp _ OR exp {% ([tab, lhs, _, op, rhs]) => { return ({lhs, op, rhs}) } %}
	| TAB AWAIT exp {% ([tab, op, rhs]) => { return ({op, rhs}) } %}
	| TAB input exp {% ([tab, op, rhs]) => { return ({op, rhs}) } %}

var -> [A-Z]:+ {% d => d[0].join('') %}

sceneHeading -> TAB scenePlacement sceneName sceneTime NL {% 
	([tab, scenePlacement, sceneName, sceneTime]) => {
		return ({ scenePlacement, sceneName, sceneTime}) }
%}
sceneName -> sentence SHOTSEP {% d => d[0].join(' ') %}

shot -> TAB shotType shotSource:? shotTarget:? shotMovement:? timeSpan NL (dialogue|.:* NL) {%
	([tab, shotType, shotSource, shotTarget, shotMovement, timeSpan, _, action, dialogue]) => {
		return ({shotType, shotSource, shotTarget, shotMovement, timeSpan, action: [].concat.apply([], action).join('')}) }
%}
action -> TAB sentence:+ {% ([tab, text]) => { 
	return ({text}) } %}
sentence -> WORD:+ _ NL:? {% id  %}
WORD -> [a-zA-Z,'.?!-]:+ __ {% d => d[0].join('')  %}

timeSpan -> num ":" num _ {% d => { 
	return ({ min: d[0], sec: d[2] }) } %}
num -> [0-9] [0-9] {% d => parseInt(d[0] + d[1]) %}

shotSource -> shotSubject {% id %}
shotTarget -> shotSubject {% id %}
shotSubject -> WORD (SHOT_SUBJECT_SEP WORD):* SHOTSEP {% ([root, path]) => { 
	return ({root, path}) } %}

dialogue -> TAB speakerName ":" sentence:+ NL {% ([tab, speaker, _, text]) => { 
	return ({speaker: speaker, text: text}) } %}
speakerName -> (WORD [.-]:? WORD):+ {% d => d[0].join('') %} #TODO: space support

fromTransition -> transitionType ":" NL {% (d) => { 
	return ({transitionType:d[0]}) } %}
toTransition -> transitionType ":" NL  {% (d) => { 
	return ({transitionType:d[0]}) } %}

# Whitespace: `_` is optional, `__` is mandatory.
_  -> wschar:* {% () => ' ' %}
__ -> wschar:+ {% () => ' ' %}
wschar -> [ ] {% id %}
NL -> _ ("\r" "\n" | "\r" | "\n"):* {% () => null %}
TAB -> [\t]:* {% id %} #TODO: investigate if space is needed

comment -> "//" .:* {% () => null %}

input -> ("TOUCH"|"SWIPE"|"TAP") _ {% d => d[0].join('') %}
transitionType -> ("FADE OUT"|"FADE IN"|"CUT TO") _  {% d => d[0].join('') %}#TODO: fill in rest _
scenePlacement -> ("INT"|"EXT"|"INT/EXT"|"EXT/INT") "." _ {% d => d[0].join('') %}
sceneTime -> ("DAY"|"NIGHT"|"MORNING"|"NOON"|"AFTERNOON"|"DUSK"|"EVENING"|"DAWN") _  {% d => d[0].join('') %} #TODO: fill in rest
shotMovement -> ("STEADICAM"|"HANDHELD"|"POV"|"P.O.V."|"EASE IN") _ SHOTSEP {% d => d[0].join('') %}
shotType -> ("MCU"|"CU"|"EWS"|"MED SHOT") _ SHOTSEP _ {% d => d[0].join('') %} #TODO: fill in rest
SHOT_SUBJECT_SEP -> "/" _ {% d => d[0].join('') %}
AWAIT -> "AWAIT" _ {% d => d[0].join('') %}
AND -> "&&" _ {% d => d[0].join('') %}
OR -> "||" _ {% d => d[0].join('') %}
SHOTSEP -> "-" _ {% id %}