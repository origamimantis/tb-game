'use strict';

import {triggerEvent} from "./Utils.js";

const LOGKEYS = false;

class KeyTracker
{
    constructor()
    {
	this.pressed = {}
      this.pressedThisTick = [];
    }

    isDown( keyCode )
    {
	return this.pressed[keyCode] >= 1;
    }
    isHeld( keyCode )
    {
	return this.pressed[keyCode] > 1;
    }
  allPressed()
  {
    return pressedThisTick;
  }
 
  onKeyDown( e )
  {
    if (LOGKEYS)
    {
	console.log("dn: ",e.code);
    }
    if (this.pressed[e.code] == undefined)
    {
      this.pressed[e.code] = 1;
      triggerEvent("input_keydown", {code: e.code});
    }
    else
    {
      ++ this.pressed[e.code];
      this.pressedThisTick.push(e.code);
      for (let t of Object.keys(this.pressed))
      {
	++ this.pressed[t];
      }
    }
  }
  onKeyUp( e )
  {
      if (LOGKEYS)
      {
	  console.log("up: ",e.code);
      }
      delete this.pressed[e.code];
  }
  update()
  {
    for (let t of Object.keys(this.pressed))
    {
      if (this.isHeld(t))
      {
	triggerEvent("input_keydown", {code: t});
      }
    }
  }

  
}


export {KeyTracker};
