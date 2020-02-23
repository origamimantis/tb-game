'use strict';

import {getTile, inRange} from "./UsefulFunctions.js";
import {LoopSelector} from "./LoopSelector.js";
import {Path, Coord} from "./Path.js";
import {Queue} from "./Queue.js";
import {triggerEvent, respondToEvent, getCost, generatePath} from "./Utils.js";

const SELECT = "Period";
const CANCEL = "Comma";

export const ARROWS = {
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


export class Inputter
{
  constructor(g)
  {
    this.g = g;
    this.inputted = false;

    this.accepting = true;

    this.pressed = {}
    this.wait = 0;

    document.addEventListener( "keydown", ( e ) => {this.onKeyDown( e.code )} );
    document.addEventListener( "keyup", ( e ) => {this.onKeyUp( e.code )} );
  }

  update()
  {
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
      case "KeyX":
	//this.g.toDraw.get("test").shift();
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
    let anything = false;
    for (let dir of Object.keys(ARROWS))
    {
      if (this.stateOf(dir) == KeyState.ONCE)
      {
	once.push(dir);
	anything = true;
      }
      else if (this.stateOf(dir) == KeyState.HELD)
      {
	held.push(dir);
	anything = true;
      }
    }
    return {once: once, held: held, input: anything};
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
  
}

