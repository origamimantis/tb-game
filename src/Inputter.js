'use strict';

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

import {getTile, inRange} from "./UsefulFunctions.js";
import {LoopSelector} from "./LoopSelector.js";
import {triggerEvent} from "./Utils.js";

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

    document.addEventListener( "keydown", ( e ) => {this.onKeyDown( e.code )} );
    document.addEventListener( "keyup", ( e ) => {this.onKeyUp( e.code )} );
    document.addEventListener("input_arrowStall", (e) =>{ this.arrowStall(); });
  }
  arrowStall()
  {
    this.accepting = false;
    this.wait = HOLD_DELAY;
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
      triggerEvent("input_arrowStall");
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
    let a = this.arrowStates();

    let delta = {x:0, y:0};
    
    if (a.once.length > 0)
    {
      if (a.held.length == 0)
      {
	for (let d of a.once)
	{
	    delta.x += ARROWS[d].x;
	    delta.y += ARROWS[d].y;
	}
      }
      triggerEvent("input_arrowStall");
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
}






export {Inputter};
