'use strict';

import {getTile, inRange} from "./UsefulFunctions.js";
import {LoopSelector} from "./LoopSelector.js";
import {Path, Coord} from "./Path.js";
import {Queue} from "./Queue.js";
import {triggerEvent, respondToEvent, getCost, generatePath} from "./Utils.js";

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

    this.gameStatus = "map";


    document.addEventListener( "keydown", ( e ) => {this.onKeyDown( e.code )} );
    document.addEventListener( "keyup", ( e ) => {this.onKeyUp( e.code )} );
    
    respondToEvent("input_arrowStall", (e) =>{ this.arrowStall(e.start); });
    respondToEvent("cursor_finishMoveTo", (e) =>{ this.handleArrows = this.arrow_map; });

    respondToEvent("input_select",  () => {this.stateAction[this.gameStatus].select();});
    respondToEvent("input_cancel",  () => {this.stateAction[this.gameStatus].cancel();});
    this.stateAction = {};
    
    this.stateAction.unitActionSelect =
    {



    /*************************************/
    /* ACTION UNIT ACTION SELECT         */
    /*************************************/
      select:()=>
      {
      },
      cancel:()=>
      {
      },
      arrows:(a)=>
      {
      }

    }

    this.stateAction.unitMoveLocation =
    {
    /*************************************/
    /* ACTION UNIT MOVE LOCATION         */
    /*************************************/
    
      select: async ()=>
      {
	await this.cursorStop();

	let target = new Coord( this.g.cursor.x, this.g.cursor.y );
	let unitOnTarget = this.g.Map.getTile(this.g.toDraw.get("selectedUnitPath").last()).unit
	if (this.getStateAttr("selectedUnitMovable").contains(target)
	  && (unitOnTarget == null || unitOnTarget == this.g.temp.selectedUnit))
	{
	  this.gameStatus = "blockInput";
	  this.g.temp.selectedUnit.tentativeMove(this.g, this.g.toDraw.get("selectedUnitPath"), () =>
	    {
	      this.gameStatus = "unitActionSelect";
	      //this.g.toDraw.hide("selectedUnitMovable");
	      //this.g.toDraw.hide("selectedUnitPath");
	    }
	  )

	  this.cancelEvent = this.cancel_unitActionSelect;
	}
	else
	{
	  triggerEvent("sfx_play_err_effect");
	}
      },
      
      cancel: async ()=>
      {
	// disable further cursor movement
	this.gameStatus = "blockInput";

	// wait until cursor stops moving
	await this.cursorStop();

	this.g.cursor.moveTo(this.g.temp.selectedUnit, () =>
	  {
	    this.gameStatus = "map";
	  }
	);
	this.g.toDraw.del("selectedUnitMovable");
	this.g.toDraw.del("selectedUnitPath");
	delete this.g.temp["selectedUnitMov"];
	delete this.g.temp["selectedUnit"];
      },

      arrows: async (a) =>
      {
	let delta = new Coord(0,0);
	
	if (a.once.length > 0)
	{
	  a.once.forEach( (d) => { delta.add( ARROWS[d] );} );

	  triggerEvent("input_arrowStall", {start : a.held.length == 0});

	  // usually outside movable == false. If keypressed, allow it to go outside but only if moves outside
	  this.arrowOutsideMovable = (this.getStateAttr("selectedUnitMovable")
				      .doesNotContain(this.g.cursor.resultOf(delta)));
	  this.g.cursor.move(delta, async () => {await this._arrow_editPath(delta);});
	}
	// if nothing was pressed this tick
	else if (this.accepting == true)
	{
	  a.held.forEach( (d) => { delta.add( ARROWS[d] );} );
	  
	  let inside = this.getStateAttr("selectedUnitMovable").contains(this.g.cursor.resultOf(delta));

	  if (this.arrowOutsideMovable == true || inside)
	  {
	    this.g.cursor.move(delta, async () => {await this._arrow_editPath(delta);});
	    if (inside == true)
	    {
	      this.arrowOutsideMovable = false;
	    }
	  }
	}
      }
    }
   
    

    /*************************************/
    /* ACTION MAP                        */
    /*************************************/
    
    this.stateAction.map = 
    {
      select: () =>
      {
	let unit = this.g.Map.getTile(this.g.cursor.x, this.g.cursor.y).unit;
	if (unit != null)
	{
	  this.g.toDraw.set("selectedUnitMovable", unit.movable(this.g) );
	  this.gameStatus = "unitMoveLocation";

	  let p = new Queue();
	  // for easy copy
	  p.draw = function( g )
	  {
	    let off = g.camera.offset;
	    for (let c of this)
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
	  this.g.temp["selectedUnit"] = unit;
	  this.g.temp["selectedUnitMov"] = unit.stats.mov;
	}
      },

      arrows: (a) =>
      {
	let delta = new Coord(0,0);
	
	if (a.once.length > 0)
	{
	  a.once.forEach( (d) => { delta.add( ARROWS[d] );} );
	  
	  triggerEvent("input_arrowStall", {start : a.held.length == 0});
	}
	// if nothing was pressed this tick
	else if (this.accepting == true)
	{
	  a.held.forEach( (d) => { delta.add( ARROWS[d] );} );
	}
	this.g.cursor.move(delta);
      },

      cancel: ()=>
      {
      }
    }


    /*************************************/
    /* ACTION BLOCK INPUT                */
    /*************************************/
    this.stateAction.blockInput = 
    {
      select:()=>{},
      cancel:()=>{},
      arrows:(a)=>{}

    }
  }

  
  /*************************************/
  /* OTHER STUFF                       */
  /*************************************/
  _arrow_editPath(delta)
  {
    let c = new Coord(this.g.cursor.x, this.g.cursor.y);
    let prevcursor = new Coord(this.g.cursor.x - delta.x, this.g.cursor.y - delta.y);
    if (this.g.toDraw.get("selectedUnitMovable").contains(c))
    {
      return new Promise( async (resolve) =>
      {
	//unit.movcost[this.g.getTile(this.g.cursor.x, this.g.cursor.y)];
	let p = this.getStateAttr("selectedUnitPath");
	let unit = this.g.temp.selectedUnit;
	let cost = unit.movcost;
	
	// TODO: reorganize into
	// add block
	// merge
	// diagonal movement
	//
	// move limit -> path finding
	// /\ move > 1 -> path finding
	let i = p.contains(c);
	if (i == false)
	{
	  let ccost = getCost(this.g, c.x, c.y, cost);

	  let prev = p.last();
	  // if the term-wise product is not zero, then neither x nor y is 0 => diagonal
	  if (Math.abs(c.x - prev.x) + Math.abs(c.y - prev.y) >= 2)
	  {
	    // TODO handle unwalkable tiles: right now they cause NaN
	    // probably just A* from prev to cur
	    // if not enough move, do the big A*
	    //A* to c
	    let np = await generatePath(this.g, prev.x, prev.y, c.x, c.y, cost);
	    np.dequeue();

	    let addcost = 0;
	    np.forEach((tile) => {addcost += getCost(this.g, tile.x, tile.y, cost);} );

	    // if this is a legit move
	    if (this.g.temp.selectedUnitMov >= addcost && p.intersect(np) == false)
	    {
	      this.g.temp.selectedUnitMov -= addcost;
	      while (np.nonempty())
	      {
		p.push(np.dequeue())
	      }
	      resolve();
	    }
	    else
	    {
	      np = await generatePath(this.g, unit.x, unit.y, c.x, c.y, cost);

	      let first = np.front();
	      let newcost = - getCost(this.g, first.x, first.y, cost);
	      np.forEach((tile) => {newcost += getCost(this.g, tile.x, tile.y, cost);} );
	      this.g.temp.selectedUnitMov = unit.stats.mov - newcost;
	      p.consume(np);

	    }
	    // leave c to be dealt with below

	  }
	  else if (this.g.temp.selectedUnitMov >= ccost)
	  {
	    p.push(c);
	    this.g.temp.selectedUnitMov -= ccost;
	  }
	  else
	  {
	    let np = await generatePath(this.g, unit.x, unit.y, c.x, c.y, cost);

	    let first = np.front();
	    let newcost = - getCost(this.g, first.x, first.y, cost);
	    np.forEach((tile) => {newcost += getCost(this.g, tile.x, tile.y, cost);} );
	    this.g.temp.selectedUnitMov = unit.stats.mov - newcost;
	    p.consume(np);
	  }
	}
	else
	{
	  while (p.last().equals(c) == false)
	  {
	    let t = p.pop();
	    this.g.temp.selectedUnitMov += getCost(this.g, t.x, t.y, cost);
	  }
	}
	resolve();

      });
    }
  }
  _unit_findfullpath()
  {}


  update()
  {
    if (this.g.toDraw.active("cursor"))
    {
      let a = this.arrowStates();
      if (a.input == true)
      {
	this.stateAction[this.gameStatus].arrows(this.arrowStates());
      }
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
  
  noAction()
  {
  }

  getStateAttr(id)
  {
    return this.g.toDraw.get(id);
  }
}

