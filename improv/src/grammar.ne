start -> comment | _ block _

block -> comment | (exp NL:+):? (fromTransition NL:+):? scene #_ NL:* _ exp:? _ NL:* _ 
{%
    (data) => {
        let block = {
            type: "state",
            shouldStart:  data[0],
            blockDepth: data[2], // data[1] is "NL:+"
            fromTransition: data[3],
            toTransition: data[11]
        }
        //TODO: figure out how to parse conditionals
        if(data[6] == "scene"){
          block.scene = data[6]
        } else {
          block.blocks = data[6]
        }
        return block
    }
%}
exp -> var
  | exp AND exp {% ([lhs, _, rhs]) => AND(lhs, rhs) %}
  | exp OR exp {% ([lhs, _, rhs]) => OR(lhs, rhs) %}
  | AWAIT exp {% id %}
  | INPUT exp {% ([_, rhs]) => INPUT(lhs, rhs) %}

var -> WORD {% id %}

scene -> sceneHeading:? shot:+
sceneHeading -> SCENE_PLACEMENT ".":? _ sceneName _ SHOTSEP _ TIME_OF_DAY comment:? NL:+
sceneName -> (_ WORD _):+

shot -> shotHeading:? NL:+ (action|dialogue):+ comment:?
shotHeading -> SHOT_TYPE (_ SHOTSEP _ shotSource _):? (_ SHOTSEP _ shotTarget _):? (_ SHOTSEP _ SHOT_MOVEMENT _):? _ SHOTSEP _ TIME (comment:?|NL:+)
action -> SENTENCE:+ 
TIME -> unsigned_int unsigned_int ":" unsigned_int unsigned_int
unsigned_int -> [0-9]:+ {%
    function(d) {
        return parseInt(d[0].join(""));
    }
%}

shotSource -> shotSubject
shotTarget -> shotSubject
shotSubject -> WORD (_ SHOT_SUBJECT_SEP _ WORD):*

dialogue -> speakerName ":" SENTENCE:+
speakerName -> (_ WORD ".":? "-":? _):+

val -> BOOL
fromTransition ->  _ TRANSITION_TYPE ":" _
toTransition ->  _ TRANSITION_TYPE ":" _

# Whitespace: `_` is optional, `NL:+` is mandatory.
_  -> wschar:* {% () => null %}
__ -> wschar:+ {% () => null %}
wschar -> [ ] {% id %}
NL -> "\r" "\n" | "\r" | "\n" {% id %}
TAB -> [\t] {% id %}

comment -> _ "//" .:* {% () => null %}

SHOT_MOVEMENT -> "STEADICAM"|"HANDHELD"|"POV"|"P.O.V."|"EASE IN"
SENTENCE -> .:* [.?!\n]:+ _
WORD -> [a-zA-Z]:+
INPUT -> "TOUCH"|"SWIPE"|"TAP"
BOOL -> "TRUE"|"FALSE"
TRANSITION_TYPE -> "FADE OUT"|"FADE IN"|"CUT TO" #TODO: fill in rest
SCENE_PLACEMENT -> "INT"|"EXT"|"INT/EXT"|"EXT/INT"
TIME_OF_DAY -> "DAY"|"NIGHT"|"MORNING"|"NOON"|"AFTERNOON"|"DUSK"|"EVENING"|"DAWN" #TODO: fill in rest
SHOT_SUBJECT_SEP -> "/"
SHOT_TYPE -> "MCU"|"CU"|"EWS"|"MED SHOT" #TODO: fill in rest
AWAIT -> "AWAIT"
AND -> "&&"
OR -> "||"
SHOTSEP -> "-"