
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
unitLine -> TAB (comment|loadScript|transition|sceneHeading|shotFullUnmarker|shotFullMarker|shotFullNoMarker|shotNoDurationUnmarker|shotNoDurationMarker|shotNoDurationNoMarker|shotNoMovementUnmarker|shotNoMovementMarker|shotNoMovementNoMarker|shotNoSourceUnmarker|shotNoSourceMarker|shotNoSourceNoMarker|shotNoSourceNoMovementnmarker|shotNoSourceNoMovementMarker|shotNoSourceNoMovementNoMarker|shotNoSourceNoDurationUnmarker|shotNoSourceNoDurationMarker|shotNoSourceNoDurationNoMarker|shotNoMovementNoDurationUnmarker|shotNoMovementNoDurationMarker|shotNoMovementNoDurationNoMarker|shotNoSourceNoMovementNoDurationUnmarker|shotNoSourceNoMovementNoDurationMarker|shotNoSourceNoMovementNoDurationNoMarker|action|cond) _ comment:?{%
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
#FULL
shotFullUnmarker -> viewType SEP (path _ "," _) path (SEP viewMovement) (SEP timeSpan) (SEP SEP marker) {%
	([viewType, _, viewSource, viewTarget, viewMovement, duration, unmarkers]) => rule('shotFullUnmarker', {viewType, viewSource:viewSource[0], viewTarget, viewMovement: viewMovement[1], duration: duration[1], unmarker: unmarkers})
%}
shotFullMarker -> viewType SEP (path _ "," _) path (SEP viewMovement) (SEP timeSpan) (SEP marker) {%
	([viewType, _, viewSource, viewTarget, viewMovement, duration, markers]) => rule('shotFullMarker', {viewType, viewSource:viewSource[0], viewTarget, viewMovement: viewMovement[1], duration: duration[1], marker: markers[1]})
%}
shotFullNoMarker -> viewType SEP (path _ "," _) path (SEP viewMovement) (SEP timeSpan)  {%
	([viewType, _, viewSource, viewTarget, viewMovement, duration]) => rule('shotFullNoMarker', {viewType, viewSource:viewSource[0], viewTarget, viewMovement: viewMovement[1], duration: duration[1]})
%}
#NO DURATION
shotNoDurationUnmarker -> viewType SEP (path _ "," _) path (SEP viewMovement) (SEP SEP marker) {%
	([viewType, _, viewSource, viewTarget, viewMovement, duration, unmarkers]) => rule('shotNoDurationUnmarker', {viewType, viewSource:viewSource[0], viewTarget, viewMovement: viewMovement[1], unmarker: unmarkers})
%}
shotNoDurationMarker -> viewType SEP (path _ "," _) path (SEP viewMovement) (SEP marker) {%
	([viewType, _, viewSource, viewTarget, viewMovement, duration, markers]) => rule('shotNoDurationMarker', {viewType, viewSource:viewSource[0], viewTarget, viewMovement: viewMovement[1], marker: markers[1]})
%}
shotNoDurationNoMarker -> viewType SEP (path _ "," _) path (SEP viewMovement)  {%
	([viewType, _, viewSource, viewTarget, viewMovement, duration]) => rule('shotNoDurationNoMarker', {viewType, viewSource:viewSource[0], viewTarget, viewMovement: viewMovement[1]})
%}
#NO MOVEMENT
shotNoMovementUnmarker -> viewType SEP (path _ "," _) path (SEP timeSpan) (SEP SEP marker) {%
	([viewType, _, viewSource, viewTarget, duration, unmarkers]) => rule('shotNoMovementUnmarker', {viewType, viewSource:viewSource[0], viewTarget, duration: duration[1], unmarker: unmarkers})
%}
shotNoMovementMarker -> viewType SEP (path _ "," _) path (SEP timeSpan) (SEP marker) {%
	([viewType, _, viewSource, viewTarget, duration, markers]) => rule('shotNoMovementMarker', {viewType, viewSource:viewSource[0], viewTarget, duration: duration[1], marker: markers[1]})
%}
shotNoMovementNoMarker -> viewType SEP (path _ "," _) path (SEP timeSpan)  {%
	([viewType, _, viewSource, viewTarget, duration]) => rule('shotNoMovementNoMarker', {viewType, viewSource:viewSource[0], viewTarget, duration: duration[1]})
%}
#NO SOURCE
shotNoSourceUnmarker -> viewType SEP path (SEP viewMovement) (SEP timeSpan) (SEP SEP marker) {%
	([viewType, _, viewTarget, viewMovement, duration, unmarkers]) => rule('shotNoSourceUnmarker', {viewType, viewSource:viewTarget, viewTarget, viewMovement: viewMovement[1], duration: duration[1], unmarker: unmarkers})
%}
shotNoSourceMarker -> viewType SEP path (SEP viewMovement) (SEP timeSpan) (SEP marker) {%
	([viewType, _, viewTarget, viewMovement, duration, markers]) => rule('shotNoSourceMarker', {viewType, viewSource:viewTarget, viewTarget, viewMovement: viewMovement[1], duration: duration[1], marker: markers[1]})
%}
shotNoSourceNoMarker -> viewType SEP path (SEP viewMovement) (SEP timeSpan)  {%
	([viewType, _, viewTarget, viewMovement, duration]) => rule('shotNoSourceNoMarker', {viewType, viewSource:viewTarget, viewTarget, viewMovement: viewMovement[1], duration: duration[1]})
%}
#NO SOURCE AND NO MOVEMENT
shotNoSourceNoMovementnmarker -> viewType SEP path (SEP timeSpan) (SEP SEP marker) {%
	([viewType, _, viewTarget, duration, unmarkers]) => rule('shotNoSourceNoMovementUnmarker', {viewType, viewSource:viewTarget, viewTarget, duration: duration[1], unmarker: unmarkers})
%}
shotNoSourceNoMovementMarker -> viewType SEP path (SEP timeSpan) (SEP marker) {%
	([viewType, _, viewTarget, duration, markers]) => rule('shotNoSourceNoMovementMarker', {viewType, viewSource:viewTarget, viewTarget, duration: duration[1], marker: markers[1]})
%}
shotNoSourceNoMovementNoMarker -> viewType SEP path (SEP timeSpan)  {%
	([viewType, _, viewTarget, duration]) => rule('shotNoSourceNoMovementNoMarker', {viewType, viewSource:viewTarget, viewTarget, duration: duration[1]})
%}
#NO SOURCE AND NO DURATION
shotNoSourceNoDurationUnmarker -> viewType SEP path (SEP viewMovement) (SEP SEP marker) {%
	([viewType, _, viewTarget, viewMovement, unmarkers]) => rule('shotNoSourceNoDurationUnmarker', {viewType, viewSource:viewTarget, viewTarget, viewMovement: viewMovement[1], unmarker: unmarkers})
%}
shotNoSourceNoDurationMarker -> viewType SEP path (SEP viewMovement) (SEP marker) {%
	([viewType, _, viewTarget, viewMovement, markers]) => rule('shotNoSourceNoDurationMarker', {viewType, viewSource:viewTarget, viewTarget, viewMovement: viewMovement[1], marker: markers[1]})
%}
shotNoSourceNoDurationNoMarker -> viewType SEP path (SEP viewMovement)  {%
	([viewType, _, viewTarget, viewMovement]) => rule('shotNoSourceNoDurationNoMarker', {viewType, viewSource:viewTarget, viewTarget, viewMovement: viewMovement[1]})
%}
#NO MOVEMENT AND NO DURATION
shotNoMovementNoDurationUnmarker -> viewType SEP (path _ "," _) path (SEP SEP marker) {%
	([viewType, _, viewSource, viewTarget, unmarkers]) => rule('shotNoMovementNoDurationUnmarker', {viewType, viewSource:viewSource[0], viewTarget, unmarker: unmarkers})
%}
shotNoMovementNoDurationMarker -> viewType SEP (path _ "," _) path (SEP marker) {%
	([viewType, _, viewSource, viewTarget, markers]) => rule('shotNoMovementNoDurationMarker', {viewType, viewSource:viewSource[0], viewTarget, marker: markers[1]})
%}
shotNoMovementNoDurationNoMarker -> viewType SEP (path _ "," _) path  {%
	([viewType, _, viewSource, viewTarget]) => rule('shotNoMovementNoDurationNoMarker', {viewType, viewSource:viewSource[0], viewTarget})
%}

#NO SOURCE AND NO MOVEMENT AND NO DURATION 
shotNoSourceNoMovementNoDurationUnmarker -> viewType SEP path (SEP SEP marker) {%
	([viewType, _, viewTarget, unmarkers]) => rule('shotNoSourceNoMovementNoDurationUnmarker', {viewType, viewTarget, unmarker: unmarkers})
%}
shotNoSourceNoMovementNoDurationMarker -> viewType SEP path (SEP marker) {%
	([viewType, _, viewTarget, markers]) => rule('shotNoSourceNoMovementNoDurationMarker', {viewType, viewTarget, marker: markers[1]})
%}
shotNoSourceNoMovementNoDurationNoMarker -> viewType SEP path  {%
	([viewType, _, viewTarget]) => rule('shotNoSourceNoMovementNoDurationNoMarker', {viewType, viewTarget})
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