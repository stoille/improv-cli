//Improv antlr grammar definition 0.1
grammar Improv;

tokens { INDENT, DEDENT }
@lexer::header {
  import com.yuvalshavit.antlr4.DenterHelper;
}
@lexer::members {
  private final DenterHelper denter = new DenterHelper(NL, ImprovParser.INDENT, ImprovParser.DEDENT) {
    @Override
    public Token pullToken() {
      return ImprovLexer.super.nextToken();
    }
  };

  @Override
  public Token nextToken() {
    return denter.nextToken();
  }
}

SPACE : ' ';

TAB : '\t';

COLON :  ':'  ;

VAR : '$' WORD  ;

EQUAL :  '='  ;

QUESTION :  '?'  ;

EXCLAMATION :  '!'  ;

PIPE :  '|'  ;

AMPERSAND :  '&'  ;

PERIOD :  '.'  ;

COMMA :  ','  ;

SEMICOLON :  ';'  ;

DASH :   '-'  ;

FSLASH :  '/'  ;

BSLASH :  '\\'  ;

LT :  '<'  ;

GT :  '>'  ;

LTEQ :  LT EQUAL  ;

GTEQ :  GT EQUAL  ;

EQEQ :  EQUAL EQUAL  ;

NOTEQ :  EXCLAMATION EQUAL  ;

NL: ('\r'? '\n' (TAB)*); //note the TAB*

INT : DIGIT+;

AWAIT: '_await';

fragment
DIGIT : [0-9];

unitDefinition :
	(labeledUnitBlock | unlabeledUnitBlock)+
	;

labeledUnitBlock :
	(unitLabel NL)
	(
		(TAB* statement NL*)+
		(INDENT unitDefinition DEDENT )*
	)+
    ;

unlabeledUnitBlock :
	(
		(TAB* statement NL*)+
		(INDENT unitDefinition DEDENT )*
	)+
    ;

unitLabel: COLON WORD;

statement
    :
    (
      transition
    | sceneHeading
    | shot
    | r_await
   	| dialogue
    | action //action has to go last since it catches all uncaught strings
    )
    ;

r_await: (AWAIT? SPACE* input)|(AWAIT SPACE* expression?);

transition
	: transitionName COLON
	;

sceneHeading
	:
	scenePosition
	sceneName
	(COMMA SPACE* sceneLocation)?
	(DASH SPACE* timeOfDay)?
	//(DASH timeSpan)? //believe this is unnecessary
	;

sceneName : (WORD SPACE*)+;
sceneLocation : (WORD SPACE*)+;

shot
	: shotSizeAngle SPACE* DASH SPACE* shotSubject (SPACE* DASH SPACE* shotMovement)? (SPACE* DASH SPACE* timeSpan)?
	;
shotSubject
	: shotPosition (COMMA SPACE* shotTarget)?
	;

shotPosition : entity;
shotTarget : entity;

entity: entityRoot entityPath*;
entityRoot: WORD;
entityPath: (entityObjectOrientation | entityWorldOrientation | (PERIOD WORD))+;

dialogue : speaker COLON speakerLines;
speaker : WORD;

speakerLines : printContext+;

//print contexts display formatted phrases
printContext : SPACE* (defaultPrintContext|italicPrintContext|boldPrintContext|newLinePrintContext|clearLinePrintContext|dialogueChoicePrintContext) SPACE* printTempo? SPACE*;
printTempo : INT (BSLASH | PIPE)? (INT SPACE*)?;
printPhrase : phrase+ | printTempo;
defaultPrintContext : ('%' 'r'? SPACE*)? printPhrase+; //optional flag on %, %r because is default print context
italicPrintContext : '%i' SPACE* printPhrase+;
boldPrintContext : '%b' SPACE* printPhrase+;
newLinePrintContext : '%n' SPACE* printPhrase+;
clearLinePrintContext : '%nn' SPACE* printPhrase+;
dialogueChoicePrintContext : '%' INT SPACE* printPhrase+; //each dialogue choice 
//TODO: add new contexts for script reference behavior i.e. for player dialog choices

//actions are unit descriptions
action : phrase+;

//phrases are sentences
phrase : (SPACE* (VAR | PERIOD | COMMA | EXCLAMATION | QUESTION | SEMICOLON | WORD) SPACE*)+;

expression
    :
      INT
    | r_bool
    | VAR    
    | input
    | entity
    | expression operatorAnd expression
    | expression operatorOr expression
    | expression operatorMulDiv expression
    | expression operatorAddSub expression
    | expression operatorComparison expression
    | <assoc=right> expression operatorUnary expression
    ;

timeSpan : minute COLON second;
minute : INT;
second : INT;

TRUE: '_true';
FALSE: '_false';

r_bool: TRUE | FALSE;

input: touch | tap | press | trace;

TOUCH: '_touch';
touch: TOUCH SPACE* entity (SPACE* INT)?;

TAP: '_tap';
tap: TAP SPACE* entity (SPACE* INT)? (SPACE* INT)?;

PRESS: '_press';
press: PRESS SPACE* entity (SPACE* INT)?;

UP: '_up';
DOWN: '_down';
LEFT: '_left';
RIGHT: '_right';
ZIGZAG: '_zigzag';
CIRCLE: '_circle';
CUSTOM: '_custom';

trace:  SPACE* (UP | DOWN | LEFT | RIGHT | ZIGZAG | CIRCLE | CUSTOM) SPACE+ entity (SPACE+ INT)?;

operatorOr
	: SPACE* PIPE PIPE SPACE*
	;

operatorAnd
	: SPACE* AMPERSAND AMPERSAND SPACE*
	;

NEAR: '_near';
operatorComparison
	:SPACE* (LT | GT | LTEQ | GTEQ | NOTEQ | EQEQ | NEAR) SPACE*
	;

operatorAddSub
	: SPACE* ('+' | DASH) SPACE*
	;

operatorMulDiv
	: SPACE* ('*' | FSLASH) SPACE*
	;

operatorUnary
    : SPACE* '!' SPACE*;

scenePosition
	: ('INT'
	| 'EXT'
	| 'I/E'
	| 'E/I')
	PERIOD SPACE*
	;

shotSizeAngle
	: ('BCU'
	| 'CA'
	| 'CRASH IN'
	| 'CREEP IN'
	| 'CU'
	| 'CUT IN'
	| 'DIRTY SHOT'
	| 'DTL'
	| 'DUTCH ANGLE'
	| 'ECU'
	| 'ESTABLISHING SHOT'
	| 'FULL SHOT'
	| 'EWS'
	| 'EXTREME LONG SHOT'
	| 'EYE LEVEL'
	| 'FS'
	| 'HIGH ANGLE'
	| 'LONG LENS SHOT'
	| 'LONG SHOT'
	| 'LOW ANGLE'
	| 'MCU'
	| 'MEDIUM SHOT'
	| 'MID SHOT'
	| 'MWS'
	| 'NODDY SHOT'
	| 'OBLIQUE'
	| 'CANTED'
	| 'OSS'
	| 'OVERHEAD SHOT'
	| 'POV'
	| 'PROFILE SHOT'
	| 'PUSH IN'
	| 'REVERSE SHOT'
	| 'SLANTED'
	| 'BIRD EYE VIEW'
	| 'BEV'
	| 'TWO SHOT'
	| 'VWS'
	| 'WEATHER SHOT'
	| 'WS');

shotMovement
	: ('AERIAL'
	| 'ARC'
	| 'CRAB'
	| 'CRANE'
	| 'CRASH ZOOM IN'
	| 'CRASH ZOOM OUT'
	| 'DEFOCUS'
	| 'DOLLY ZOOM'
	| 'CONTRA ZOOM'
	| 'DOLLY OUT'
	| 'DOLLY'
	| 'DOLLY IN'
	| 'DUTCH TILT'
	| 'EASE IN'
	| 'EASE OUT'
	| 'FOLLOW'
	| 'FOCUS'
	| 'HANDHELD'
	| 'JIB'
	| 'PUSH FOCUS'
	| 'PULL FOCUS'
	| 'PAN'
	| 'PEDESTAL'
	| 'PED UP'
	| 'PED DOWN'
	| 'STEADICAM'
	| 'THROW FOCUS'
	| 'TILT'
	| 'TRACKING'
	| 'TRUCKING'
	| 'WHIP PAN'
	| 'ZOOM')
	;

transitionName
 	: ('CUT TO'
	| 'DISSOLVE TO'
	| 'FADE TO'
	| 'FADE TO BLACK'
	| 'FADE OUT'
	| 'SMASH CUT'
	| 'QUICK CUT'
	| 'TIMESPAN CUT')
	;

timeOfDay
	: ('MORNING'
	| 'NOON'
	| 'AFTERNOON'
	| 'EVENING'
	| 'MOMENTS LATER'
	| 'CONTINUOUS'
	| 'UNKNOWN')
	;

entityWorldOrientation
	: '.N'	| '.S'	| '.E'	| '.W'	| '.NW'	| '.NE'	| '.SW'	| '.SE';

entityObjectOrientation
	: '.front'| '.back'	| '.left'	| '.right'	| '.up'	| '.down';

WORD : [a-zA-Z_0-9']+;
LINE_COMMENT : [ \t]* '//' .*? '\n' -> skip ;
COMMENT      : [ \t]* '/*' .*? '*/' -> skip ;

//IMPORTANT: WS skip needs to go last!
//Ignore: ([ \r\n]+ EOF? ) -> skip;