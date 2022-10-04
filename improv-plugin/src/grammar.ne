
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
unitLine -> TAB (comment|play|transition|sceneHeading|cond|viewFullUnmarker|viewFullMarker|viewFullNoMarker|viewNoDurationUnmarker|viewNoDurationMarker|viewNoDurationNoMarker|viewNoMovementUnmarker|viewNoMovementMarker|viewNoMovementNoMarker|viewNoSourceUnmarker|viewNoSourceMarker|viewNoSourceNoMarker|viewNoSourceNoMovementnmarker|viewNoSourceNoMovementMarker|viewNoSourceNoMovementNoMarker|viewNoSourceNoDurationUnmarker|viewNoSourceNoDurationMarker|viewNoSourceNoDurationNoMarker|viewNoMovementNoDurationUnmarker|viewNoMovementNoDurationMarker|viewNoMovementNoDurationNoMarker|viewNoSourceNoMovementNoDurationUnmarker|viewNoSourceNoMovementNoDurationMarker|viewNoSourceNoMovementNoDurationNoMarker|action) _ comment:?{%
	//#this thing returns any of the non-terminals as an object like { ruleName: ruleObject}
	([tab, d, ___, comment]) => {
		if(comment) { d[0].comment = comment }
		d[0].depth = tab ? tab.length : 0
		return d[0]
	}
%}

scenePlacement -> ("INT"|"EXT"|"INT/EXT"|"EXT/INT") {% d => d[0].join('') %}
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

condType -> ("INPUT"|"SELECT"|"TRUE"|"FALSE"|"NEAR") {% (d => d[0].join(''))%}

cond -> _ "(" _ cond _ ")" _ {% d => { return d[3] } %}
	| _ cond _ ("&&" | "||") _ cond _ {% ([_, lhs, __, op, ___, rhs]) => { return rule('cond', {op:op == '&&' ? 'AND' : 'OR', lhs,rhs}) } %}
	| condType SEP path (SEP timeSpan):? (SEP timeSpan):? {% ([op, _, path, start, end]) => rule('cond', {op, rhs: path, start: start ? start[1] : 0, end: end ? end[1] : 0 }) %}

viewType -> opName {% d => d[0] %} #-> ("BCU"|"CA"|"CU"|"CUSTOM"|"ECU"|"ESTABLISHING SHOT"|"ESTABLISHING"|"FULL SHOT"|"FULL"|"EWS"|"EXTREME LONG SHOT"|"EXTREME"|"EYE"|"LEVEL"|"EYE LEVEL"|"FS"|"HAND HELD"|"HIGH ANGLE"|"HIGH"|"LONG LENS SHOT"|"LONG"|"LONG SHOT"|"LOW ANGLE"|"LOW"|"MCU"|"MED"|"MEDIUM LONG SHOT"|"MEDIUM SHOT"|"MEDIUM"|"MID SHOT"|"MID"|"MWS"|"NODDY"|"NODDY SHOT"|"POV"|"PROFILE"|"PROFILE SHOT"|"REVERSE"|"REVERSE SHOT"|"OSS"|"BEV"|"TWO SHOT"|"TWO"|"VWS"|"WEATHER SHOT"|"WEATHER"|"WS")  {% d => d[0].join('') %}
path -> wordWS ("/" wordWS):* {% ([root, path]) => { return selector(root, path.map(p=>p[1])) } %}
viewMovement -> ("CREEP IN"|"CREEP OUT"|"CREEP"|"CRASH IN"|"CRASH OUT"|"CRASH"|"EASE IN"|"EASE OUT|EASE"|"DTL"|"DOLLY IN"|"DOLLY OUT"|"DOLLY"|"DEEPFOCUS"|"DEEP"|"DUTCH"|"OBLIQUE"|"CANTED"|"OVERHEAD"|"PAN LEFT"|"PAN RIGHT"|"PAN"|"PED UP"|"PED DOWN"|"PUSH IN"|"PUSH OUT"|"PUSH"|"SLANTED"|"STEADICAM"|"TRACKING"|"ZOOM IN"|"ZOOM OUT"|"ZOOM") SEP:? {% d => d[0].join('') %}

sceneHeading -> scenePlacement SEP (varName (_ "," _)):? varName SEP sceneTime {% 
	([scenePlacement, _, location, sceneName, __, sceneTime]) => {
		return rule('sceneHeading',{ scenePlacement, location: location ? location[0] : undefined, sceneName, sceneTime}) }
%}

play -> ("PLAY") SEP .:+ {% ([playType, _, filePath]) => rule('play', {playType, path:filePath.join('').trim()}) %}

transition -> transitionType (SEP cond):? (SEP timeSpan):? (SEP "\"" path "\""):? {% ([transitionType, cond, duration, path]) => { 
	return rule('transition',{transitionType:transitionType[0],duration: duration ? duration[1] : 0, cond:cond?cond[1] : undefined, path}) } %}
transitionType -> ("CUT"|"FADE") _  {% d => d[0] %}

SEP -> _ "-" _ {% id %}
CONT -> _ "..." _ {% id %}
#FULL
viewFullUnmarker -> viewType SEP (path _ "," _) path (SEP viewMovement) (SEP timeSpan) (SEP SEP marker) {%
	([viewType, _, viewSource, viewTarget, viewMovement, duration, unmarkers]) => rule('viewFullUnmarker', {viewType, viewSource:viewSource[0], viewTarget, viewMovement: viewMovement[1], duration: duration[1], unmarkers: unmarkers[2]})
%}
viewFullMarker -> viewType SEP (path _ "," _) path (SEP viewMovement) (SEP timeSpan) (SEP marker) {%
	([viewType, _, viewSource, viewTarget, viewMovement, duration, markers]) => rule('viewFullMarker', {viewType, viewSource:viewSource[0], viewTarget, viewMovement: viewMovement[1], duration: duration[1], markers: markers[1]})
%}
viewFullNoMarker -> viewType SEP (path _ "," _) path (SEP viewMovement) (SEP timeSpan)  {%
	([viewType, _, viewSource, viewTarget, viewMovement, duration]) => rule('viewFullNoMarker', {viewType, viewSource:viewSource[0], viewTarget, viewMovement: viewMovement[1], duration: duration[1]})
%}
#NO DURATION
viewNoDurationUnmarker -> viewType SEP (path _ "," _) path (SEP viewMovement) (SEP SEP marker) {%
	([viewType, _, viewSource, viewTarget, viewMovement, duration, unmarkers]) => rule('viewNoDurationUnmarker', {viewType, viewSource:viewSource[0], viewTarget, viewMovement: viewMovement[1], unmarkers: unmarkers[2]})
%}
viewNoDurationMarker -> viewType SEP (path _ "," _) path (SEP viewMovement) (SEP marker) {%
	([viewType, _, viewSource, viewTarget, viewMovement, duration, markers]) => rule('viewNoDurationMarker', {viewType, viewSource:viewSource[0], viewTarget, viewMovement: viewMovement[1], markers: markers[1]})
%}
viewNoDurationNoMarker -> viewType SEP (path _ "," _) path (SEP viewMovement)  {%
	([viewType, _, viewSource, viewTarget, viewMovement, duration]) => rule('viewNoDurationNoMarker', {viewType, viewSource:viewSource[0], viewTarget, viewMovement: viewMovement[1]})
%}
#NO MOVEMENT
viewNoMovementUnmarker -> viewType SEP (path _ "," _) path (SEP timeSpan) (SEP SEP marker) {%
	([viewType, _, viewSource, viewTarget, duration, unmarkers]) => rule('viewNoMovementUnmarker', {viewType, viewSource:viewSource[0], viewTarget, duration: duration[1], unmarkers: unmarkers[2]})
%}
viewNoMovementMarker -> viewType SEP (path _ "," _) path (SEP timeSpan) (SEP marker) {%
	([viewType, _, viewSource, viewTarget, duration, markers]) => rule('viewNoMovementMarker', {viewType, viewSource:viewSource[0], viewTarget, duration: duration[1], markers: markers[1]})
%}
viewNoMovementNoMarker -> viewType SEP (path _ "," _) path (SEP timeSpan)  {%
	([viewType, _, viewSource, viewTarget, duration]) => rule('viewNoMovementNoMarker', {viewType, viewSource:viewSource[0], viewTarget, duration: duration[1]})
%}
#NO SOURCE
viewNoSourceUnmarker -> viewType SEP path (SEP viewMovement) (SEP timeSpan) (SEP SEP marker) {%
	([viewType, _, viewTarget, viewMovement, duration, unmarkers]) => rule('viewNoSourceUnmarker', {viewType, viewSource:viewTarget, viewTarget, viewMovement: viewMovement[1], duration: duration[1], unmarkers: unmarkers[2]})
%}
viewNoSourceMarker -> viewType SEP path (SEP viewMovement) (SEP timeSpan) (SEP marker) {%
	([viewType, _, viewTarget, viewMovement, duration, markers]) => rule('viewNoSourceMarker', {viewType, viewSource:viewTarget, viewTarget, viewMovement: viewMovement[1], duration: duration[1], markers: markers[1]})
%}
viewNoSourceNoMarker -> viewType SEP path (SEP viewMovement) (SEP timeSpan)  {%
	([viewType, _, viewTarget, viewMovement, duration]) => rule('viewNoSourceNoMarker', {viewType, viewSource:viewTarget, viewTarget, viewMovement: viewMovement[1], duration: duration[1]})
%}
#NO SOURCE, NO MOVEMENT
viewNoSourceNoMovementnmarker -> viewType SEP path (SEP timeSpan) (SEP SEP marker) {%
	([viewType, _, viewTarget, duration, unmarkers]) => rule('viewNoSourceNoMovementUnmarker', {viewType, viewSource:viewTarget, viewTarget, duration: duration[1], unmarkers: unmarkers[2]})
%}
viewNoSourceNoMovementMarker -> viewType SEP path (SEP timeSpan) (SEP marker) {%
	([viewType, _, viewTarget, duration, markers]) => rule('viewNoSourceNoMovementMarker', {viewType, viewSource:viewTarget, viewTarget, duration: duration[1], markers: markers[1]})
%}
viewNoSourceNoMovementNoMarker -> viewType SEP path SEP timeSpan  {%
	([viewType, _, viewTarget, __, duration]) => rule('viewNoSourceNoMovementNoMarker', {viewType, viewSource:viewTarget, viewTarget, duration})
%}
#NO SOURCE, NO DURATION
viewNoSourceNoDurationUnmarker -> viewType SEP path (SEP viewMovement) (SEP SEP marker) {%
	([viewType, _, viewTarget, viewMovement, unmarkers]) => rule('viewNoSourceNoDurationUnmarker', {viewType, viewSource:viewTarget, viewTarget, viewMovement: viewMovement[1], unmarkers: unmarkers[2]})
%}
viewNoSourceNoDurationMarker -> viewType SEP path (SEP viewMovement) (SEP marker) {%
	([viewType, _, viewTarget, viewMovement, markers]) => rule('viewNoSourceNoDurationMarker', {viewType, viewSource:viewTarget, viewTarget, viewMovement: viewMovement[1], markers: markers[1]})
%}
viewNoSourceNoDurationNoMarker -> viewType SEP path (SEP viewMovement)  {%
	([viewType, _, viewTarget, viewMovement]) => rule('viewNoSourceNoDurationNoMarker', {viewType, viewSource:viewTarget, viewTarget, viewMovement: viewMovement[1]})
%}
#NO MOVEMENT, NO DURATION
viewNoMovementNoDurationUnmarker -> viewType SEP (path _ "," _) path (SEP SEP marker) {%
	([viewType, _, viewSource, viewTarget, unmarkers]) => rule('viewNoMovementNoDurationUnmarker', {viewType, viewSource:viewSource[0], viewTarget, unmarkers: unmarkers[2]})
%}
viewNoMovementNoDurationMarker -> viewType SEP (path _ "," _) path (SEP marker) {%
	([viewType, _, viewSource, viewTarget, markers]) => rule('viewNoMovementNoDurationMarker', {viewType, viewSource:viewSource[0], viewTarget, markers: markers[1]})
%}
viewNoMovementNoDurationNoMarker -> viewType SEP (path _ "," _) path  {%
	([viewType, _, viewSource, viewTarget]) => rule('viewNoMovementNoDurationNoMarker', {viewType, viewSource:viewSource[0], viewTarget})
%}

#NO SOURCE, NO MOVEMENT, NO DURATION 
viewNoSourceNoMovementNoDurationUnmarker -> viewType SEP path (SEP SEP marker) {%
	([viewType, _, viewTarget, unmarkers]) => rule('viewNoSourceNoMovementNoDurationUnmarker', {viewType, viewTarget, unmarkers: unmarkers[2]})
%}
viewNoSourceNoMovementNoDurationMarker -> viewType SEP path (SEP marker) {%
	([viewType, _, viewTarget, markers]) => rule('viewNoSourceNoMovementNoDurationMarker', {viewType, viewTarget, markers: markers[1]})
%}
viewNoSourceNoMovementNoDurationNoMarker -> viewType SEP path  {%
	([viewType, _, viewTarget]) => rule('viewNoSourceNoMovementNoDurationNoMarker', {viewType, viewTarget})
%}

timeSpan -> ([0-9]:+ ":"):? ([0-9]:+ ":"):? [0-9]:+ {% ([min, sec, ms]) => timeToMS(min ? min[0].join('') : undefined, sec ? sec[0].join('') : undefined, ms ? ms.join('') : undefined) %}
#num -> [0-9]:? [0-9] {% (d1,d2) => parseInt(`${d1 ? d1 : ''}${d2}`) %}

action -> (word ":"):? sentence:+ {% ([speaker, lines]) => rule('action', {speaker, lines}) %}

sentence -> (wordWSC ("." | "?" | "!"):+):+ _ timeSpan:? {% ([text, _, timeSpan]) => ({text:text.map(t=>t[0] + t[1]).join(''), duration:timeSpan?timeSpan:0}) %} 

marker -> opName ((_ "," _) opName):* {% d => [d[0], ...(d[1]?d[1].map(dd=>dd[1]):[])]  %}
#unmarker -> SEP SEP opName ((_ "," _) opName):* {% d => [d[2], ...(d[3]?d[3].map(dd=>dd[1]):[])] %}
word -> [a-zA-Z,']:+ {% d => d[0].join('').trim()  %}
wordWS -> [a-zA-Z] [a-zA-Z'\]\[_ \.!?]:+ {% d => d[0] + d[1].join('').trim()  %}
wordWSC -> [a-zA-Z] [a-zA-Z,'\]\[_ \.!?]:+ {% d => d[0] + d[1].join('').trim()  %}
opName -> [a-zA-Z_]:+ {% d => d[0].join('')  %}
varName-> [a-zA-Z'_ ]:+ {% d => d[0].join('').trim()  %}

# Whitespace: `_` is optional, `__` is mandatory.
_  -> wschar:* {% () => ' ' %}
__ -> wschar:+ {% () => ' ' %}
wschar -> [ ] {% id %}
TAB -> [\t]:* {% id %}

comment -> "#" .:* {% d => rule('comment', d[1].join('')) %}  