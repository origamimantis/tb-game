'use strict';

import {getTile, inRange} from "./UsefulFunctions.js";
import {LoopSelector} from "./LoopSelector.js";
import {Coord} from "./Path.js";
import {triggerEvent, respondToEvent} from "./Utils.js";

const SELECT = "Period";
const CANCEL = "Comma";

const ARROWS = {
		"KeyW" : {x: 0, y:-1},
		"KeyS" : {x: 0, y: 1},
		"KeyA" : {x:-1, y: 0},
		"KeyD" : {x: 1, y: 0}
		}

const KeyState = {
		OFF : 0,
		ONCE: 1,
		HELD : 2
}

const HOLD_DELAY = 12;

const LOGKEYS = false;


class Inputter
{
  constructor(g)
  {
    this.g = g;
    this.inputted = false;

    this.accepting = true;
    this.arrowOutsideMovable = false;


    this.pressed = {}
    this.wait = 0;

    this.selectEvent = this.select_map;
    this.cancelEvent = this.noAction;
    this.handleArrows = this.arrow_map;

    document.addEventListener( "keydown", ( e ) => {this.onKeyDown( e.code )} );
    document.addEventListener( "keyup", ( e ) => {this.onKeyUp( e.code )} );
    
    respondToEvent("input_arrowStall", (e) =>{ this.arrowStall(e.start); });

    respondToEvent("input_select",  () => {this.selectEvent();});
    respondToEvent("input_cancel",  () => {this.cancelEvent();});
  }
  
  select_map()
  {
    let unit = this.g.Map.getTile(this.g.cursor.x, this.g.cursor.y).unit;
    if (unit != null)
    {
      this.g.selectedUnit = unit;
      this.g.toDraw["selectedUnitMovable"] = unit.movable(this.g);
      this.selectEvent = this.select_unitMoveLocation;
      this.cancelEvent = this.cancel_unitMoveLocation;
      this.handleArrows = this.arrow_unitMoveLocation;
    }
  }

  select_unitMoveLocation()
  {
    let target = new Coord( this.g.cursor.x, this.g.cursor.y );

    // TODO TODO TODO something's goin wrong here, can move to outside of movebox
    if (this.g.toDraw.selectedUnitMovable.containsCoord(target));
    {
      this.g.selectedUnit.tentativeMove(this.g, target.x, target.y);
    }
  }
  
  cancel_unitMoveLocation()
  {
      delete this.g.selectedUnit;
      delete this.g.toDraw["selectedUnitMovable"];
      this.selectEvent = this.select_map;
      this.cancelEvent = this.noAction;
      this.handleArrows = this.arrow_map;
  }

  arrow_map()
  {
    let a = this.arrowStates();

    let delta = new Coord(0,0);
    
    if (a.once.length > 0)
    {
      for (let d of a.once)
      {
	  delta.add( ARROWS[d] );
      }
      triggerEvent("input_arrowStall", {start : a.held.length == 0});
    }
    // if nothing was pressed this tick
    else if (this.accepting == true)
    {
      for (let d of a.held)
      {
	delta.add( ARROWS[d] );
      }
    }
    this.g.cursor.move(delta);
  }

  arrow_unitMoveLocation()
  {
    let a = this.arrowStates();

    let delta = new Coord(0,0);
    
    if (a.once.length > 0)
    {
      for (let d of a.once)
      {
	  delta.add( ARROWS[d] );
      }

      triggerEvent("input_arrowStall", {start : a.held.length == 0});
      // usually outside movable == false. If keypressed, allow it to go outside but only if moves outside
      this.arrowOutsideMovable = !(this.g.toDraw.selectedUnitMovable.containsCoord(this.g.cursor.resultOf(delta)));
      this.g.cursor.move(delta);
    }
    // if nothing was pressed this tick
    else if (this.accepting == true)
    {
      for (let d of a.held)
      {
	delta.add( ARROWS[d] );
      }
      
      let inside = this.g.toDraw.selectedUnitMovable.containsCoord(this.g.cursor.resultOf(delta));

      if (this.arrowOutsideMovable == true || inside)
      {
	this.g.cursor.move(delta);
	if (inside == true)
	{
	  this.arrowOutsideMovable = false;
	}
      }
    }
  }
 
  update()
  {
    this.handleArrows();

    this.updateHeld();
    this.updateArrowAccept();
  }
 
  arrowStall(start)
  {
    this.accepting = false;
    if (start == true)
    {
      this.wait = HOLD_DELAY;
    }
    else
    {
      this.wait = HOLD_DELAY - this.g.cursor.speed;
    }
  }

  stateOf( key)
  {
    if (this.pressed[key] == undefined)
    {
      return KeyState.OFF;
    }
    return this.pressed[key];
  }

  onKeyDown( key )
  {
    LOGKEYS && console.log("dn: ", key);

    if (this.pressed[key] == undefined)
    {
      this.pressed[key] = KeyState.ONCE;
      switch (key)
      {
      case SELECT:
	triggerEvent("input_select");
	break;
      case CANCEL:
	triggerEvent("input_cancel");
	break;
      }
    }
    else
    {
      this.pressed[key] = KeyState.HELD;
    }
  }
  onKeyUp( key )
  {
      LOGKEYS && console.log("up: ", key);
      delete this.pressed[key];
      triggerEvent("input_arrowStall", {start : false});
  }

  arrowStates()
  {
    let once = [];
    let held = [];
    for (let dir of Object.keys(ARROWS))
    {
      if (this.stateOf(dir) == KeyState.ONCE)
      {
	once.push(dir);
      }
      else if (this.stateOf(dir) == KeyState.HELD)
      {
	held.push(dir);
      }
    }
    return {once: once, held, held};
  }
  


  updateHeld()
  {
    for (let dir of Object.keys(this.pressed))
    {
      if (this.stateOf(dir) == KeyState.ONCE)
      {
	this.pressed[dir] = KeyState.HELD;
      }
    }
  }
  updateArrowAccept()
  {
    if (--this.wait <= 0)
    {
      this.accepting = true;
    }
  }
  
  noAction()
  {
  }
}





export {Inputter};
