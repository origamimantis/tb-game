'use strict';

import {getTile, inRange} from "./UsefulFunctions.js";
import {LoopSelector} from "./LoopSelector.js";
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

    this.delta = {x: 0,
		  y: 0};

    this.accepting = true;


    this.pressed = {}
    this.wait = 0;

    this.selectEvent = this.select_map;
    this.cancelEvent = this.noAction;
    this.handleArrows = this.arrow_mapMove;

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
      this.g.toDraw["selectedUnitmovable"] = unit.movable(this.g);
      this.selectEvent = this.select_unitMoveLocation;
      this.cancelEvent = this.cancel_unitMoveLocation;
    }
  }

  select_unitMoveLocation()
  {
  }
  
  cancel_unitMoveLocation()
  {
      delete this.g.toDraw["selectedUnitmovable"];
      this.selectEvent = this.select_map;
      this.cancelEvent = this.noAction;
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
  

  update()
  {
    this.handleArrows();
  }

  arrow_mapMove()
  {
    let a = this.arrowStates();

    let delta = {x:0, y:0};
    
    if (a.once.length > 0)
    {
	for (let d of a.once)
	{
	    delta.x += ARROWS[d].x;
	    delta.y += ARROWS[d].y;
	}
      triggerEvent("input_arrowStall", {start : a.held.length == 0});
    }
    else// if nothing was pressed this tick
    {

      if (this.accepting == true)
      {
	for (let d of a.held)
	{
	  delta.x += ARROWS[d].x;
	  delta.y += ARROWS[d].y;
	}
      }
    }


    this.g.cursor.move(delta.x, delta.y);

    this.updateHeld();
    this.updateArrowAccept();

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
  cursorMoved()
  {
    for (let i of Object.values(this.delta))
    {
      if (i != 0)
      {
	return true;
      }
    }
    return false;
  }
  
  noAction()
  {
  }
}





export {Inputter};
