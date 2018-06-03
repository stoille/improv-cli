
@{% 
//dnp stands for deleteNullProps
function dnp(obj){
	if(obj){
		Object.keys(obj).forEach((key) => (obj[key] == null) && delete obj[key]) 
	}
	return obj
}

function rule(rule, obj){
	return ({ rule, result: obj })
}

function selector(root, path){
	return ({root, path})
}

function generateTime(time){
	//assign time if none had
	if (!time) {
		return ({min: 0, sec: 0})
	}
	return time
}
%}

#unit lines are dependent on the unit line that preceded them since they are ambiguous otherwise
unitLine -> TAB:? (activeObjects|sceneHeading|shot|action|transition|dialogue|await|exp|comment) _ {%
	//#this thing returns any of the non-terminals as an object like { ruleName: ruleObject}
	([tab, d, _]) => {
		d[0].depth = tab ? tab.length : 0
		return d[0]
	}
%}

transition -> transitionType ":" {% (d) => { 
	return rule('transition',{transitionType:d[0]}) } %}
transitionType -> ("CUT IN"|"CUT"|"DISSOLVE"|"FADE IN"|"FADE OUT"|"FADE TO BLACK"|"SMASH CUT"|"SMASH"|"QUICK SHOT"|"QUICK") _  {% d => d[0][0] %}

sceneHeading -> scenePlacement sceneName sceneTime {% 
	([scenePlacement, sceneName, sceneTime]) => {
		return rule('sceneHeading',{ scenePlacement, sceneName, sceneTime}) }
%}
scenePlacement -> scenePlacementName "." _ {% d => d[0].join('') %}
scenePlacementName -> ("INT"|"EXT"|"INT/EXT"|"EXT/INT") _ {% id %}
sceneName -> .:+ SEP {% d => d[0].join('').trim() %}
sceneTime -> ("DAWN"|"DUSK"|"SUNRISE"|"SUNSET"|"DAY"|"NIGHT"|"MORNING"|"NOON"|"AFTERNOON"|"EVENING"|"MOMENTS"|"LATER"|"CONTINUOUS"|"UNKNOWN") _  {% d => d[0].join('') %}

SEP -> _ "-" _ {% id %}

shot -> camType camSubject:? camSubject:? camMovement:? timeSpan {%
	([camType, camSource, camTarget, camMovement, time]) => rule('shot', {camType, camSource, camTarget, camMovement, time: generateTime(time)})
%}
camType -> ("BCU"|"CA"|"CU"|"ECU"|"ESTABLISHING SHOT"|"ESTABLISHING"|"FULL SHOT"|"FULL"|"EWS"|"EXTREME LONG SHOT"|"EXTREME"|"EYE"|"LEVEL"|"EYE LEVEL"|"FS"|"HAND HELD"|"HIGH ANGLE"|"HIGH"|"LONG LENS SHOT"|"LONG"|"LONG SHOT"|"LOW ANGLE"|"LOW"|"MCU"|"MED"|"MEDIUM LONG SHOT"|"MEDIUM SHOT"|"MEDIUM"|"MID SHOT"|"MID"|"MWS"|"NODDY"|"NODDY SHOT"|"POV"|"PROFILE"|"PROFILE SHOT"|"REVERSE"|"REVERSE SHOT"|"OSS"|"BEV"|"TWO SHOT"|"TWO"|"VWS"|"WEATHER SHOT"|"WEATHER"|"WS") SEP:? {% d => d[0].join('') %}
camSubject -> nameWS ("/" nameWS):* (SEP| _ "," _ ) {% ([root, path]) => { return selector(root, path.map(p=>p[1])) } %}
camMovement -> ("CREEP IN"|"CREEP OUT"|"CREEP"|"CRASH IN"|"CRASH OUT"|"CRASH"|"EASE IN"|"EASE OUT|EASE"|"DTL"|"DOLLY IN"|"DOLLY OUT"|"DOLLY"|"DEEPFOCUS"|"DEEP"|"DUTCH"|"OBLIQUE"|"CANTED"|"OVERHEAD"|"PAN LEFT"|"PAN RIGHT"|"PAN"|"PED UP"|"PED DOWN"|"PUSH IN"|"PUSH OUT"|"PUSH"|"SLANTED"|"STEADICAM"|"TRACKING"|"ZOOM IN"|"ZOOM OUT"|"ZOOM") SEP:? {% d => d[0].join('') %}

timeSpan -> num:? ":":? num _ {% d => { 
	return ({ min: d[0], sec: d[2] }) } %}
num -> [0-9] [0-9]:? {% d => parseInt((d[0] ? d[0] : 0) + (d[1] ? d[1] : 1)) %}

activeObjects -> "[" .:+ "]" {% ([lbr, objects, rbr]) => rule('activeObjects', objects.join('').split(',')) %}

action -> _ sentence:+ {% ([_, text]) => rule('action', { lines: text}) %}

sentence -> _ ([A-Za-z] [^.?!:]:*) [.?!]:+ SEP:? timeSpan:? {% ([_, names, punctuation, s, timeSpan, ss]) => ({text:names[0] + names[1].join('') + punctuation.join(''), time:generateTime(timeSpan)}) %} 

name -> [a-zA-Z,'_]:+ {% d => d[0].join('')  %}
nameWS -> [a-zA-Z,'_ ]:+ {% d => d[0].join('').trim()  %}
opName -> [a-zA-Z_]:+ {% d => d[0].join('').trim()  %}

dialogue -> nameWS ":" sentence:+ {% ([speaker, _, text]) => { 
	return rule('dialogue', {speaker: speaker, lines: text}) } %}

await -> ("AWAIT" SEP) exp SEP:? timeSpan:? {% ([op, rhs, _, time]) => { return rule('await', {time:generateTime(time), rhs}) } %}

exp -> exp (SEP ("AND"|"OR") SEP) exp {% ([lhs, op, rhs]) => { return rule('exp', {lhs, op: op[1][0], rhs}) }  %}
	| (opName SEP):? nameWS ("/" nameWS):* SEP:? timeSpan:? {% ([opName, root, path, ss, time]) => {
			path = path.map( p => p[1])
			opName = opName ? opName[0] : opName
			return rule('exp', {op: opName, time: generateTime(time), rhs: selector(root, path)}) 
		}
%}

# Whitespace: `_` is optional, `__` is mandatory.
_  -> wschar:* {% () => ' ' %}
__ -> wschar:+ {% () => ' ' %}
wschar -> [ ] {% id %}
TAB -> [\t]:+ {% id %}

comment -> "#" .:* {% d => rule('comment', d[1]) %}  