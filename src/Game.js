'use strict';


import {Unit} from "./Unit.js";
import {Coord} from "./Path.js";
//import {PathFinder} from "./PathFinder.js";
import {AnimatedObject} from "./AnimatedObject.js";
import {Cursor} from "./Cursor.js";
import {FPS, TICK_RATE} from "./Constants.js";
import {Camera} from "./Camera.js";
import {Queue} from "./Queue.js";
import {MusicPlayer} from "./MusicPlayer.js";
import {DrawContainer} from "./DrawContainer.js";
import {Inputter, ARROWS} from "./Inputter.js";
import {Panel} from "./Panel.js";
//import {Battle} from "./Battle.js";
//import {SpriteFont} from "./SpriteFont.js";
//import {Tester} from "./Tester.js";
//import {LoopSelector} from "./LoopSelector.js";
//import {RNG} from "./RNG.js";
import {triggerEvent, respondToEvent, getCost, generatePath, nextFrameDo, cursorStop} from "./Utils.js";

const C_WIDTH = 1024;
const C_HEIGHT = 768;

const SCALE = 2;

const WINDOWGRID_X = 16;
const WINDOWGRID_Y = 12;

const GRIDSIZE_X = C_WIDTH/WINDOWGRID_X/SCALE;
const GRIDSIZE_Y = C_HEIGHT/WINDOWGRID_Y/SCALE;
const gx = GRIDSIZE_X;
const gy = GRIDSIZE_Y;

const CURSOR_SPEED = 4;

const FONTSIZE = "48";
const FONT = "Times New Roman";


const TEST_ENABLED = false;


class Game
{
  constructor( assets )
  {
    this.Album = assets.Album;
    this.Music = assets.Music;
    this.Map = assets.Map;
    
    this.ctx = [];
    this.generateCanvasLayers();
  
    this.Units = new DrawContainer();
    
    this.toDraw = new DrawContainer();
    this.grid = new Coord( gx, gy );
    
    this.cursor = new Cursor(this, 0, 0, CURSOR_SPEED);

    this.camera = new Camera(this, WINDOWGRID_X, WINDOWGRID_Y, this.Map.dimension.x, this.Map.dimension.y);

    this.Inputter = new Inputter(this);
    this.loadKeyTracker();

    this.Music.play("oss");
    
    this.toDraw.set("cursor", this.cursor);
    this.toDraw.set("Units", this.Units);
    //this.toDraw.set("test", new Panel(14,50, 60, 40, 50, 14));

    this.temp = {};
    
    this.gameStatus = "map";
    this.cursorOutsideMovable = false;


    respondToEvent("input_arrowStall", (e) =>{ this.Inputter.arrowStall(e.start); });
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
	await cursorStop(this.cursor);

	let target = new Coord( this.cursor.x, this.cursor.y );
	let unitOnTarget = this.Map.getTile(this.toDraw.get("selectedUnitPath").last()).unit;
	if (this.toDraw.get("selectedUnitMovable").contains(target)
	  && (unitOnTarget == null || unitOnTarget == this.temp.selectedUnit))
	{
	  triggerEvent("sfx_play_beep_effect");
	  this.gameStatus = "blockInput";
	  this.camera.shiftTo(this.temp.selectedUnit, () =>
	  {
	    this.camera.setTarget(this.temp.selectedUnit.vis);
	    this.temp.selectedUnit.tentativeMove(this, this.toDraw.get("selectedUnitPath"), () =>
	    {
	      this.gameStatus = "unitActionSelect";
	      this.camera.setTarget(this.cursor.vis);
	      this.camera.resetBorders();
	      //this.g.toDraw.hide("selectedUnitMovable");
	      //this.g.toDraw.hide("selectedUnitPath");
	    });
	  });

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
	triggerEvent("sfx_play_beep_effect");

	// wait until cursor stops moving
	await cursorStop(this.cursor);
	this.toDraw.hide("cursor");

	// move the cursor back to the unit and update state on complete
	this.cursor.moveInstant(this.temp.selectedUnit);
	this.camera.shiftTo(this.temp.selectedUnit, () => 
	  {
	    this.gameStatus = "map";
	    this.toDraw.show("cursor");
	  }
	);
	this.toDraw.del("selectedUnitMovable");
	this.toDraw.del("selectedUnitPath");
	delete this.temp["selectedUnitMov"];
	delete this.temp["selectedUnit"];
      },

      arrows: async (a) =>
      {
	let delta = new Coord(0,0);
	
	if (a.once.length > 0)
	{
	  a.once.forEach( (d) => { delta.add( ARROWS[d] );} );

	  triggerEvent("input_arrowStall", {start : a.held.length == 0});

	  // usually outside movable == false. If keypressed, allow it to go outside but only if moves outside
	  this.cursorOutsideMovable = (this.toDraw.get("selectedUnitMovable")
				      .doesNotContain(this.cursor.resultOf(delta)));
	  this.cursor.move(delta, async () =>
	  {
	    triggerEvent("sfx_play_beep_effect");
	    await this._arrow_editPath(delta);
	  });
	}
	// if nothing was pressed this tick
	else if (this.Inputter.accepting == true)
	{
	  a.held.forEach( (d) => { delta.add( ARROWS[d] );} );
	  
	  let inside = this.toDraw.get("selectedUnitMovable").contains(this.cursor.resultOf(delta));

	  if (this.cursorOutsideMovable == true || inside)
	  {
	    this.cursor.move(delta, async () =>
	    {
	      triggerEvent("sfx_play_beep_effect");
	      await this._arrow_editPath(delta);
	    });
	    if (inside == true)
	    {
	      this.cursorOutsideMovable = false;
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
	triggerEvent("sfx_play_beep_effect");
	let unit = this.Map.getTile(this.cursor.x, this.cursor.y).unit;
	if (unit != null)
	{
	  this.toDraw.set("selectedUnitMovable", unit.movable(this) );
	  this.gameStatus = "unitMoveLocation";

	  let p = new Queue();
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

	  this.toDraw.set("selectedUnitPath", p);
	  this.temp["selectedUnit"] = unit;
	  this.temp["selectedUnitMov"] = unit.getMov();
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
	else if (this.Inputter.accepting == true)
	{
	  a.held.forEach( (d) => { delta.add( ARROWS[d] );} );
	}
	this.cursor.move(delta, () =>
	{
	  triggerEvent("sfx_play_beep_effect");
	});
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
    let c = new Coord(this.cursor.x, this.cursor.y);
    let prevcursor = new Coord(this.cursor.x - delta.x, this.cursor.y - delta.y);
    if (this.toDraw.get("selectedUnitMovable").contains(c))
    {
      return new Promise( async (resolve) =>
      {
	//unit.movcost[this.getTile(this.cursor.x, this.cursor.y)];
	let p = this.toDraw.get("selectedUnitPath");
	let unit = this.temp.selectedUnit;
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
	  let ccost = getCost(this, c.x, c.y, cost);

	  let prev = p.last();
	  // if the term-wise product is not zero, then neither x nor y is 0 => diagonal
	  if (Math.abs(c.x - prev.x) + Math.abs(c.y - prev.y) >= 2)
	  {
	    // TODO handle unwalkable tiles: right now they cause NaN
	    // probably just A* from prev to cur
	    // if not enough move, do the big A*
	    //A* to c
	    let np = await generatePath(this, prev.x, prev.y, c.x, c.y, cost);
	    np.dequeue();

	    let addcost = 0;
	    np.forEach((tile) => {addcost += getCost(this, tile.x, tile.y, cost);} );

	    // if this is a legit move
	    if (this.temp.selectedUnitMov >= addcost && p.intersect(np) == false)
	    {
	      this.temp.selectedUnitMov -= addcost;
	      while (np.nonempty())
	      {
		p.push(np.dequeue())
	      }
	      resolve();
	    }
	    else
	    {
	      np = await generatePath(this, unit.x, unit.y, c.x, c.y, cost);

	      let first = np.front();
	      let newcost = - getCost(this, first.x, first.y, cost);
	      np.forEach((tile) => {newcost += getCost(this, tile.x, tile.y, cost);} );
	      this.temp.selectedUnitMov = unit.getMov() - newcost;
	      p.consume(np);

	    }
	    // leave c to be dealt with below

	  }
	  else if (this.temp.selectedUnitMov >= ccost)
	  {
	    p.push(c);
	    this.temp.selectedUnitMov -= ccost;
	  }
	  else
	  {
	    let np = await generatePath(this, unit.x, unit.y, c.x, c.y, cost);

	    let first = np.front();
	    let newcost = - getCost(this, first.x, first.y, cost);
	    np.forEach((tile) => {newcost += getCost(this, tile.x, tile.y, cost);} );
	    this.temp.selectedUnitMov = unit.getMov() - newcost;
	    p.consume(np);
	  }
	}
	else
	{
	  while (p.last().equals(c) == false)
	  {
	    let t = p.pop();
	    this.temp.selectedUnitMov += getCost(this, t.x, t.y, cost);
	  }
	}
	resolve();

      });
    }
  }

























  generateCanvasLayers()
  {
    // 0: bg, 1: walkable/other effects, 2: units, 3: cursor/effects, 4: hud
    let canv = document.getElementById("canvases");
    for (let i = 0; i < 5; i++)
    {
      let can = canv.appendChild(document.createElement("canvas"));
      can.id = "canvas-" + i.toString();
      can.width = C_WIDTH;
      can.height = C_HEIGHT;
      can.style.position = "absolute";
      can.style.background = "transparent";
      can.style.left = "0";
      can.style.top = "0";
      this.ctx.push(can.getContext('2d'));
      this.ctx[i].imageSmoothingEnabled = false;
      this.ctx[i].scale(SCALE, SCALE);
    }
  }
  
  getUnitById(id)
  {
    return this.Units.get(id);
  }

  loadKeyTracker()
  {
      document.addEventListener( "click", ( e ) => 
	  {
	    //console.log(getTile(this, e.clientX, e.clientY, GRIDSIZE_X, GRIDSIZE_Y).unit);
	  });
  }
  addUnit( unit )
  {
    let curTile = this.Map.getTile(unit.x, unit.y);
    if ( curTile.unit == null )
    {
      curTile.unit = unit;
      this.Units.set(unit.id, unit);
    }
    else
    {
      throw "ERROR - attempted to add unit in position (", unit.x, ", ",unit.y,")!";
    }
  }
  draw()
  {
    //TODO TODO TODO TODO TODO TODO TODO TODO TODO
    // 
    // add an object for (do i have to redraw this canvas)
    // for each layer, then only draw layers that have it set ti true.
    //
    //TODO TODO TODO TODO TODO TODO TODO TODO TODO
    this.ctx[1].clearRect(0,0,C_WIDTH, C_HEIGHT);
    this.ctx[2].clearRect(0,0,C_WIDTH, C_HEIGHT);
    this.ctx[3].clearRect(0,0,C_WIDTH, C_HEIGHT);

    this.toDraw.draw(this);

    this.Map.draw(this);
  }
  update()
  {
    if (this.toDraw.active("cursor") && this.Inputter.arrowStates().input == true)
    {
      this.stateAction[this.gameStatus].arrows(this.Inputter.arrowStates());
    }

    this.Inputter.update();
    this.toDraw.update(this);
    this.camera.update(this);
  }
  mainloop()
  {
    nextFrameDo(() => {this.mainloop()});

    this.update();
    this.draw();
  }

}

export {Game, FPS};
