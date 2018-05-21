
@{% 
//dnp stands for deleteNullProps
function dnp(obj){
	if(obj){
		Object.keys(obj).forEach((key) => (obj[key] == null) && delete obj[key]) 
	}
	return obj
}
%}

#unit lines are dependent on the unit line that preceded them since they are ambiguous otherwise
unitLine -> TAB:? sceneHeading:? shot:? action:?  exp:? transition:? dialogue:? comment:? {%
	//#this thing returns any of the non-terminals as an object like { ruleName: ruleObject}
	([tab, sceneHeading, shot, action,  exp, transition, dialogue, comment]) => dnp({ depth: tab ? tab.length : 0, sceneHeading: dnp(sceneHeading), shot: dnp(shot), action: dnp(action), exp: dnp(exp), transition: transition, dialogue: dialogue, comment: comment })
%}

transition -> transitionType ":" {% (d) => { 
	return ({transitionType:d[0]}) } %}
transitionType -> ("CUT IN"|"CUT"|"DISSOLVE"|"FADE IN"|"FADE OUT"|"FADE TO BLACK"|"SMASH CUT"|"SMASH"|"QUICK SHOT"|"QUICK") _  {% d => d[0][0] %}

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
	([camType, camSource, camTarget, camMovement, time]) => dnp({camType, camSource, camTarget, camMovement, time})
%}
camType -> ("BCU"|"CA"|"CU"|"ECU"|"ESTABLISHING SHOT"|"ESTABLISHING"|"FULL SHOT"|"FULL"|"EWS"|"EXTREME LONG SHOT"|"EXTREME"|"EYE"|"LEVEL"|"EYE LEVEL"|"FS"|"HAND HELD"|"HIGH ANGLE"|"HIGH"|"LONG LENS SHOT"|"LONG"|"LONG SHOT"|"LOW ANGLE"|"LOW"|"MCU"|"MED"|"MEDIUM LONG SHOT"|"MEDIUM SHOT"|"MEDIUM"|"MID SHOT"|"MID"|"MWS"|"NODDY"|"NODDY SHOT"|"POV"|"PROFILE"|"PROFILE SHOT"|"REVERSE"|"REVERSE SHOT"|"OSS"|"BEV"|"TWO SHOT"|"TWO"|"VWS"|"WEATHER SHOT"|"WEATHER"|"WS") SEP:? {% d => d[0].join('') %}
camSubject -> word ("/" word):* (SEP| _ "," _ ) {% ([root, path]) => { return ({root, path:path.map(p=>p[1])}) } %}
camMovement -> ("CREEP IN"|"CREEP OUT"|"CREEP"|"CRASH IN"|"CRASH OUT"|"CRASH"|"EASE IN"|"EASE OUT|EASE"|"DTL"|"DOLLY IN"|"DOLLY OUT"|"DOLLY"|"DEEPFOCUS"|"DEEP"|"DUTCH"|"OBLIQUE"|"CANTED"|"OVERHEAD"|"PAN LEFT"|"PAN RIGHT"|"PAN"|"PED UP"|"PED DOWN"|"PUSH IN"|"PUSH OUT"|"PUSH"|"SLANTED"|"STEADICAM"|"TRACKING"|"ZOOM IN"|"ZOOM OUT"|"ZOOM") SEP:? {% d => d[0].join('') %}

timeSpan -> num:? ":":? num _ {% d => { 
	return dnp({ min: d[0], sec: d[2] }) } %}
num -> [0-9] [0-9]:? {% d => parseInt(d[0] + d[1]) %}

action -> _ sentence:+ {% ([_, text]) => ({ lines: text}) %}

sentence -> _ ([A-Za-z] [^.?!:]:*) [.?!]:+ SEP:? timeSpan:? {% ([_, words, punctuation, s, timeSpan, ss]) => dnp({text:words[0] + words[1].join('') + punctuation.join(''), time:timeSpan}) %} 

word -> [a-zA-Z,'_]:+ {% d => d[0].join('')  %} 

dialogue -> .:* ":" sentence:+ {% ([speaker, _, text]) => { 
	return ({speaker: speaker.join(''), lines: text}) } %}

exp -> exp _ "AND" _ exp SEP:? timeSpan:? {% ([lhs, _, op, __, rhs, sep, time]) => { return dnp({type:"exp",lhs, op, rhs, time}) }  %}
	| exp _ "OR" _ exp SEP:? timeSpan:? {% ([lhs, _, op, __, rhs, sep, time]) => { return dnp({type:"exp",lhs, op, rhs, time}) } %}
	| AWAIT exp:? SEP:? timeSpan:? {% ([op, rhs, _, time]) => { return dnp({type:"exp", op, rhs, time}) } %}
	| input exp SEP:? timeSpan:? {% ([op, rhs, _, time]) => { return dnp({type:"exp", op, rhs, time}) } %}
	| word ("/" word):* {% ([root, path]) => { 
		return ({type:"exp", op: "EQT", rhs:{type:"selector", root, path:path.map(p=>p[1])}}) 
		} 
	%}

# Whitespace: `_` is optional, `__` is mandatory.
_  -> wschar:* {% () => ' ' %}
__ -> wschar:+ {% () => ' ' %}
wschar -> [ ] {% id %}
#NL -> [\r\n]:+ {% () => null %}
TAB -> [\t]:+ {% id %}

comment -> "#" .:* {% d => d[1] %}  

input -> ("TOUCH"|"TAP"|"PRESS"|"UP"|"DOWN"|"LEFT"|"RIGHT"|"ZIGZAG"|"CIRCLE"|"CUSTOM") _ {% d => d[0][0] %}
AWAIT -> "AWAIT" _ {% id %}