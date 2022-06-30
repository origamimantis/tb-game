'use strict';

import {getTile, inRange} from "./UsefulFunctions.js";
import {LoopSelector} from "./LoopSelector.js";
import {Path, Coord} from "./Path.js";
import {Queue} from "./Queue.js";
import {triggerEvent, getCost, generatePath} from "./Utils.js";

const SELECT = "Period";
const CANCEL = "Comma";
const INFORM = "Semicolon";

export const ARROW =  {
			UP : "KeyW",
			DOWN : "KeyS",
			LEFT : "KeyA",
			RIGHT : "KeyD"
		      }

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

let LOGKEYS = false;

export function toggleLog()
{
  LOGKEYS = !LOGKEYS;
  return "Log: " + (LOGKEYS?"on":"off");
}


export class Inputter
{
  static init(m)
  {
    this.inputted = false;
    this.accepting = true;
    this.pressed = {};
    this.m = m;
  }

  static update()
  {
    this.updateHeld();
    this.updateArrowAccept();
  }
 
  static arrowStall(start, speed)
  {
    this.accepting = false;

    if (start === null)
    {
	this.wait = speed;
    }
    else
    {
      if (start == true)
      {
	this.wait = HOLD_DELAY;
      }
      else
      {
	this.wait = HOLD_DELAY - speed;
      }
    }
  }

  static stateOf( key)
  {
    if (this.pressed[key] == undefined)
    {
      return KeyState.OFF;
    }
    return this.pressed[key];
  }

  static onKeyDown( key )
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
      case INFORM:
	triggerEvent("input_inform");
	break;
      //case "KeyX":
	//this.g.toDraw.toggleVisible("fps");
	//triggerEvent("game_test");
      }
    }
    else
    {
      this.pressed[key] = KeyState.HELD;
    }
  }
  static onKeyUp( key )
  {
    LOGKEYS && console.log("up: ", key);
    delete this.pressed[key];
  }

  static arrowStates()
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
  


  static updateHeld()
  {
    for (let dir of Object.keys(this.pressed))
    {
      if (this.stateOf(dir) == KeyState.ONCE)
      {
	this.pressed[dir] = KeyState.HELD;
      }
    }
  }
  static updateArrowAccept()
  {
    if (--this.wait <= 0)
    {
      this.accepting = true;
    }
  }
  
}

