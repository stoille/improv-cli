
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

function timeToMS(min, sec, secOrMS) {
	if(!min){
		min = 0
	}
	if(!sec){
		if(secOrMS){
			secOrMS *= 1000
		}
		sec = 0
	}
	if(!secOrMS){
		secOrMS = 0;
	}
	
	const minToSec = min => 60 * min
	const secToMS = sec => 1000 * sec
	return secToMS(minToSec(min) + sec) + secOrMS
}

function flattenDeep(arr1) {
   return arr1.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), []);
}
%}

#unit lines are dependent on the unit line that preceded them since they are ambiguous otherwise
unitLine -> TAB (comment|loadScript|transition|sceneHeading|shot|action|cond) _ comment:?{%
	//#this thing returns any of the non-terminals as an object like { ruleName: ruleObject}
	([tab, d, ___, comment]) => {
		if(comment) { d[0].comment = comment }
		d[0].depth = tab ? tab.length : 0
		return d[0]
	}
%}

loadScript -> "% " .:+ {% ([_, filePath]) => rule('loadScript', {path:filePath.join('')}) %}

transition -> transitionType (SEP cond):? (SEP timeSpan):? {% ([transitionType, cond, transitionTime]) => { 
	return rule('transition',{transitionType:transitionType[0],transitionTime: transitionTime ? transitionTime[1] : 0, cond:cond?cond[1] : undefined}) } %}
transitionType -> ("CUT IN"|"CUT"|"DISSOLVE"|"FADE IN"|"FADE OUT"|"FADE TO BLACK"|"SMASH CUT"|"SMASH"|"QUICK SHOT"|"QUICK") _  {% d => d[0] %}

sceneHeading -> scenePlacement SEP (varName (_ "," _)):? varName SEP sceneTime {% 
	([scenePlacement, _, scene, location, __, sceneTime]) => {
		return rule('sceneHeading',{ scenePlacement, scene: scene ? scene[0] : undefined, location, sceneTime}) }
%}
scenePlacement -> ("INT"|"EXT"|"INT/EXT"|"EXT/INT") {% d => d[0][0] %}
sceneTime -> ("DAWN"|"DUSK"|"SUNRISE"|"SUNSET"|"DAY"|"NIGHT"|"MORNING"|"NOON"|"AFTERNOON"|"EVENING"|"MOMENTS"|"LATER"|"CONTINUOUS"|"UNKNOWN") {% d => d[0].join('') %}

SEP -> _ "-" _ {% id %}
CONT -> _ "..." _ {% id %}

shot -> viewType SEP (path _ "," _):? path (SEP viewMovement):? (SEP timeSpan):? (SEP marker:? (SEP marker):?):? {%
	([viewType, _, viewSource, viewTarget, viewMovement, duration, markers]) => rule('shot', {viewType, viewSource:viewSource ? viewSource[0] : undefined, viewTarget, viewMovement: viewMovement ? viewMovement[1] : undefined, duration: duration ? duration[1] : 0, marker: markers ? markers[1] : [], unmarker: markers && markers[2] ? markers[2][1] : []})
%}
viewType -> ("BCU"|"CA"|"CU"|"ECU"|"ESTABLISHING SHOT"|"ESTABLISHING"|"FULL SHOT"|"FULL"|"EWS"|"EXTREME LONG SHOT"|"EXTREME"|"EYE"|"LEVEL"|"EYE LEVEL"|"FS"|"HAND HELD"|"HIGH ANGLE"|"HIGH"|"LONG LENS SHOT"|"LONG"|"LONG SHOT"|"LOW ANGLE"|"LOW"|"MCU"|"MED"|"MEDIUM LONG SHOT"|"MEDIUM SHOT"|"MEDIUM"|"MID SHOT"|"MID"|"MWS"|"NODDY"|"NODDY SHOT"|"POV"|"PROFILE"|"PROFILE SHOT"|"REVERSE"|"REVERSE SHOT"|"OSS"|"BEV"|"TWO SHOT"|"TWO"|"VWS"|"WEATHER SHOT"|"WEATHER"|"WS")  {% d => d[0].join('') %}
path -> wordWS ("/" wordWS):* {% ([root, path]) => { return selector(root, path.map(p=>p[1])) } %}
viewMovement -> ("CREEP IN"|"CREEP OUT"|"CREEP"|"CRASH IN"|"CRASH OUT"|"CRASH"|"EASE IN"|"EASE OUT|EASE"|"DTL"|"DOLLY IN"|"DOLLY OUT"|"DOLLY"|"DEEPFOCUS"|"DEEP"|"DUTCH"|"OBLIQUE"|"CANTED"|"OVERHEAD"|"PAN LEFT"|"PAN RIGHT"|"PAN"|"PED UP"|"PED DOWN"|"PUSH IN"|"PUSH OUT"|"PUSH"|"SLANTED"|"STEADICAM"|"TRACKING"|"ZOOM IN"|"ZOOM OUT"|"ZOOM") SEP:? {% d => d[0].join('') %}

timeSpan -> num:? ":":? num:? ":":? num {% ([min, _, sec, __, secOrMS]) => timeToMS(min, sec, secOrMS) %}
num -> [0-9]:? [0-9] {% d => parseInt(`${d[0]}${d[1]}`) %}

action -> (word ":"):? sentence:+ {% ([speaker, lines]) => rule('action', {speaker, lines}) %}

sentence -> (wordWSC ("." | "?" | "!"):+):+ _ timeSpan:? {% ([text, _, timeSpan]) => ({text:text.map(t=>t[0] + t[1]).join(''), duration:timeSpan?timeSpan:0}) %} 

marker -> opName ((_ "," _) opName):* {% d => [d[0], ...(d[1]?d[1].map(dd=>dd[1]):[])]  %}
#unmarker -> SEP SEP opName ((_ "," _) opName):* {% d => [d[2], ...(d[3]?d[3].map(dd=>dd[1]):[])] %}
word -> [a-zA-Z,']:+ {% d => d[0].join('').trim()  %}
wordWS -> [a-zA-Z] [a-zA-Z'\]\[\(\)_ \.!?]:+ {% d => d[0] + d[1].join('').trim()  %}
wordWSC -> [a-zA-Z] [a-zA-Z,'\]\[\(\)_ \.!?]:+ {% d => d[0] + d[1].join('').trim()  %}
opName -> [a-zA-Z_]:+ {% d => d[0].join('')  %}

#TODO: more robust conditional expression syntax
varName-> [a-zA-Z'_ ]:+ {% d => d[0].join('').trim()  %}
cond -> cond (SEP ("AND" | "OR") SEP) cond {% ([lhs, op, rhs]) => { return rule('cond', {op:op[1][0], lhs,rhs}) } %}
	| opName SEP path (SEP timeSpan):? (SEP timeSpan):? {% ([op, _, path, start, end]) => 
			rule('cond', {op, rhs: path, start: start ? start[1] : 0, end: end ? end[1] : 0 }) %}

# Whitespace: `_` is optional, `__` is mandatory.
_  -> wschar:* {% () => ' ' %}
__ -> wschar:+ {% () => ' ' %}
wschar -> [ ] {% id %}
TAB -> [\t]:* {% id %}

comment -> "#" .:* {% d => rule('comment', d[1].join('')) %}  