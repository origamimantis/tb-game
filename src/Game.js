'use strict';


import {Unit} from "./Unit.js";
import {Coord} from "./Path.js";
//import {PathFinder} from "./PathFinder.js";
import {AnimatedObject} from "./AnimatedObject.js";
import {Album} from "./Images.js";
import {Cursor} from "./Cursor.js";
import {FPS, TICK_RATE} from "./Constants.js";
import {Camera} from "./Camera.js";
import {Queue} from "./Queue.js";
import {MusicPlayer} from "./MusicPlayer.js";
import {DrawContainer} from "./DrawContainer.js";
import {Inputter, ARROWS, ARROW} from "./Inputter.js";
import {Panel, SelectionPanel} from "./Panel.js";
import {PanelComponent} from "./PanelComponent.js";
import {Battle} from "./Battle.js";
//import {SpriteFont} from "./SpriteFont.js";
//import {Tester} from "./Tester.js";
import {LoopSelector, QueueSelector} from "./LoopSelector.js";
import {Action} from "./ActionGenerator.js";
//import {RNG} from "./RNG.js";
import {scrollSelector, triggerEvent, respondToEvent, getCost, generatePath, nextFrameDo, cursorStop, waitTime} from "./Utils.js";
import {EnemyController} from "./EnemyController.js";
import {TurnBanner} from "./TurnBanner.js";
import {TurnData} from "./TurnData.js";

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
    this.windowx = C_WIDTH/SCALE;
    this.windowy = C_HEIGHT/SCALE;
    this.Album = Album;
    this.Music = assets.Music;
    this.Map = assets.Map;
    this.Fonts = assets.sf;
    
    this.ctx = [];
    this.generateCanvasLayers();
  
    this.Units = new DrawContainer();
    
    this.toDraw = new DrawContainer();
    this.grid = new Coord( gx, gy );
    
    this.cursor = new Cursor(this, 0, 0, CURSOR_SPEED);

    this.camera = new Camera(this, WINDOWGRID_X, WINDOWGRID_Y, this.Map.dimension.x, this.Map.dimension.y);

    this.Inputter = new Inputter(this);
    this.loadKeyTracker();

    this.mapTheme = "btl1";
    
    this.toDraw.set("cursor", this.cursor);
    this.toDraw.hide("cursor");
    this.toDraw.set("map", this.Map);
    this.toDraw.set("Units", this.Units);
    this.toDraw.set("fps", new Panel(420,0, 92, 36, 1, 1000, 0));
    //this.toDraw.set("fps", new Panel(420,0, 0, 0, 1, 1000, 0));

    this.fpsUpdate = [0,0,0,0,0];
    this.fpspanel = new PanelComponent(0, "fps:");
    this.toDraw.get("fps").addComponent(this.fpspanel, "fps", 0,0);
    this.toDraw.toggleVisible("fps");

    this.toDraw.set("banner", new TurnBanner(this));
    this.temp = {};
    
    this.counter = 0;
    this.gameStatus = "blockInput";
    
    //this.turn = new LoopSelector(["Player", "Enemy", "Allied"]);
    this.turn = new LoopSelector( [ TurnData("Player", "#aaaaff", "btl1","fght2"),
				    TurnData("Enemy", "red", "btl_en", "fght")    ]);
    
    this.cursorOutsideMovable = false;


    respondToEvent("input_arrowStall", (e) =>{ this.Inputter.arrowStall(e.start); });
    respondToEvent("cursor_finishMoveTo", (e) =>{ this.handleArrows = this.arrow_map; });

    respondToEvent("input_select",  () => {this.stateAction[this.gameStatus].select();});
    respondToEvent("input_cancel",  () => {this.stateAction[this.gameStatus].cancel();});
    
    respondToEvent("game_test",  () => {});
    this.stateAction = {};
    this.initStateAction();
    this.beginGame();
  }
  async beginGame()
  {
    await this.beginTurn(this.turn.get());
    this.toDraw.show("cursor");
    this.cursor.curAnim().reset();
    this.gameStatus = "map";
  }

  generateUnitActions(g, unit)
  {
    let p = [];
    let attackable = unit.attackableUnits(this.Map);
    if (attackable.nonempty())
    {
      // attack
      p.push( new Action( "attack", () =>
	{
	  this.temp["selectedUnitAttackCoords"] = new QueueSelector( attackable );
	  this.toDraw.hide("selectedUnitActionPanel");
	  this.cursor.moveInstant(attackable.front());

	  this.gameStatus = "unitAttackTargetSelect";
	}));
    }
    

    // wait
    p.push( new Action( "wait", () =>
      {
	unit.confirmMove(this);
	unit.endTurn(this);

	this.toDraw.del("selectedUnitActionPanel");
	this.toDraw.del("selectedUnitMovable");
        this.toDraw.del("selectedUnitPath");
	this.toDraw.del("selectedUnitAttackableTiles");

        delete this.temp["selectedUnitMov"];
        delete this.temp["selectedUnit"];
        delete this.temp["selectedUnitActions"];

        this.gameStatus = "map";
      }));

    return new LoopSelector(p);

  }

  initStateAction()
  {
    this.stateAction.unitAttackTargetSelect =
    {

    /*************************************/
    /* ACTION UNIT ATTACK TARGET SELECT  */
    /*************************************/
      select:async()=>
      {
        let enemy = this.Map.getTile(this.temp.selectedUnitAttackCoords.get()).unit;
	// hide everything
	this.temp["mapstate"] = this.toDraw;
        this.gameStatus = "blockInput";

	let battle = new Battle(this, this.temp.selectedUnit, enemy);

	await this.Music.fadeout(this.mapTheme);
	this.Music.play(this.turn.get().btltheme);
	
	this.toDraw = battle;

	battle.begin( async ()=>
	  {

	    await this.Music.fadestop(this.turn.get().btltheme);
	    this.Music.fadein(this.mapTheme);

	    // restore the gamestate
	    this.toDraw = this.temp["mapstate"];

	    // deete stuff from selecting a unit
	    this.toDraw.del("selectedUnitAttackableTiles");
	    this.toDraw.del("selectedUnitMovable");
	    this.toDraw.del("selectedUnitPath");
	    this.toDraw.del("selectedUnitActionPanel");

	    // confirm move
	    this.temp.selectedUnit.confirmMove(this);
	    
	    // end turn TODO change for canto/other stuff
	    //
	    // if canto
	    //	  temp.selectedunit = the unit
	    //	  gamestatus = unitmovelocation
	    //
	    // ie force the player to move this unit again
	    this.temp.selectedUnit.endTurn(this);
	    
	    this.cursor.moveInstant(this.temp.selectedUnit);

	    // delete temporaries
	    this.temp = {};

	    // update gamestate
	    this.gameStatus = "map";
	  }
	);
	
      },
      cancel:()=>
      {
	this.cursor.moveInstant(this.temp.selectedUnit);
	this.toDraw.show("selectedUnitActionPanel");
	
	this.gameStatus = "unitActionSelect";
      },
      arrows:(a)=>
      {
	//scrollSelector(a, this.temp.selectedUnitAttackCoords);
	for (let k of a.once)
	{
	  switch (k)
	  {
	  case ARROW.UP:
	  case ARROW.LEFT:
	    this.temp.selectedUnitAttackCoords.prev();
	    break;
	  case ARROW.DOWN:
	  case ARROW.RIGHT:
	    this.temp.selectedUnitAttackCoords.next();
	    break;
	  }
	}
	this.cursor.moveInstant(this.temp.selectedUnitAttackCoords.get());
      }
    }

    
    this.stateAction.unitActionSelect =
    {

    /*************************************/
    /* ACTION UNIT ACTION SELECT         */
    /*************************************/
      select:()=>
      {
	this.temp["selectedUnitActions"].get().execute();
      },
      cancel:()=>
      {
	delete this.temp["selectedUnitActions"];
	this.toDraw.del("selectedUnitActionPanel");
	this.toDraw.del("selectedUnitAttackableTiles");
	
	this.temp.selectedUnit.revertMove();
	this.toDraw.show("selectedUnitMovable");
	this.toDraw.show("selectedUnitPath");
	this.cursor.moveInstant(this.toDraw.get("selectedUnitPath").last());
	this.gameStatus = "unitMoveLocation";
      },
      arrows:(a)=>
      {
	scrollSelector(a, this.temp.selectedUnitActions);
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
	//TODO make units have another object detainling whattiles that can end turn on
	// ie flyers can fly over spikes but not land on it
	if (this.toDraw.get("selectedUnitMovable")[0].contains(target)
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

	      this.toDraw.hide("selectedUnitMovable");
	      this.toDraw.hide("selectedUnitPath");

	      this.toDraw.set("selectedUnitAttackableTiles", this.temp.selectedUnit.attackableTiles(this.Map));
	      this.temp["selectedUnitActions"] = this.generateUnitActions(this, this.temp.selectedUnit);

	      let numActions = this.temp.selectedUnitActions.length;
	      this.toDraw.set("selectedUnitActionPanel",
		new SelectionPanel(50,50, 20+64,16*numActions+20, 1, numActions, 398, 50, this.temp.selectedUnitActions));

	      if (this.camera.onLeft(this.temp.selectedUnit))
	      {
		this.toDraw.get("selectedUnitActionPanel").shift();
	      }
	    });
	  });

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
	  this.cursorOutsideMovable = (this.toDraw.get("selectedUnitMovable")[0]
				      .doesNotContain(this.cursor.resultOf(delta)));
	  this.cursor.move(delta, async () =>
	  {
	    triggerEvent("sfx_play_cursormove_effect");
	    await this._arrow_editPath(delta);
	  });
	}
	// if nothing was pressed this tick
	else if (this.Inputter.accepting == true)
	{
	  a.held.forEach( (d) => { delta.add( ARROWS[d] );} );
	  
	  let inside = this.toDraw.get("selectedUnitMovable")[0].contains(this.cursor.resultOf(delta));

	  if (this.cursorOutsideMovable == true || inside)
	  {
	    this.cursor.move(delta, async () =>
	    {
	      triggerEvent("sfx_play_cursormove_effect");
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
    /* MAP OPTION SELECT                 */
    /*************************************/
    
    this.stateAction.mapOptionSelect = 
    {
      select: async () =>
      {
	this.temp.mapActions.get().execute();
      },
      
      cancel: ()=>
      {
	this.gameStatus = this.temp.prevState;
	delete this.temp.prevState;
	delete this.temp.mapActions;
	this.toDraw.del("mapActionPanel")
      },
      
      
      arrows: (a) =>
      {
	scrollSelector(a, this.temp.mapActions);
      }
    },
    

    /*************************************/
    /* ACTION MAP                        */
    /*************************************/
    
    this.stateAction.map = 
    {
      select: async () =>
      {
	await cursorStop(this.cursor);
	triggerEvent("sfx_play_beep_effect");
	let unit = this.Map.getTile(this.cursor.x, this.cursor.y).unit;
	if (unit != null && unit.active == true)
	{
	  if (unit.team == "Player")
	  {
	    // TODO when i decide to remove this for danger area
	    this.toDraw.delc("enemyAtackable");

	    this.toDraw.set("selectedUnitMovable", unit.movable(this, true) );
	    let p = new Queue();
	    p.setArt("C_walk");
	    
	    p.push(new Coord(unit.x, unit.y));

	    this.toDraw.set("selectedUnitPath", p);
	    this.temp["selectedUnit"] = unit;
	    this.temp["selectedUnitMov"] = unit.getMov();
	    
	    this.gameStatus = "unitMoveLocation";
	  }
	  else
	  {
	    // TODO when i decide to remove this for danger area
	    this.toDraw.set("enemyAtackable", unit.movable(this, true)[1] );
	  }
	}
	else
	{
	  // TODO map options might be the same no matter what. See if I can make this constant.
	  this.temp["mapActions"] = new LoopSelector(
	    [new Action("????????", ()=>{console.log("testo");}),
	     new Action("End Turn", async ()=>
	      {
		// TODO when i decide to remove this for danger area
		this.toDraw.delc("enemyAtackable");

		this.gameStatus = "blockInput";
		this.toDraw.hide("cursor");
	        
		// TODO make camera go to original location instead of seeking to cursor's original location
		this.toDraw.del("mapActionPanel");


		this.turn.next();
		let turno = this.turn.get();
		while (turno.turn != "Player")
		{
		  await this.beginTurn(turno);

		  await this.nonPlayerTurn(turno);
		

		  this.turn.next();
		  turno = this.turn.get();
		}

		await this.beginTurn(turno);

		this.cursor.moveInstant(this.temp.cursorPrev);

		await new Promise(resolve => {this.camera.shiftTo(this.cursor.vis, resolve)});
		this.camera.setTarget(this.cursor.vis);
		
		this.cursor.curAnim().reset();
		this.toDraw.show("cursor");
		
		this.temp = {};
		this.gameStatus = "map";
	      })
	    ]);

	  let numActions = this.temp.mapActions.length;
	  this.toDraw.set("mapActionPanel",
	    new SelectionPanel(398,50, 20+64,16*numActions+20, 1, numActions, 398, 50, this.temp.mapActions));
	  this.temp["prevState"] = "map";
	  this.temp["cursorPrev"] = new Coord(this.cursor.x, this.cursor.y);

	  this.gameStatus = "mapOptionSelect";
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
	  triggerEvent("sfx_play_cursormove_effect");
	});
      },

      cancel: ()=>
      {
	// TODO when i decide to remove this for danger area
	this.toDraw.delc("enemyAtackable");
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
  beginTurn(turnData)
  {
    return new Promise( async (resolve) =>
      {
	await this.Music.fadestop(this.mapTheme);

	for (let u of this.Units){ u.turnInit();}

	await this.toDraw.get("banner").flyBanner(turnData.turn + " Phase", turnData.bannercolor);

	this.mapTheme = turnData.maptheme;
	this.Music.play(this.mapTheme);

	resolve();
      }
    );
  }

  /*************************************/
  /* NON-PLAYER TURN                   */
  /*************************************/
  nonPlayerTurn(turndata)
  {
    let team = turndata.turn.toLowerCase();
    return new Promise( async (resolve) =>
    {
      let t = new EnemyController(this);
      for (let unit of this.Units)
      {
	if (unit.team.toLowerCase() == team)
	{
	  await this.camera.waitShiftTo(unit);
	  this.camera.setTarget(unit.vis);

	  let info = await t.offense(unit);

	  this.cursor.moveInstant(unit);
	  this.toDraw.show("cursor");
	  this.cursor.curAnim().reset();
	  await waitTime(500);
	  this.toDraw.hide("cursor");

	  await new Promise( resolve => {unit.tentativeMove(this, info.path, resolve);} )

	  if (info.attacks == true)
	  {
	    let battle = new Battle(this, unit, info.target);

	    this.cursor.moveInstant(info.target);

	    this.toDraw.show("cursor");
	    this.cursor.curAnim().reset();
	    await waitTime(500);
	    this.toDraw.hide("cursor");

	    await this.Music.fadeout(this.mapTheme);
	    this.Music.play(turndata.btltheme);

	    this.temp["mapstate"] = this.toDraw;

	    this.toDraw = battle;

	    await new Promise( resolve => { battle.begin( resolve ); } );

	    await this.Music.fadestop(turndata.btltheme);
	    this.Music.fadein(this.mapTheme);


	    // restore the gamestate
	    this.toDraw = this.temp["mapstate"];

	  }
	  unit.confirmMove(this);
	  unit.endTurn(this);
	  await waitTime(500);

	}
      }
      resolve();
    });
  }

  
  /*************************************/
  /* OTHER STUFF                       */
  /*************************************/
  _arrow_editPath(delta)
  {
    let c = new Coord(this.cursor.x, this.cursor.y);
    let prevcursor = new Coord(this.cursor.x - delta.x, this.cursor.y - delta.y);
    if (this.toDraw.get("selectedUnitMovable")[0].contains(c))
    {
      return new Promise( async (resolve) =>
      {
	//unit.movcost[this.getTile(this.cursor.x, this.cursor.y)];
	let p = this.toDraw.get("selectedUnitPath");
	let unit = this.temp.selectedUnit;
	let cost = unit.movcost;
	
	if (p.doesNotContain(c))
	{
	  let ccost = getCost(this, c.x, c.y, cost);

	  let prev = p.last();
	  // if the term-wise product is not zero, then neither x nor y is 0 => diagonal
	  if (Math.abs(c.x - prev.x) + Math.abs(c.y - prev.y) >= 2)
	  {
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
      this.ctx[i].fillStyle = "white";
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
    // for each layer, then only draw layers that have it set to true.
    //
    //TODO TODO TODO TODO TODO TODO TODO TODO TODO
    this.ctx[0].clearRect(0,0,C_WIDTH, C_HEIGHT);
    this.ctx[1].clearRect(0,0,C_WIDTH, C_HEIGHT);
    this.ctx[2].clearRect(0,0,C_WIDTH, C_HEIGHT);
    this.ctx[3].clearRect(0,0,C_WIDTH, C_HEIGHT);

    this.toDraw.draw(this);
  }
  update()
  {
    // if (this.toDraw.isActive("cursor") && this.Inputter.arrowStates().input == true)
    if (this.Inputter.arrowStates().input == true)
    {
      this.stateAction[this.gameStatus].arrows(this.Inputter.arrowStates());
    }

    this.Inputter.update();
    this.toDraw.update(this);
    this.camera.update(this);
  }
  mainloop()
  {
    requestAnimationFrame(() => {this.mainloop()});

    this.update();
    this.draw();
    ++ this.counter;
    // 10! is hghly divisible, so modulos won't run amok
    if (this.counter >= 3628800)
    {
      this.counter = 0;
    }

    let pt = this.now;
    this.now = Date.now();
    this.fpsUpdate.shift();
    this.fpsUpdate.push(this.now - pt);
    let sum = 0;
    this.fpsUpdate.forEach(s => {sum += s});
    this.fpspanel.setData(0, "FPS " + (5*1000/(sum)).toFixed(2));
  }

}

export {Game, FPS};
