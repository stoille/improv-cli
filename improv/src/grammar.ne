
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
unitLine -> TAB:? (comment|transition|sceneHeading|shot|action|dialogue|cond) comment:?{%
	//#this thing returns any of the non-terminals as an object like { ruleName: ruleObject}
	([tab, d, comment]) => {
		if(comment) { d.comment = comment }
		d[0].depth = tab ? tab.length : 0
		return d[0]
	}
%}

transition -> transitionType ":" _ cond:? {% ([transitionType, _, __, cond]) => { 
	return rule('transition',{transitionType:transitionType[0], cond:cond ? cond.result : null}) } %}
transitionType -> ("CUT IN"|"CUT"|"DISSOLVE"|"FADE IN"|"FADE OUT"|"FADE TO BLACK"|"SMASH CUT"|"SMASH"|"QUICK SHOT"|"QUICK") _  {% d => d[0] %}

sceneHeading -> scenePlacement sceneName sceneTime {% 
	([scenePlacement, sceneName, sceneTime]) => {
		return rule('sceneHeading',{ scenePlacement, sceneName, sceneTime}) }
%}
scenePlacement -> scenePlacementName SEP {% d => d[0].join('') %}
scenePlacementName -> ("INT"|"EXT"|"INT/EXT"|"EXT/INT") _ {% id %}
sceneName -> .:+ SEP {% d => d[0].join('').trim() %}
sceneTime -> ("DAWN"|"DUSK"|"SUNRISE"|"SUNSET"|"DAY"|"NIGHT"|"MORNING"|"NOON"|"AFTERNOON"|"EVENING"|"MOMENTS"|"LATER"|"CONTINUOUS"|"UNKNOWN") _  {% d => d[0].join('') %}

SEP -> _ "-" _ {% id %}

shot -> viewType viewSubject viewSubject:? viewMovement:? (timeSpan _ ("," _ timeSpan):?):? {%
	([viewType, viewSource, viewTarget, viewMovement, transitionTime, shotTime]) => rule('shot', {viewType, viewSource, viewTarget, viewMovement, transitionTime: generateTime(transitionTime), time: generateTime(shotTime)})
%}
viewType -> ("BCU"|"CA"|"CU"|"ECU"|"ESTABLISHING SHOT"|"ESTABLISHING"|"FULL SHOT"|"FULL"|"EWS"|"EXTREME LONG SHOT"|"EXTREME"|"EYE"|"LEVEL"|"EYE LEVEL"|"FS"|"HAND HELD"|"HIGH ANGLE"|"HIGH"|"LONG LENS SHOT"|"LONG"|"LONG SHOT"|"LOW ANGLE"|"LOW"|"MCU"|"MED"|"MEDIUM LONG SHOT"|"MEDIUM SHOT"|"MEDIUM"|"MID SHOT"|"MID"|"MWS"|"NODDY"|"NODDY SHOT"|"POV"|"PROFILE"|"PROFILE SHOT"|"REVERSE"|"REVERSE SHOT"|"OSS"|"BEV"|"TWO SHOT"|"TWO"|"VWS"|"WEATHER SHOT"|"WEATHER"|"WS") SEP {% d => d[0].join('') %}
viewSubject -> nameWS ("/" nameWS):* (SEP| _ "," _ ):? {% ([root, path]) => { return selector(root, path.map(p=>p[1])) } %}
viewMovement -> ("CREEP IN"|"CREEP OUT"|"CREEP"|"CRASH IN"|"CRASH OUT"|"CRASH"|"EASE IN"|"EASE OUT|EASE"|"DTL"|"DOLLY IN"|"DOLLY OUT"|"DOLLY"|"DEEPFOCUS"|"DEEP"|"DUTCH"|"OBLIQUE"|"CANTED"|"OVERHEAD"|"PAN LEFT"|"PAN RIGHT"|"PAN"|"PED UP"|"PED DOWN"|"PUSH IN"|"PUSH OUT"|"PUSH"|"SLANTED"|"STEADICAM"|"TRACKING"|"ZOOM IN"|"ZOOM OUT"|"ZOOM") SEP:? {% d => d[0].join('') %}

timeSpan -> num:? ":":? num _ {% d => { 
	return ({ min: d[0], sec: d[2] }) } %}
num -> [0-9] [0-9]:? {% d => parseInt((d[0] ? d[0] : 0) + (d[1] ? d[1] : 1)) %}

action -> sentence:+ {% ([body]) => rule('action', body) %}

sentence -> nameWS [.?!\r\n]:+ SEP:? timeSpan:? {% ([text, punctuation, _, timeSpan]) => ({text:text, time:generateTime(timeSpan)}) %} 

name -> [a-zA-Z,'_]:+ {% d => d[0].join('')  %}
nameWS -> [a-zA-Z,'_ ]:+ {% d => d[0].join('').trim()  %}
opName -> [a-zA-Z_]:+ {% d => d[0].join('').trim()  %}

dialogue -> nameWS ":" sentence:+ {% ([speaker, _, text]) => { 
	return rule('dialogue', {speaker: speaker, lines: text}) } %}

cond -> (opName SEP):? nameWS ("/" nameWS):* SEP:? timeSpan:? (_ "," _ cond):* {% ([opName, root, path, ss, time, conds]) => {
			path = path.map( p => p[1])
			opName = opName ? opName[0] : opName
			let c1 = {op: opName, time: generateTime(time), rhs: selector(root, path)}
			let cn = conds ? [c1, ...conds.map(c => c[3].result[0])] : [c1]
			return rule('cond', cn) 
		}
%}

# Whitespace: `_` is optional, `__` is mandatory.
_  -> wschar:* {% () => ' ' %}
__ -> wschar:+ {% () => ' ' %}
wschar -> [ ] {% id %}
TAB -> [\t]:+ {% id %}

comment -> _ "#" .:* {% d => rule('comment', d[2].join('')) %}  