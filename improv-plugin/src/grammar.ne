
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

function timeToMS(n1, n2, n3) {
	let min = n1 && n2 && n3 ? n1 : n1 && n3 ? n1 : n2 && n3 ? n2 : '0'
	let sec = n1 && n2 && n3 ? n2 : n3
	let ms = n1 && n2 && n3 || !n1 && !n2 ? n3 : '0'

	let totalMS = 0
	if(min){
		const minToMS = m => m * 60 * 1000
		totalMS += minToMS(parseInt(min))
	}
	if(sec){
		const secToMS = s => s * 1000
		totalMS += secToMS(parseInt(sec))
	}
	if(ms){
		totalMS += parseInt(ms)
	}	
	
	return totalMS
}

function flattenDeep(arr1) {
   return arr1.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), []);
}
%}

#unit lines are dependent on the unit line that preceded them since they are ambiguous otherwise
unitLine -> TAB (comment|play|transition|sceneHeading|cond|view|action) _ comment:?{%
	//#this thing returns any of the non-terminals as an object like { ruleName: ruleObject}
	([tab, d, ___, comment]) => {
		if(comment) { d[0].comment = comment }
		d[0].depth = tab ? tab.length : 0
		return d[0]
	}
%}

sceneTime -> ("DAWN"|"DUSK"|"SUNRISE"|"SUNSET"|"DAY"|"NIGHT"|"MORNING"|"NOON"|"AFTERNOON"|"EVENING"|"MOMENTS"|"LATER"|"CONTINUOUS"|"UNKNOWN") {% d => d[0].join('') %}

#TODO: more robust conditional expression syntax
#	expr ::= mulexpr { addop mulexpr }
#	addop ::= "+" | "-"
#	mulexpr ::= powexpr { mulop powexpr }
#	mulop ::= "*" | "/"
#	powexpr ::= "-" powexpr | "+" powexpr | atom [ "^" powexpr ]
#	atom ::= ident [ "(" expr ")" ] | numeric | "(" expr ")"
#	numeric ::= /[0-9]+(\.[0-9]*)?([eE][\+\-]?[0-9]+)?/
#	ident ::= /[A-Za-z_][A-Za-z_0-9]*/

cond -> _ "(" _ cond _ ")" _ {% d => { return d[3] } %}
	| _ cond _ ("AND" | "&&" | "OR" | "||") _ cond _ {% ([_, lhs, __, op, ___, rhs]) => { return rule('cond', {op:op == ('AND' || '&&') ? 'AND' : ('OR' || '||') ? 'OR' : undefined, lhs,rhs}) } %}
	| ("INPUT"|"SELECT"|"TRUE"|"FALSE"|"NEAR"|"TAP") SEP pathWithRange (SEP timeSpan):? (SEP timeSpan):? {% ([op, _, path, start, end]) => rule('cond', {op: op[0], rhs: path, start: start ? start[1] : 0, end: end ? end[1] : 0 }) %}

viewType -> ("BLACK"|"BCU"|"CA"|"CU"|"CUSTOM"|"ECU"|"ESTABLISHING SHOT"|"ESTABLISHING"|"FULL SHOT"|"FULL"|"EWS"|"EXTREME LONG SHOT"|"EXTREME"|"EYE"|"LEVEL"|"EYE LEVEL"|"FS"|"FISHEYE"|"HAND HELD"|"HIGH ANGLE"|"HIGH"|"LONG LENS SHOT"|"LONG"|"LONG SHOT"|"LOW ANGLE"|"LOW"|"MCU"|"MED"|"MEDIUM LONG SHOT"|"MEDIUM SHOT"|"MEDIUM"|"MID SHOT"|"MID"|"MWS"|"NODDY"|"NODDY SHOT"|"POV"|"PROFILE"|"PROFILE SHOT"|"REVERSE"|"REVERSE SHOT"|"OSS"|"BEV"|"TWO SHOT"|"TWO"|"VWS"|"WEATHER SHOT"|"WEATHER"|"WS")  {% d => d[0].join('') %}

viewMovement -> ("CREEP IN"|"CREEP OUT"|"CREEP"|"CRASH IN"|"CRASH OUT"|"CRASH"|"EASE IN"|"EASE OUT"|"DTL"|"DOLLY IN"|"DOLLY OUT"|"DOLLY"|"DEEPFOCUS"|"DEEP"|"DUTCH"|"OBLIQUE"|"CANTED"|"OVERHEAD"|"PAN LEFT"|"PAN RIGHT"|"PAN"|"PED UP"|"PED DOWN"|"PUSH IN"|"PUSH OUT"|"PUSH"|"SLANTED"|"STEADICAM"|"TRACKING"|"ZOOM IN"|"ZOOM OUT"|"ZOOM") SEP:? {% d => d[0].join('') %}

sceneHeading -> ("INT"|"EXT"|"INT/EXT"|"EXT/INT") SEP (varName (_ "," _)):? varName SEP sceneTime {% 
	([scenePlacement, _, location, sceneName, __, sceneTime]) => {
		return rule('sceneHeading',{ scenePlacement, location: location ? location[0].trim() : undefined, sceneName, sceneTime}) }
%}

play -> ("PLAY") SEP path {% ([playType, _, filePath]) => rule('play', {playType, path:filePath.join('').trim()}) %}

transition -> ("CUT"|"FADE") (SEP timeSpan):? (SEP cond):? (SEP path):? {% ([transitionType, duration, cond, path]) => { 
	return rule('transition',{transitionType,duration: duration ? duration[1] : 0, cond:cond?cond[1] : undefined, path: path ? path[1] : undefined}) } %}

SEP -> _ "-" _ {% id %}
CONT -> _ "..." _ {% id %}

view -> viewType SEP pathWithRange ("," pathWithRange):? (SEP viewMovement):? (SEP timeSpan):? (SEP marker|SEP SEP marker):? {%
	([viewType, _, viewSource, viewTarget, viewMovement, duration, markers]) => rule('view', {
		viewType, 
		viewSource:viewSource, 
		viewTarget : viewTarget ? viewTarget[1] : viewSource, 
		viewMovement: viewMovement ? viewMovement[1] : null, 
		duration: duration ? duration[1] : -1, 
		setMarkers: !markers ? undefined : (markers.length == 2 ? markers[1]:[]), 
		unsetMarkers: !markers ? undefined : (markers.length == 3 ? markers[2]:[]), 
		})
%}

timeSpan -> ([0-9]:+ ":"):? ([0-9]:+ ":"):? [0-9]:+ {% ([min, sec, ms]) => timeToMS(min ? min[0].join('') : undefined, sec ? sec[0].join('') : undefined, ms ? ms.join('') : undefined) %}
#num -> [0-9]:? [0-9] {% (d1,d2) => parseInt(`${d1 ? d1 : ''}${d2}`) %}

action -> (word ": "):? sentence:+ {% ([speaker, lines]) => rule('action', {speaker, lines}) %}

path -> "/":? wordWS ("/" wordWS):* {% ([isRootDir, root, path]) => ({ root, path: path.map(p => p[1].trim()), isRootDir: isRootDir ? true : false }) %}

pathWithRange -> path ("/" [0-9]:* ".." [0-9]:+):? {% 
([path, range]) =>{
		let from = range ? range[1] : undefined
		let to = range ? range[3].join('') : undefined
		return ({
			path, 
			from: from && from.length > 0 ? parseInt(from.join('')) : 0, 
			to: to ? to : from,
			})
	}
%}

sentence -> (wordWSC ("." | "?" | "!"):+):+ _ timeSpan:? {% ([text, _, timeSpan]) => ({text:text.map(t=>t[0] + t[1]).join(''), duration:timeSpan?timeSpan:0}) %} 

marker -> opName ((_ "," _) opName):* {% d => [d[0], ...(d[1]?d[1].map(dd=>dd[1]):[])]  %}
#unmarker -> SEP SEP opName ((_ "," _) opName):* {% d => [d[2], ...(d[3]?d[3].map(dd=>dd[1]):[])] %}
word -> [a-zA-Z,']:+ {% d => d[0].join('').trim()  %}
wordWS -> [a-zA-Z' ]:+ {% d => d[0].join('').trim()  %}
wordWSC -> [a-zA-Z' ,]:+ {% d => d[0].join('').trim()  %}
opName -> [a-zA-Z_]:+ {% d => d[0].join('')  %}
varName-> [a-zA-Z'_ ]:+ {% d => d[0].join('').trim()  %}

# Whitespace: `_` is optional, `__` is mandatory.
_  -> wschar:* {% () => ' ' %}
__ -> wschar:+ {% () => ' ' %}
wschar -> [ ] {% id %}
TAB -> [\t]:* {% id %}

comment -> "#" .:* {% d => rule('comment', d[1].join('')) %}  