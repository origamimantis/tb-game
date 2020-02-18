'use strict';

import {getTile, inRange} from "./UsefulFunctions.js";
import {LoopSelector} from "./LoopSelector.js";
import {Path, Coord} from "./Path.js";
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


export class Inputter
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
    respondToEvent("cursor_finishMoveTo", (e) =>{ this.handleArrows = this.arrow_map; });

    respondToEvent("input_select",  () => {this.selectEvent();});
    respondToEvent("input_cancel",  () => {this.cancelEvent();});
  }

  cancel_unitActionSelect()
  {}



  /*************************************/
  /* ACTION UNIT MOVE LOCATION         */
  /*************************************/
  
  async select_unitMoveLocation()
  {
    await this.cursorStop();

    let target = new Coord( this.g.cursor.x, this.g.cursor.y );
    if (this.getStateAttr("selectedUnitMovable").contains(target))
    {
      this.selectEvent = this.noAction;
      this.cancelEvent = this.noAction;
      this.handleArrows = this.noAction;
      //this.g.toDraw.hide("selectedUnitMovable");
      this.g.selectedUnit.tentativeMove(this.g, target)

      this.cancelEvent = this.cancel_unitActionSelect;
    }
    else
    {
      triggerEvent("sfx_play_err_effect");
    }
  }
  
  async cancel_unitMoveLocation()
  {
    // disable further cursor movement
    this.handleArrows = this.noAction;
    this.selectEvent = this.noAction;
    this.cancelEvent = this.noAction;

    // wait until cursor stops moving
    await this.cursorStop();

    this.g.cursor.moveTo(this.g.selectedUnit, () =>
      {
	this.handleArrows = this.arrow_map;
	this.selectEvent = this.select_map;
	this.cancelEvent = this.noAction;
      }
    );
    delete this.g.selectedUnit;
    this.g.toDraw.del("selectedUnitMovable");
    this.g.toDraw.del("selectedUnitPath");
    delete this.g.temp["selectedUnitMov"];
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
      this.arrowOutsideMovable = (this.getStateAttr("selectedUnitMovable")
				  .doesNotContain(this.g.cursor.resultOf(delta)));
      this.g.cursor.move(delta, () => {this._arrow_editPath();});
    }
    // if nothing was pressed this tick
    else if (this.accepting == true)
    {
      for (let d of a.held)
      {
	delta.add( ARROWS[d] );
      }
      
      let inside = this.getStateAttr("selectedUnitMovable").contains(this.g.cursor.resultOf(delta));

      if (this.arrowOutsideMovable == true || inside)
      {
	this.g.cursor.move(delta, () => {this._arrow_editPath();});
	if (inside == true)
	{
	  this.arrowOutsideMovable = false;
	}
      }
    }
  }
 
  _arrow_editPath()
  {
    //unit.movcost[this.g.getTile(this.g.cursor.x, this.g.cursor.y)];
    let c = new Coord(this.g.cursor.x, this.g.cursor.y);
    let p = this.getStateAttr("selectedUnitPath");
    
    let i = p.indexOf(c);
    if (i < 0)
    {
      let prev = p.last();
      if (Math.abs(c.x - prev.x) == 1 && Math.abs(c.y - prev.y) == 1)
      {
	// TODO TODO TODO chackthe two surrounding tiles and push the one with the lowest cost
	console.log("diag!");
      }
      p.push(c);
    }
    else
    {
      p.splice(i+1);
    }



  }



  /*************************************/
  /* ACTION MAP                        */
  /*************************************/
  
  select_map()
  {
    let unit = this.g.Map.getTile(this.g.cursor.x, this.g.cursor.y).unit;
    if (unit != null)
    {
      this.g.selectedUnit = unit;
      this.g.toDraw.set("selectedUnitMovable", unit.movable(this.g) );
      this.selectEvent = this.select_unitMoveLocation;
      this.cancelEvent = this.cancel_unitMoveLocation;
      this.handleArrows = this.arrow_unitMoveLocation;

      let p = new Path();
      p.draw = ( g ) =>
      {
        let off = g.camera.offset;
        for (let c of p)
        {
          g.ctx[1].drawImage(
            g.Album.get("C_walk"),
            (c.x - off.x)*g.grid.x, (c.y - off.y)*g.grid.y,
            g.grid.x, g.grid.y
          );
        }
      }
      p.push(new Coord(unit.x, unit.y));

      this.g.toDraw.set("selectedUnitPath", p);
      this.g.temp["selectedUnitMov"] = unit.stats.mov;
    }
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

  
  /*************************************/
  /* OTHER STUFF                       */
  /*************************************/

  update()
  {
    if (this.g.toDraw.active("cursor"))
    {
      this.handleArrows();
      this.updateHeld();
      this.updateArrowAccept();
    }

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

	if (this.g.toDraw.paused("cursor"))
	{
	  this.g.toDraw.resume("cursor");
	  this.g.toDraw.resume("Units");
	}
	else if (this.g.toDraw.active("cursor"))
	{
	  this.g.toDraw.pause("cursor");
	  this.g.toDraw.pause("Units");
	}
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
  cursorStop()
  {
    return new Promise( async (resolve) =>
      {
	while (this.g.cursor.moving != false)
	{
	  await new Promise( (resolve) => {setTimeout(() => {resolve();}, 5)});
	}
	resolve();
      });
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

  getStateAttr(id)
  {
    return this.g.toDraw.get(id);
  }
}

