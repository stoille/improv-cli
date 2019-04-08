
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
	let t = {min: 0, sec: 0}
	//assign time if none had
	if (time) {
		t.min = time && time.min ? time.min : 0
		t.sec = time && time.sec ? time.sec : 0
	}
	return t
}

function flattenDeep(arr1) {
   return arr1.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), []);
}
%}

#unit lines are dependent on the unit line that preceded them since they are ambiguous otherwise
unitLine -> _ TAB _ (comment|transition|sceneHeading|shot|action|dialogue|cond) _ comment:?{%
	//#this thing returns any of the non-terminals as an object like { ruleName: ruleObject}
	([_,tab, __, d, ___, comment]) => {
		if(comment) { d[0].comment = comment }
		d[0].depth = tab ? tab.length : 0
		return d[0]
	}
%}

transition -> transitionType (":" _) cond:? (SEP:? timeSpan):? {% ([transitionType, _, cond, transitionTime]) => { 
	return rule('transition',{transitionType:transitionType[0],transitionTime: generateTime(transitionTime ? transitionTime[1] : undefined), cond:cond}) } %}
transitionType -> ("CUT IN"|"CUT"|"DISSOLVE"|"FADE IN"|"FADE OUT"|"FADE TO BLACK"|"SMASH CUT"|"SMASH"|"QUICK SHOT"|"QUICK") _  {% d => d[0] %}

sceneHeading -> scenePlacement SEP (varName (_ "," _)):? varName SEP sceneTime {% 
	([scenePlacement, _, scene, location, __, sceneTime]) => {
		return rule('sceneHeading',{ scenePlacement, scene: scene ? scene[0] : undefined, location, sceneTime}) }
%}
scenePlacement -> ("INT"|"EXT"|"INT/EXT"|"EXT/INT") {% d => d[0][0] %}
sceneTime -> ("DAWN"|"DUSK"|"SUNRISE"|"SUNSET"|"DAY"|"NIGHT"|"MORNING"|"NOON"|"AFTERNOON"|"EVENING"|"MOMENTS"|"LATER"|"CONTINUOUS"|"UNKNOWN") {% d => d[0].join('') %}

SEP -> _ "-" _ {% id %}
CONT -> _ "..." _ {% id %}

shot -> viewType SEP (viewSubject _ "," _):? viewSubject (SEP viewMovement):? (SEP timeSpan):? {%
	([viewType, _, viewSource, viewTarget, viewMovement, shotTime]) => rule('shot', {viewType, viewSource:viewSource ? viewSource[0] : undefined, viewTarget, viewMovement: viewMovement ? viewMovement[1] : undefined, shotTime: generateTime(shotTime ? shotTime[1] : undefined)})
%}
viewType -> ("BCU"|"CA"|"CU"|"ECU"|"ESTABLISHING SHOT"|"ESTABLISHING"|"FULL SHOT"|"FULL"|"EWS"|"EXTREME LONG SHOT"|"EXTREME"|"EYE"|"LEVEL"|"EYE LEVEL"|"FS"|"HAND HELD"|"HIGH ANGLE"|"HIGH"|"LONG LENS SHOT"|"LONG"|"LONG SHOT"|"LOW ANGLE"|"LOW"|"MCU"|"MED"|"MEDIUM LONG SHOT"|"MEDIUM SHOT"|"MEDIUM"|"MID SHOT"|"MID"|"MWS"|"NODDY"|"NODDY SHOT"|"POV"|"PROFILE"|"PROFILE SHOT"|"REVERSE"|"REVERSE SHOT"|"OSS"|"BEV"|"TWO SHOT"|"TWO"|"VWS"|"WEATHER SHOT"|"WEATHER"|"WS")  {% d => d[0].join('') %}
viewSubject -> nameWS ("/" nameWS):* {% ([root, path]) => { return selector(root, path.map(p=>p[1])) } %}
viewMovement -> ("CREEP IN"|"CREEP OUT"|"CREEP"|"CRASH IN"|"CRASH OUT"|"CRASH"|"EASE IN"|"EASE OUT|EASE"|"DTL"|"DOLLY IN"|"DOLLY OUT"|"DOLLY"|"DEEPFOCUS"|"DEEP"|"DUTCH"|"OBLIQUE"|"CANTED"|"OVERHEAD"|"PAN LEFT"|"PAN RIGHT"|"PAN"|"PED UP"|"PED DOWN"|"PUSH IN"|"PUSH OUT"|"PUSH"|"SLANTED"|"STEADICAM"|"TRACKING"|"ZOOM IN"|"ZOOM OUT"|"ZOOM") SEP:? {% d => d[0].join('') %}

timeSpan -> num:? ":":? num _ {% d => { 
	return ({ min: d[0], sec: d[2] }) } %}
num -> [0-9]:? [0-9] {% d => parseInt((d[0] ? d[0] : 0) * 10 + parseInt(d[1] ? d[1] : 0)) %}

action -> sentence:+ marker:? {% ([lines, marker]) => rule('action', {lines, marker}) %}

sentence -> nameWS [.?!]:+ _ timeSpan:? {% ([text, punctuation, _, timeSpan]) => ({text, time:generateTime(timeSpan)}) %} 

marker -> SEP varName {% d => d[1]  %}
nameWS -> [a-zA-Z,'_ ]:+ {% d => d[0].join('').trim()  %}
opName -> [a-zA-Z_]:+ {% d => d[0].join('')  %}

dialogue -> nameWS ":" sentence:+ {% ([speaker, _, lines]) => { 
	return rule('dialogue', {speaker: speaker, lines}) } %}
#TODO: more robust conditional expression syntax
varName-> [a-zA-Z'_ ]:+ {% d => d[0].join('').trim()  %}
cond -> SEP:? cond (SEP ("AND" | "OR") SEP) cond {% ([isParallel, lhs, op, rhs]) => { return rule('cond', {op:op[1][0],isParallel: isParallel?true:false, lhs,rhs}) } %}
	| SEP:? opName SEP varName ("/" varName):* ((_ "," _) varName ("/" varName):*):* {% ([isParallel, op, _, root, path, params]) => { 
			let s1 = selector(root, path ? path.map(pp=>pp[2]) : undefined)
			let sn = params ? params.map( p => selector(p[1],p[2] ? p[2].map(pp => pp[1]): undefined)) : undefined
			return rule('cond', {op, isParallel: isParallel?true:false, rhs: [s1, ...sn]})} %}

# Whitespace: `_` is optional, `__` is mandatory.
_  -> wschar:* {% () => ' ' %}
__ -> wschar:+ {% () => ' ' %}
wschar -> [ ] {% id %}
TAB -> [\t]:* {% id %}

comment -> _ "#" .:* {% d => rule('comment', d[2].join('')) %}  