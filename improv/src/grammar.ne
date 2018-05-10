
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
transitionType -> ("CUT IN"|"CUT"|"DISSOLVE"|"FADE IN"|"FADE OUT"|"FADE TO BLACK"|"SMASH CUT"|"SMASH"|"QUICK SHOT"|"QUICK") _ ("IN"|"OUT"):? _  {% id %}

sceneHeading -> scenePlacement sceneName sceneTime {% 
	([scenePlacement, sceneName, sceneTime]) => {
		return ({ scenePlacement, sceneName, sceneTime}) }
%}
scenePlacement -> scenePlacementName "." _ {% d => d[0].join('') %}
scenePlacementName -> ("INT"|"EXT"|"INT/EXT"|"EXT/INT") _ {% id %}
sceneName -> .:+ SEP {% d => d[0].join('') %}
sceneTime -> ("DAWN"|"DUSK"|"SUNRISE"|"SUNSET"|"DAY"|"NIGHT"|"MORNING"|"NOON"|"AFTERNOON"|"EVENING"|"MOMENTS"|"LATER"|"CONTINUOUS"|"UNKNOWN") _  {% d => d[0].join('') %}

SEP -> _ "-" _ {% id %}

shot -> camType camSubject:? camSubject:? camMovement:? timeSpan {%
	([camType, camSource, camTarget, camMovement, timeSpan]) => deleteNullProps({camType, camSource, camTarget, camMovement, timeSpan})
%}
camType -> ("BCU"|"CA"|"CU"|"ECU"|"ESTABLISHING SHOT"|"ESTABLISHING"|"FULL SHOT"|"FULL"|"EWS"|"EXTREME LONG SHOT"|"EXTREME"|"EYE"|"LEVEL"|"EYE LEVEL"|"FS"|"HAND HELD"|"HIGH ANGLE"|"HIGH"|"LONG LENS SHOT"|"LONG"|"LONG SHOT"|"LOW ANGLE"|"LOW"|"MCU"|"MED"|"MEDIUM LONG SHOT"|"MEDIUM SHOT"|"MEDIUM"|"MID SHOT"|"MID"|"MWS"|"NODDY"|"NODDY SHOT"|"POV"|"PROFILE"|"PROFILE SHOT"|"REVERSE"|"REVERSE SHOT"|"OSS"|"BEV"|"TWO SHOT"|"TWO"|"VWS"|"WEATHER SHOT"|"WEATHER"|"WS") SEP:? {% d => d[0].join('') %}
camSubject -> word ("/" word):* (SEP| _ "," _ ) {% ([root, path]) => { return ({root, path:path.map(p=>p[1])}) } %}
camMovement -> ("CREEP IN"|"CREEP OUT"|"CREEP"|"CRASH IN"|"CRASH OUT"|"CRASH"|"EASE IN"|"EASE OUT|EASE"|"DTL"|"DOLLY IN"|"DOLLY OUT"|"DOLLY"|"DEEPFOCUS"|"DEEP"|"DUTCH"|"OBLIQUE"|"CANTED"|"OVERHEAD"|"PAN LEFT"|"PAN RIGHT"|"PAN"|"PED UP"|"PED DOWN"|"PUSH IN"|"PUSH OUT"|"PUSH"|"SLANTED"|"STEADICAM"|"TRACKING"|"ZOOM IN"|"ZOOM OUT"|"ZOOM") SEP:? {% d => d[0].join('') %}

timeSpan -> num:? ":" num _ {% d => { 
	return ({ min: d[0], sec: d[2] }) } %}
num -> [0-9] [0-9] {% d => parseInt(d[0] + d[1]) %}

action -> _ sentence:+ {% ([_, text]) => ({ lines: text}) %}

#originally: word .:* [.?!]:+ _ {% d => d[0].concat(d[1]).concat(d[2]) %}
sentence -> _ .:* [.?!]:+ _ timeSpan:? {% ([_, words, punctuation, s, timeSpan, ss]) => ({text:words.join('') + punctuation.join(''), time:timeSpan}) %} 

word -> [a-zA-Z,']:+ {% d => d[0].join('')  %} 

dialogue -> word:+ ":" sentence:+ {% ([speaker, _, text]) => { 
	return ({speaker: speaker.join(''), lines: text}) } %}

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

input -> ("TOUCH"|"TAP"|"PRESS") _ ("UP"|"DOWN"|"LEFT"|"RIGHT"|"ZIGZAG"|"CIRCLE"|"CUSTOM"):? {% ([userAction, direction]) => ({userAction, direction}) %}
AWAIT -> "AWAIT" _ {% id %}

#TODO: fill in rest
AND -> "AND" _ {% id %}
OR -> "OR" _ {% id %}