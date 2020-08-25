'use strict';

//TODO maybe for states, add a changeTo() method (like map.changeTo())
//     so I can put everything that changing to that state needs to do,
//     instead of doing those things everywhere I need to switch to that state.
//     ie map.changeTo()
//	  {
//	    this.gameStatus = "map";
//	    something();
//	    somethingElse();
//	  }

import {Settings} from "./Settings.js";
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
import {DrawContainer, UnitContainer, PanelContainer} from "./DrawContainer.js";
import {Inputter, ARROWS, ARROW} from "./Inputter.js";
import {Panel, SelectionPanel, UnitMapPanel, ItemPanel} from "./Panel.js";
import {PanelComponent} from "./PanelComponent.js";
import {Battle} from "./Battle.js";
import {LoopSelector, QueueSelector} from "./LoopSelector.js";
import {Action} from "./ActionGenerator.js";
import {scrollSelect_UD, scrollSelect_4W, triggerEvent, respondToEvent,
  getCost, generatePath, nextFrameDo, cursorStop, waitTick, waitTime, formattedHP,
  fracAmtFn} from "./Utils.js";
import {EnemyController} from "./EnemyController.js";
import {TurnBanner} from "./TurnBanner.js";
import {TurnData} from "./TurnData.js";
import {EventHandler} from "./EventHandler.js";
import {UnitInfoScreen} from "./UnitInfoScreen.js";
import {OptionScreen} from "./OptionScreen.js";
import {UnitTradeScreen} from "./UnitTradeScreen.js";
import {MapHealthBar} from "./MapHealthBar.js";

export const C_WIDTH = 1024;
export const C_HEIGHT = 768;

//TODO modify all sprite to double resolution and change this to SCALE = 1.
//     this will require tweaks to scene objects.
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

const NUMLAYER = 5;

const TEST_ENABLED = false;


class Game
{
  constructor( assets )
  {
    this.windowx = C_WIDTH/SCALE;
    this.windowy = C_HEIGHT/SCALE;
    this.gx = GRIDSIZE_X;
    this.gy = GRIDSIZE_Y;

    this.Events = new EventHandler();
    /*
    this.Events.addEvent("noEnemies", 0,
      ()=>{return this.Units.teams["Enemy"] == undefined},
      ()=>{console.log("HAHAHA")});
    */
    this.Album = Album;
    this.Music = assets.Music;
    this.Map = assets.Map;
    
    this.ctx = [];
    this.ctx_refresh = [1,2,3,5];
    this.generateCanvasLayers();
  
    this.turn = new LoopSelector( [ TurnData("Player", "#aaaaff", "btl1",   "fght2"),
				    TurnData("Enemy",  "#bd4900", "btl_en", "fght" ) ] );
    this.Units = new UnitContainer();
    for (let td of this.turn)
    {
      this.Units.addTeam(td.turn);
    }
    
    this.toDraw = new DrawContainer();
    this.Panels = new PanelContainer(this);
    
    this.cursor = new Cursor(this, 0, 0, CURSOR_SPEED);

    this.camera = new Camera(this, WINDOWGRID_X, WINDOWGRID_Y, this.Map.dimension.x, this.Map.dimension.y);

    this.Inputter = new Inputter(this);
    this.loadKeyTracker();

    this.mapTheme = "btl1";
    
    this.toDraw.set("cursor", this.cursor);
    this.toDraw.hide("cursor");
    this.toDraw.set("map", this.Map);
    this.toDraw.set("Units", this.Units);

    /*
    this.toDraw.set("fps", new Panel(420,0, 92, 36, 1, 1000, 0));
    this.fpsUpdate = [0,0,0,0,0];
    this.fpspanel = new PanelComponent(0, "fps:");
    this.toDraw.get("fps").addComponent(this.fpspanel, "fps", 0, 0);
    this.toDraw.toggleVisible("fps");
    */

    this.Panels.set("UMP", new UnitMapPanel());
    this.Panels.hide("UMP");
    this.toDraw.set("banner", new TurnBanner(this));
    this.temp = {};
    this.skipOnBegin = false;
    
    this.counter = 0;
    this.turncount = 1;
    this.gameStatus = "";
    this.inputting = false;
    
    
    this.cursorOutsideMovable = false;


    respondToEvent("input_arrowStall", (e) =>{ this.Inputter.arrowStall(e.start); });
    respondToEvent("cursor_finishMoveTo", (e) =>{ this.handleArrows = this.arrow_map; });
    
    respondToEvent("game_win", (e) =>{ console.log("you won"); } );
    respondToEvent("game_lose", (e) =>{ console.log("you lost"); } );

    respondToEvent("input_select",  async () => 
    {
      if (this.inputting)
      {
	this.blockInput();
	await this.stateAction[this.gameStatus].select();
	this.unblockInput();
      }
    });
    respondToEvent("input_cancel",  async () => 
    {
      if (this.inputting)
      {
	this.blockInput();
	await this.stateAction[this.gameStatus].cancel();
	this.unblockInput();
      }
    });
    respondToEvent("input_inform",  async () => 
    {
      if (this.inputting)
      {
	let i = this.stateAction[this.gameStatus].inform;
	if (i !== undefined)
	{
	  this.blockInput();
	  await i();
	  this.unblockInput();
	}
      }
    });

    
    //respondToEvent("game_test",  () => {this.Music.stop("rfgh")});
    this.stateAction = {};
    this.initStateAction();
    this.beginGame();

    respondToEvent("cursor_move", (c) =>
    {
      this.handlePortrait();
    });
  }
  handlePortrait()
  {
    let u = this.Map.getTile(this.cursor).unit;
    if (u != null)
    {
      if (this.camera.onLeft(this.cursor) && this.camera.onTop(this.cursor))
	this.Panels.get("UMP").shiftAlternate();
      else
	this.Panels.get("UMP").shiftOriginal();
      
      this.Panels.get("UMP").setInfo(u);
      this.Panels.redraw("UMP");
    }
    else
    {
      this.Panels.hide("UMP");
    }
  }
  getHostile(team)
  {
    let a = [];
    for (let td of this.turn)
    {
      if (td.turn != team)
      {
	a.push(td.turn);
      }
    }
    return a;
  }
  async beginGame()
  {
    await this.beginTurn(this.turn.get());
    this.cursor.curAnim().reset();
    this.setStatus("map");
    this.unblockInput();
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
	  let len = unit.weapons.length;
	  let uWeap = new LoopSelector( unit.weapons, unit.eqWeap );
	  //let wp = new SelectionPanel(50,50, 70+64,16*len+20, 1, len, 398, 50, uWeap);
	  let wp = new ItemPanel(50,50,  256, 16*len+20,  1, len, uWeap,
	        "WT_", (c)=>{return formattedHP(c.uses, c.maxUses);});


	  this.Panels.set("selectedUnitWeaponPanel", wp);

	  this.temp["selectedUnitAttackableEnemies"] = attackable;
	  this.setStatus("unitAttackWeaponSelect");
	}));
    }
    
    let adjacent = unit.adjacentUnits(this.Map, [this.temp.selectedUnit.team]);
    if (adjacent.nonempty())
    {
      // trade TODO
      p.push( new Action( "trade", async () =>
      {
	this.temp["allyInteract"] = async (target)=>
	{
	  this.temp["mapState"] = this.toDraw;
	  await this.setExtStatus(new UnitTradeScreen(this, unit, target),
	    (traded) =>
	    {
	      if (traded) return "unitForcedActionSelect";
	      else	  return "unitActionSelect";
	    },
	    async (traded) =>
	    {
	      this.clearCtx(4);
	      this.clearCtx(5);
	      this.toDraw.show("cursor");
	    });
	}
	await this.setStatus("unitAllySelect", adjacent);
      }));
    }

    if (unit.hasUsableItem())
    {
      // item TODO
      p.push( new Action( "item", async () =>
      {
	let len = unit.items.length;
	let uItem = new LoopSelector( unit.items);
	let wp = new ItemPanel(50,50,  256, 16*len+20,  1, len, uItem,
	      "IT_", fracAmtFn);


	this.Panels.set("selectedUnitWeaponPanel", wp);
	await this.setStatus("unitItemSelect");
      }));
    }


    // wait
    p.push( new Action( "wait", () =>
      {
	unit.confirmMove(this);
	unit.endTurn(this);

	this.Panels.del("selectedUnitActionPanel");
	this.toDraw.del("selectedUnitMovable");
        this.toDraw.del("selectedUnitPath");
	this.toDraw.del("selectedUnitAttackableTiles");

        this.setStatus("map");
      }));

    return new LoopSelector(p);

  }
  async setExtStatus(extState, nextStatus, onDone)
  {
    this.toDraw = extState;
    this.gameStatus = "other";
    await this.stateAction.other.onBegin(nextStatus, onDone);
  }
  async setStatus(state, ...args)
  {
    await this.stateAction[state].onBegin(...args);
    this.gameStatus = state;
  }

  initStateAction()
  {
    /*************************************/
    /* ACTION UNIT ALLY SELECT           */
    /*************************************/
    this.stateAction.unitAllySelect =
    {
      onBegin: async ( allies )=>
      {
	  this.temp["selectedUnitAllySelector"] = new QueueSelector( allies );
	  this.toDraw.show("cursor");
	  this.Panels.hide("selectedUnitActionPanel");

	  await this.camera.waitShiftTo(allies.front());
	  this.cursor.moveInstant(allies.front());
      },
      select: async()=>
      {
	triggerEvent("sfx_play_beep_effect");
        let target = this.Map.getTile(this.temp.selectedUnitAllySelector.get()).unit;
	await this.temp.allyInteract(target);
      },

      cancel:async ()=>
      {
	await this.setStatus("unitActionSelect");
      },
      arrows:async (a)=>
      {
	this.blockInput();
	scrollSelect_4W(a, this.temp.selectedUnitAllySelector);
	
	let target = this.temp.selectedUnitAllySelector.get();
	await this.camera.waitShiftTo(target);
	this.cursor.moveInstant(target);
	this.unblockInput();
      }
	
    },

    /*************************************/
    /* ACTION UNIT ATTACK TARGET SELECT  */
    /*************************************/
    this.stateAction.unitAttackTargetSelect =
    {
      onBegin: async ()=>
      {
	  this.temp["selectedUnitAttackCoords"] = new QueueSelector( this.temp.selectedUnitAttackableEnemies );
	  this.toDraw.show("cursor");
	  this.Panels.hide("selectedUnitWeaponPanel");

	  let first = this.temp.selectedUnitAttackableEnemies.front();
	  await this.camera.waitShiftTo(first);
	  this.cursor.moveInstant(first);
      },

      select: async()=>
      {
	triggerEvent("sfx_play_beep_effect");
        let enemy = this.Map.getTile(this.temp.selectedUnitAttackCoords.get()).unit;
	// hide everything
	this.temp["mapstate"] = this.toDraw;

	// confirm move
	this.temp.selectedUnit.confirmMove(this);

	let battle = new Battle(this, this.temp.selectedUnit, enemy);

	await this.Music.fadeout(this.mapTheme);
	
	this.toDraw = battle;

	await battle.begin(this.turn.get().btltheme);

	this.Music.fadein(this.mapTheme);

	// restore the gamestate
	this.toDraw = this.temp["mapstate"];

	// end turn TODO change for canto/other stuff
	//
	// if canto
	//	  temp.selectedunit = the unit
	//	  gamestatus = unitmovelocation
	//
	// ie force the player to move this unit again
	this.temp.selectedUnit.endTurn(this);
	
	this.cursor.moveInstant(this.temp.selectedUnit);

	// update gamestate
	this.setStatus("map");
      },
      cancel:async ()=>
      {
	await this.setStatus("unitAttackWeaponSelect");
	this.Panels.show("selectedUnitWeaponPanel");
      },
      arrows:async (a)=>
      {
	this.blockInput();
	scrollSelect_4W(a, this.temp.selectedUnitAttackCoords);
	
	let target = this.temp.selectedUnitAttackCoords.get();
	await this.camera.waitShiftTo(target);
	this.cursor.moveInstant(target);
	this.unblockInput();
      }
    }

    /*************************************/
    /* ACTION UNIT ITEM SELECT           */
    /*************************************/
    this.stateAction.unitItemSelect =
    {
      onBegin: async ()=>
      {
	// unit guaranteed to have a usable item
	this.Panels.hide("selectedUnitActionPanel");
	this.Panels.show("selectedUnitWeaponPanel");

	this.toDraw.hide("cursor");
      },
      select: async()=>
      {
        triggerEvent("sfx_play_beep_effect");
	let item = this.temp.selectedUnit.items[this.Panels.get("selectedUnitWeaponPanel").idx()];
	this.Panels.del("selectedUnitWeaponPanel");

	await item.use(this, this.temp.selectedUnit);

	this.temp.selectedUnit.confirmMove(this);
	this.temp.selectedUnit.endTurn(this);
	this.cursor.moveInstant(this.temp.selectedUnit);

	// update gamestate
	this.setStatus("map");
      },

      cancel:async ()=>
      {
        this.Panels.del("selectedUnitWeaponPanel");
        await this.setStatus("unitActionSelect");
      },
      arrows:async (a)=>
      {
	if (scrollSelect_UD(a, this.Panels.get("selectedUnitWeaponPanel")))
	  this.Panels.redraw("selectedUnitWeaponPanel");
      }
    }


    
    /*************************************/
    /* ACTION UNIT ATTACK WEAPON SELECT  */
    /*************************************/
    this.stateAction.unitAttackWeaponSelect =
    {
      onBegin: async ()=>
      {
	// unit guaranteed to have a weapon
	this.Panels.hide("selectedUnitActionPanel");
	this.Panels.show("selectedUnitWeaponPanel");

	this.toDraw.hide("cursor");
      },
      select: async()=>
      {
        triggerEvent("sfx_play_beep_effect");
	this.temp.selectedUnit.eqWeap = this.Panels.get("selectedUnitWeaponPanel").idx();

	await this.setStatus("unitAttackTargetSelect");
      },

      cancel:async ()=>
      {
        this.Panels.del("selectedUnitWeaponPanel");
        await this.setStatus("unitActionSelect");
      },
      arrows:async (a)=>
      {
	if (scrollSelect_UD(a, this.Panels.get("selectedUnitWeaponPanel")))
	  this.Panels.redraw("selectedUnitWeaponPanel");
      }
    }

    
    this.stateAction.unitActionSelect =
    {

    /*************************************/
    /* ACTION UNIT ACTION SELECT         */
    /*************************************/
      onBegin: async ()=>
      {
	//await this.camera.waitShiftAbsolute(this.temp.cameraPrev);
	await this.camera.waitShiftTo(this.temp.selectedUnit);
	this.cursor.moveInstant(this.temp.selectedUnit);
	this.toDraw.hide("cursor");
        this.Panels.show("selectedUnitActionPanel");
      },

      select:()=>
      {
	triggerEvent("sfx_play_beep_effect");
	this.Panels.get("selectedUnitActionPanel").get().execute();
      },
      cancel:()=>
      {
	this.ctx[4].clearRect(0,0,C_WIDTH, C_HEIGHT);
	this.Panels.del("selectedUnitActionPanel");

	this.toDraw.del("selectedUnitAttackableTiles");
	
	this.temp.selectedUnit.revertMove();
	this.setStatus("unitMoveLocation");
	
	this.toDraw.show("cursor");
      },
      arrows:(a)=>
      {
	if (scrollSelect_UD(a, this.Panels.get("selectedUnitActionPanel")))
	  this.Panels.redraw("selectedUnitActionPanel");
      }

    }

    this.stateAction.unitForcedActionSelect =
    {
    /*************************************/
    /* ACTION UNIT FORCED ACTION SELECT  */
    /*************************************/
      onBegin: this.stateAction.unitActionSelect.onBegin,
      select: this.stateAction.unitActionSelect.select,
      cancel: () => {},
      arrows: this.stateAction.unitActionSelect.arrows
    }


    this.stateAction.unitMoveLocation =
    {
    /*************************************/
    /* ACTION UNIT MOVE LOCATION         */
    /*************************************/
      onBegin: async ()=>
      {
	await this.camera.waitShiftTo(this.temp.selectedUnit);

	this.toDraw.show("selectedUnitMovable");
	this.toDraw.show("selectedUnitPath");
	this.cursor.moveInstant(this.toDraw.get("selectedUnitPath").last());
	this.toDraw.show("cursor");
	this.handlePortrait();
      },
    
      select: async ()=>
      {
	await cursorStop(this.cursor);

	this.clearCtx(4);

	let target = new Coord( this.cursor.x, this.cursor.y );
	let unitOnTarget = this.Map.getTile(this.toDraw.get("selectedUnitPath").last()).unit;
	//TODO make units have another object detainling whattiles that can end turn on
	// ie flyers can fly over spikes but not land on it
	if (this.toDraw.get("selectedUnitMovable")[0].contains(target)
	  && (unitOnTarget == null || unitOnTarget == this.temp.selectedUnit))
	{
	  triggerEvent("sfx_play_beep_effect");

	  await this.camera.waitShiftTo(this.temp.selectedUnit);
	  this.camera.setTarget(this.temp.selectedUnit.vis);

	  await this.temp.selectedUnit.tentativeMove(this, this.toDraw.get("selectedUnitPath") )
	  
	  this.camera.setTarget(this.cursor.vis);
	  this.camera.resetBorders();

	  this.toDraw.hide("selectedUnitMovable");
	  this.toDraw.hide("selectedUnitPath");

	  this.toDraw.set("selectedUnitAttackableTiles", this.temp.selectedUnit.attackableTiles(this.Map));
	  let uActions = this.generateUnitActions(this, this.temp.selectedUnit);

	  let numActions = uActions.length;
	  
	  let ap = new SelectionPanel(50,50, 20+64,16*numActions+20, 1, numActions, 398, 50, uActions);
	  
	  this.temp.cameraPrev = new Coord(this.camera.offset);
	  if (this.camera.onLeft(this.temp.selectedUnit))
	  {
	    ap.shift();
	  }

	  this.Panels.set("selectedUnitActionPanel", ap);

	  this.setStatus("unitActionSelect");
	}
	else
	{
	  triggerEvent("sfx_play_err_effect");
	}
      },
      
      cancel: async ()=>
      {
	// disable further cursor movement
	triggerEvent("sfx_play_beep_effect");

	// wait until cursor stops moving
	await cursorStop(this.cursor);
	this.toDraw.hide("cursor");

	// move the cursor back to the unit and update state on complete
	this.cursor.moveInstant(this.temp.selectedUnit);
	await this.camera.waitShiftTo(this.temp.selectedUnit);
	
	this.toDraw.del("selectedUnitMovable");
	this.toDraw.del("selectedUnitPath");
	
	this.setStatus("map");
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

	  await this.cursor.move(delta);
	  await this._arrow_editPath(delta);
	}
	// if nothing was pressed this tick
	else if (this.Inputter.accepting == true)
	{
	  a.held.forEach( (d) => { delta.add( ARROWS[d] );} );
	  
	  let inside = this.toDraw.get("selectedUnitMovable")[0].contains(this.cursor.resultOf(delta));

	  if (this.cursorOutsideMovable == true || inside)
	  {
	    await this.cursor.move(delta);
	    await this._arrow_editPath(delta);
	    
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
      onBegin: ()=>
      {
	this.Panels.hide("UMP");
	// TODO map options might be the same no matter what. See if I can make this constant.
	this.temp["mapActions"] = new LoopSelector(
	  [new Action("????????", ()=>{console.log("You clicked the test button!");}),
	  new Action("Options", async ()=>
	    {
	      this.Panels.hide("mapActionPanel");
	      this.temp["mapState"] = this.toDraw;
	      this.skipOnBegin = true;
	      await this.setExtStatus(new OptionScreen(this),
		()=>{return "mapOptionSelect"},
		()=>{ this.clearAllCtx(); this.Panels.show("mapActionPanel") });

	      
	      
	    }),
	   new Action("End Turn", async ()=>
	    {
	      // TODO when i decide to remove this for danger area
	      this.toDraw.delc("enemyAtackable");

	      // TODO make camera go to original location instead of seeking to cursor's original location
	      this.Panels.del("mapActionPanel");

	      await this.enemyPhase();
	    })
	]);

	let numActions = this.temp.mapActions.length;
	this.Panels.set("mapActionPanel",
	  new SelectionPanel(398,50, 20+64,16*numActions+20, 1, numActions, 398, 50, this.temp.mapActions));
	this.temp["cursorPrev"] = new Coord(this.cursor.x, this.cursor.y);
	
	this.toDraw.hide("cursor");
      },

      select: async () =>
      {
	triggerEvent("sfx_play_beep_effect");
	await this.temp.mapActions.get().execute();
      },
      
      cancel: ()=>
      {
	this.Panels.del("mapActionPanel")

	this.setStatus("map");
      },
      
      
      arrows: (a) =>
      {
	if (scrollSelect_UD(a, this.Panels.get("mapActionPanel")))
	  this.Panels.redraw("mapActionPanel");
      }
    },
    

    /*************************************/
    /* ACTION MAP                        */
    /*************************************/
    
    this.stateAction.map = 
    {
      onBegin: ()=>
      {
	// delete stuff from selecting a unit
        this.toDraw.delc("selectedUnitAttackableTiles");
        this.toDraw.delc("selectedUnitMovable");
        this.toDraw.delc("selectedUnitPath");
        this.Panels.delc("selectedUnitWeaponPanel");
        this.Panels.delc("selectedUnitActionPanel");
        delete this.temp["selectedUnitAttackableEnemies"];

	this.toDraw.show("cursor");
        this.temp = {};
	this.handlePortrait();
      },
      
      select: async () =>
      {
	await cursorStop(this.cursor);
	triggerEvent("sfx_play_beep_effect");
	let unit = this.Map.getTile(this.cursor.x, this.cursor.y).unit;
	if (unit != null && unit.active == true)
	{
	  this.temp["hostileUnits"] = this.Units.getTeams(this.getHostile(unit.team) )
	  this.Map.getPathingMap(this.temp.hostileUnits);

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
	    
	    this.setStatus("unitMoveLocation");
	  }
	  else
	  {
	    // TODO when i decide to remove this for danger area
	    this.toDraw.set("enemyAtackable", unit.movable(this, true)[1] );
	  }
	}
	else
	{
	  this.setStatus("mapOptionSelect");
	}
      },

      arrows: async (a) =>
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
	
	this.cursor.move(delta);
      },
      inform: async ()=>
      {
	await cursorStop(this.cursor);
        triggerEvent("sfx_play_beep_effect");
        let unit = this.Map.getTile(this.cursor.x, this.cursor.y).unit;
        if (unit != null)
        {
          this.temp["mapState"] = this.toDraw;
          let prev = this.gameStatus;
	  await this.setExtStatus(new UnitInfoScreen(this, unit),
	    (res) => {return prev;},
	    (res) => {}
	  );

	}

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

    /*************************************/
    /* ACTION OTHER                      */
    /*************************************/
    
    this.stateAction.other = 
    {
      onBegin: async (nextStatus, onDone)=>
      {
	await this.toDraw.begin( (retVal) =>
	{
	  this.toDraw = this.temp.mapState;
	  let next = nextStatus(retVal);
	  if (this.skipOnBegin === false)
	    this.setStatus(nextStatus(retVal));
	  else
	  {
	    this.gameStatus = next;
	    this.skipOnBegin = false;
	  }

	  delete this.temp.mapState;
	  //delete this.temp.prevStatus;
	  if (onDone) onDone(retVal);
	});
      },
      select: async () => { await this.toDraw.select(); },
      arrows: async (a) => { await this.toDraw.arrows(a); },
      inform: async ()=> { await this.toDraw.inform(); },
      cancel: async ()=> { await this.toDraw.cancel(); }
    }
  }
  async beginTurn(turnData)
  {
    await this.Music.fadestop(this.mapTheme);

    this.Events.execute();

    for (let u of this.Units){ u.turnInit();}

    await this.toDraw.get("banner").flyBanner(turnData.turn + " Phase", turnData.bannercolor);

    this.mapTheme = turnData.maptheme;
    this.Music.play(this.mapTheme);
  }

  async enemyPhase()
  {
    this.turn.next();
    let turno = this.turn.get();
    while (turno.turn != "Player")
    {
      if (this.Units.teams[turno.turn] === undefined)
      {
	this.turn.deleteCurrent();
      }
      else
      {
	await this.beginTurn(turno);

	await this.nonPlayerTurn(turno);
      }
      this.turn.next();
      turno = this.turn.get();
    }

    ++this.turncount;

    await this.beginTurn(turno);

    this.cursor.moveInstant(this.temp.cursorPrev);

    await this.camera.waitShiftTo(this.cursor.vis);
    this.camera.setTarget(this.cursor.vis);

    this.cursor.curAnim().reset();
    
    this.setStatus("map");
  }


  /*************************************/
  /* NON-PLAYER TURN                   */
  /*************************************/
  async nonPlayerTurn(turndata)
  {
    let team = turndata.turn;
    let t = new EnemyController(this);

    let hostile = this.Units.getTeams(this.getHostile(team));
    this.Map.getPathingMap(hostile);

    for (let unit of this.Units.teams[team])
    {
      await this.camera.waitShiftTo(unit);
      this.camera.setTarget(unit.vis);

      let info = await t.offense(unit);

      this.cursor.moveInstant(unit);
      this.toDraw.show("cursor");
      this.cursor.curAnim().reset();
      await waitTime(500);
      this.toDraw.hide("cursor");

      await unit.tentativeMove(this, info.path);
      
      unit.confirmMove(this);

      if (info.attacks == true)
      {
	let battle = new Battle(this, unit, info.target);

	this.cursor.moveInstant(info.target);

	this.toDraw.show("cursor");
	this.cursor.curAnim().reset();
	await waitTime(500);
	this.toDraw.hide("cursor");

	await this.Music.fadeout(this.mapTheme);

	this.temp["mapstate"] = this.toDraw;

	this.toDraw = battle;

	await battle.begin(turndata.btltheme);

	this.Music.fadein(this.mapTheme);

	// restore the gamestate
	this.toDraw = this.temp["mapstate"];

      }
      unit.endTurn(this);
      await waitTime(500);

    }
  }

  
  /*************************************/
  /* OTHER STUFF                       */
  /*************************************/
  async _arrow_editPath(delta, hostile)
  {
    let c = new Coord(this.cursor.x, this.cursor.y);
    let prevcursor = new Coord(this.cursor.x - delta.x, this.cursor.y - delta.y);
    if (this.toDraw.get("selectedUnitMovable")[0].contains(c))
    {
      //unit.movcost[this.getTile(this.cursor.x, this.cursor.y)];
      let p = this.toDraw.get("selectedUnitPath");
      let unit = this.temp.selectedUnit;
      let cost = unit.movcost;
      
      if (p.doesNotContain(c))
      {
	let ccost = getCost(this.Map, c.x, c.y, cost);

	let prev = p.last();
	// if the term-wise product is not zero, then neither x nor y is 0 => diagonal
	if (Math.abs(c.x - prev.x) + Math.abs(c.y - prev.y) >= 2)
	{
	  let np = await generatePath(this, prev.x, prev.y, c.x, c.y, cost);
	  np.dequeue();

	  let addcost = 0;
	  np.forEach((tile) => {addcost += getCost(this.Map, tile.x, tile.y, cost);} );

	  // if this is a legit move
	  if (this.temp.selectedUnitMov >= addcost && p.intersect(np) == false)
	  {
	    this.temp.selectedUnitMov -= addcost;
	    while (np.nonempty())
	    {
	      p.push(np.dequeue())
	    }
	    return;
	  }
	  else
	  {
	    np = await generatePath(this, unit.x, unit.y, c.x, c.y, cost);

	    let first = np.front();
	    let newcost = - getCost(this.Map, first.x, first.y, cost);
	    np.forEach((tile) => {newcost += getCost(this.Map, tile.x, tile.y, cost);} );
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
	  let newcost = - getCost(this.Map, first.x, first.y, cost);
	  np.forEach((tile) => {newcost += getCost(this.Map, tile.x, tile.y, cost);} );
	  this.temp.selectedUnitMov = unit.getMov() - newcost;
	  p.consume(np);
	}
      }
      else
      {
	while (p.last().equals(c) == false)
	{
	  let t = p.pop();
	  this.temp.selectedUnitMov += getCost(this.Map, t.x, t.y, cost);
	}
      }
    }
  }





















  async healUnit(unit, amount)
  {
    await this.camera.waitShiftTo(unit);
    let hb = new MapHealthBar(this, unit);
    let realAmount = Math.min(amount, unit.stats.maxhp - unit.stats.hp);
    this.toDraw.set("hb", hb);
    await waitTime(500);
    for (let i = 0; i < realAmount; ++i)
    {
      ++ unit.stats.hp;
      this.Music.play("FX_healblip");
      await waitTick();
      await waitTick();
    }
    await waitTime(500);
    this.toDraw.del("hb");
  }

  generateCanvasLayers()
  {
    // 0: bg, 1: walkable/other effects, 2: units, 3: cursor/effects, 4: hud
    let canv = document.getElementById("canvases");
    for (let i = 0; i <= NUMLAYER; i++)
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
      this.ctx[i].textBaseline = "top";
      //this.ctx[i]["font-smooth"] = "never";
    }
  }
  blockInput()
  {
    this.inputting = false;
  }
  unblockInput()
  {
    this.inputting = true;
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
    if ( curTile != null && curTile.unit == null )
    {
      curTile.unit = unit;
      this.Units.addUnit(unit);
    }
    else
    {
      console.error( "ERROR - attempted to add unit in position (", unit.x, ", ",unit.y,")!");
    }
  }
  removeUnit( unit )
  {
    let curTile = this.Map.getTile(unit.x, unit.y);
    if ( curTile.unit != null && curTile.unit.id == unit.id)
    {
      curTile.unit = null;
      this.Units.delUnit(unit);
      // handle removing turnbanner somewhere else
    }
    else
    {
      console.error( "ERROR - attempted to remove unit in position (", unit.x, ", ",unit.y,")!");
    }
  }
  clearCtx(n)
  {
    this.ctx[n].clearRect(0,0,C_WIDTH, C_HEIGHT);
  }
  clearAllCtx()
  {
    for (let i = 0; i <= 5; ++i)
      this.clearCtx(i);
  }
  setTextColor(ctx, color)
  {
    this.ctx[ctx].fillStyle = color;
  }
  setTextFont(ctx, font)
  {
    this.ctx[ctx].font = font;
  }
  setTextJustify(ctx, justify)
  {
    this.ctx[ctx].textAlign = justify;
  }
  setTextProperty(ctx, color=null, font=null, justify=null)
  {
    let c = this.ctx[ctx];
    if (color !== null)
      c.fillStyle = color;
    if (font !== null)
      c.font = font;
    if (justify !== null)
      c.textAlign = justify;
  }
  drawImage(ctx, image, x, y, w, h)
  {
    if ( w == null || h == null )
      this.ctx[ctx].drawImage(this.Album.get(image), x, y);
    else
      this.ctx[ctx].drawImage(this.Album.get(image), x, y, w, h);
  }

  drawOutlinedText(ctx, text, x, y, font, incolor, outcolor, maxwidth = undefined)
  {
    this.setTextFont(ctx, font);
    this.setTextColor(ctx, incolor);
    this.drawText(ctx, text, x, y, maxwidth);
    this.setTextColor(ctx, outcolor);
    this.strokeText(ctx, text, x, y, maxwidth);
  }
  drawText(ctx, text, x, y, maxWidth = undefined)
  {
    this.ctx[ctx].fillText(text, x, y, maxWidth);
  }
  strokeText(ctx, text, x, y)
  {
    this.ctx[ctx].strokeText(text, x, y);
  }
  draw()
  {
    //TODO TODO TODO TODO TODO TODO TODO TODO TODO
    // 
    // add an object for (do i have to redraw this canvas)
    // for each layer, then only draw layers that have it set to true.
    //
    //TODO TODO TODO TODO TODO TODO TODO TODO TODO
    for (let c of this.ctx_refresh)
      this.clearCtx(c);

    this.toDraw.draw(this);
    this.Panels.draw(this);
    if (this.turncount % 2 == 0 && this.gameStatus != "other")
    {
      this.ctx[2].fillStyle = "#00008D";
      this.ctx[2].globalAlpha = 0.3;
      this.ctx[2].fillRect(0,0,C_WIDTH, C_HEIGHT);
      this.ctx[2].globalAlpha = 1;
    }
  }
  update()
  {
    // if (this.toDraw.isActive("cursor") && this.Inputter.arrowStates().input == true)
    if (this.Inputter.arrowStates().input == true && this.inputting)
    {
	this.stateAction[this.gameStatus].arrows(this.Inputter.arrowStates());
    }

    this.Inputter.update();
    this.toDraw.update(this);
    this.Panels.update(this);
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

  }

}

export {Game, FPS};
