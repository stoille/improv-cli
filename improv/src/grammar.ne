
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
unitLine -> TAB:? activeObjects:? sceneHeading:? shot:? action:? transition:? dialogue:? exp:?  comment:? _ {%
	//#this thing returns any of the non-terminals as an object like { ruleName: ruleObject}
	([tab, activeObjects, sceneHeading, shot, action, transition, dialogue, exp, comment, _]) => dnp({ depth: tab ? tab.length : 0, activeObjects: activeObjects, sceneHeading: dnp(sceneHeading), shot: dnp(shot), action: dnp(action), exp: dnp(exp), transition: transition, dialogue: dialogue, comment: comment })
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
camSubject -> name ("/" name):* (SEP| _ "," _ ) {% ([root, path]) => { return ({root, path:path.map(p=>p[1])}) } %}
camMovement -> ("CREEP IN"|"CREEP OUT"|"CREEP"|"CRASH IN"|"CRASH OUT"|"CRASH"|"EASE IN"|"EASE OUT|EASE"|"DTL"|"DOLLY IN"|"DOLLY OUT"|"DOLLY"|"DEEPFOCUS"|"DEEP"|"DUTCH"|"OBLIQUE"|"CANTED"|"OVERHEAD"|"PAN LEFT"|"PAN RIGHT"|"PAN"|"PED UP"|"PED DOWN"|"PUSH IN"|"PUSH OUT"|"PUSH"|"SLANTED"|"STEADICAM"|"TRACKING"|"ZOOM IN"|"ZOOM OUT"|"ZOOM") SEP:? {% d => d[0].join('') %}

timeSpan -> num:? ":":? num _ {% d => { 
	return dnp({ min: d[0], sec: d[2] }) } %}
num -> [0-9] [0-9]:? {% d => parseInt(d[0] + d[1]) %}

activeObjects -> "[" .:+ "]" {% ([lbr, objects, rbr]) => objects.join('').split(',') %}

action -> _ sentence:+ {% ([_, text]) => ({ lines: text}) %}

sentence -> _ ([A-Za-z] [^.?!:]:*) [.?!]:+ SEP:? timeSpan:? {% ([_, names, punctuation, s, timeSpan, ss]) => dnp({text:names[0] + names[1].join('') + punctuation.join(''), time:timeSpan}) %} 

name -> [a-zA-Z,'_]:+ {% d => d[0].join('')  %}
nameWS -> [a-zA-Z,'_ ]:+ {% d => d[0].join('')  %}

dialogue -> .:* ":" sentence:+ {% ([speaker, _, text]) => { 
	return ({speaker: speaker.join(''), lines: text}) } %}

exp -> exp _ ("AND"|"&&") _ exp SEP:? timeSpan:? {% ([lhs, _, op, __, rhs, sep, time]) => { return dnp({type:"exp",lhs, op, rhs, time}) }  %}
	| exp _ ("OR"|"||") _ exp SEP:? timeSpan:? {% ([lhs, _, op, __, rhs, sep, time]) => { return dnp({type:"exp",lhs, op, rhs, time}) } %}
	| AWAIT exp:? SEP:? timeSpan:? {% ([op, rhs, _, time]) => { return dnp({type:"exp", op, rhs, time}) } %}
	| [\"] nameWS ("/" nameWS):* [\"] SEP:? [a-zA-Z_]:+ SEP:? timeSpan:? {% ([lqt, root, path, rqt, sep, eventName, ___, time]) => {
			path = path.map( p => p[1])
			return ({type:"exp", op: eventName.join(''), time, rhs:{type:"selector", root, path}}) 
		}
%}

# Whitespace: `_` is optional, `__` is mandatory.
_  -> wschar:* {% () => ' ' %}
__ -> wschar:+ {% () => ' ' %}
wschar -> [ ] {% id %}
TAB -> [\t]:+ {% id %}

comment -> "#" .:* {% d => d[1] %}  
AWAIT -> "AWAIT" _ {% id %}