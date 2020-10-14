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
import {Camera} from "./Camera.js";
import {Queue} from "./Queue.js";
import {MusicPlayer} from "./MusicPlayer.js";
import {DrawContainer, UnitContainer, PanelContainer, ScriptDrawer} from "./DrawContainer.js";
import {Inputter, ARROWS, ARROW} from "./Inputter.js";
import {Panel, SelectionPanel, UnitMapPanel, ItemPanel, BattlePreviewPanel} from "./Panel.js";
import {PanelComponent} from "./PanelComponent.js";
import {Battle} from "./Battle.js";
import {LoopSelector, QueueSelector} from "./LoopSelector.js";
import {Action} from "./ActionGenerator.js";
import {scrollSelect_UD, scrollSelect_4W, triggerEvent,
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
import {NightTimeEffect, waitSpriteEffect} from "./Effects.js";

import {FPS,
	TICK_RATE,
	C_WIDTH,
	C_HEIGHT,
	SCALE,
	WINDOWGRID_X,
	WINDOWGRID_Y,
	GRIDSIZE_X,
	GRIDSIZE_Y,
	CURSOR_SPEED,
	NUMLAYER,
	TEST_ENABLED} from "./Constants.js";

const gx = GRIDSIZE_X;
const gy = GRIDSIZE_Y;

class Game
{
  constructor( assets, ctx )
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
    this.Map = assets.Map;
    
    this.ctx = [];
    this.ctx_refresh = [1,2,3,5];
    this.ctx = ctx;
  
    this.turn = null;
    this.Units = new UnitContainer();
    
    this.toDraw = new DrawContainer();
    this.Panels = new PanelContainer(this);
    
    this.cursor = new Cursor(this, 0, 0, CURSOR_SPEED);

    this.camera = new Camera(this, WINDOWGRID_X, WINDOWGRID_Y);

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
    this.nightEffect = new NightTimeEffect();
    this.toDraw.set("nightEffect", this.nightEffect);
    this.temp = {};
    this.skipOnBegin = false;
    
    this.counter = 0;
    this.specialCount = 0;
    this.turncount = 1;
    this.gameStatus = "blockInput";
    this.inputting = false;
    
    
    this.cursorOutsideMovable = false;

    this.stateAction = {};
    this.initStateAction();
    this.dayLength = 1;
    
    this._extStatusComplete = false;
  }
  handlePortrait()
  {
    this.Panels.hide("UMP");
    let u = this.Map.getTile(this.cursor).unit;
    if (u != null)
    {
      if (this.camera.onLeft(this.cursor) && this.camera.onTop(this.cursor))
	this.Panels.get("UMP").shiftAlternate();
      else
	this.Panels.get("UMP").shiftOriginal();
      
      this.Panels.get("UMP").setInfo(u);
      this.Panels.show("UMP");
    }
  }
  getHostile(team)
  {
    let a = [];
    for (let td of this.turn)
    {
      if (this.Units.teamHostile(team, td.name))
      {
	a.push(td.name);
      }
    }
    return a;
  }
  async beginGame(chscript)
  {
    this.chapterScript = chscript;

    this.turn = new LoopSelector( chscript.teams );
    this.dayLength = chscript.dayLength;
    for (let td of this.turn)
      this.Units.addTeam(td.name);
    this.initAlliances()
				    
    this.toDraw.set("scriptItems", new ScriptDrawer(chscript));
    this.camera.setPos(chscript.cameraInit.x, chscript.cameraInit.y);
    this.unblockInput();
    chscript.onBegin(this, ()=>{this.startTurns();});
  }
  initAlliances()
  {
    let all = this.chapterScript.alliances;
    for (let [a, bb] of Object.entries(all))
    {
      for (let b of bb)
      {
	this.Units.createAlliance(a, b);
      }
    }
  }
  wait(unit)
  {
    unit.confirmMove(this);
    unit.endTurn(this);

    this.Panels.del("selectedUnitActionPanel");
    this.toDraw.del("selectedUnitMovable");
    this.toDraw.del("selectedUnitPath");
    this.toDraw.del("selectedUnitAttackableTiles");

    this.setStatus("map");
  }

  generateUnitActions(g, unit)
  {
    let p = [];
    let coord = unit.x + "," + unit.y;
    let interaction = this.chapterScript.interactions[coord];
    if (interaction !== undefined)
    {
      p.push( new Action( interaction.tooltip, async () => {

	this.gameStatus = "blockInput";
	
	this.Panels.del("selectedUnitActionPanel");
	this.toDraw.del("selectedUnitMovable");
	this.toDraw.del("selectedUnitPath");
	this.toDraw.del("selectedUnitAttackableTiles");

	await interaction.action(this, unit, ()=>{
	  unit.confirmMove(this);
	  unit.endTurn(this);
	});

	
      } ) );

    }

    let attackable = unit.attackableUnits(this, this.temp.unitUsableWeapons);
    if (attackable.nonempty())
    {
      // attack
      p.push( new Action( "Attack", () =>
	{
	  let usableWpn = this.temp.unitUsableWeapons;
	  let len = usableWpn.length;
	  let uWeap = new LoopSelector( usableWpn, this.temp.unitUsableIdx);
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
      p.push( new Action( "Trade", async () =>
      {
	this.temp["allyInteract"] = async (target)=>
	{
	  await this.setExtStatus(new UnitTradeScreen(this, unit, target),
	    () =>
	    {
	      if (this.temp.traded) return "unitForcedActionSelect";
	      else		    return "unitActionSelect";
	    });
	    //this.clearCtx(4);
	    //this.clearCtx(5);
	    this.toDraw.show("cursor");
	}
	await this.setStatus("unitAllySelect", adjacent);
      }));
    }

    if (unit.hasUsableItem())
    {
      // item TODO
      p.push( new Action( "Item", async () =>
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
    p.push( new Action( "Wait", ()=>{this.wait(unit)}));

    return new LoopSelector(p);

  }
  async setExtStatus(extState, nextStatus = null)
  {
    this.temp["prevGameStatus"] = this.gameStatus;
    this.temp["mapState"] = this.toDraw;
    this.toDraw = extState;
    this.gameStatus = "other";
    this.unblockInput();
    await new Promise( res=>{this.stateAction.other.onBegin(nextStatus, res)});
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

	  let p = new BattlePreviewPanel(this, this.temp.selectedUnit, this.Map.getTile(first).unit)
	  if (this.camera.onLeft(first))
            p.shift();
	  p.explicitDraw(this, 4);

      },

      select: async()=>
      {
	this.clearCtx(4);
	triggerEvent("sfx_play_beep_effect");
        let enemy = this.Map.getTile(this.temp.selectedUnitAttackCoords.get()).unit;

	// confirm move
	this.temp.selectedUnit.confirmMove(this);

	let battle = new Battle(this, this.temp.selectedUnit, enemy, this.turn.get().btltheme);

	await MusicPlayer.fadeout(this.mapTheme);
	
	let casualty = null;
	await this.setExtStatus(battle, null);
	casualty = battle.dead;

	MusicPlayer.fadein(this.mapTheme);

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
	await this.killUnit(casualty);
	
	try
	{
	  await this.handleAfterBattleEvents();
	}
	catch(e)
	{
	  if (e == 4141)
	    this.startTurns();
	  else
	    throw e;
	}
      },
      cancel:async ()=>
      {
	this.clearCtx(4);
	await this.setStatus("unitAttackWeaponSelect");
	this.Panels.show("selectedUnitWeaponPanel");
      },
      arrows:async (a)=>
      {
	this.clearCtx(4);
	this.blockInput();
	scrollSelect_4W(a, this.temp.selectedUnitAttackCoords);
	
	let target = this.temp.selectedUnitAttackCoords.get();
	await this.camera.waitShiftTo(target);
	this.cursor.moveInstant(target);
	this.unblockInput();
	
	let p = new BattlePreviewPanel(this, this.temp.selectedUnit, this.Map.getTile(target).unit);
	if (this.camera.onLeft(target))
	  p.shift();
	p.explicitDraw(this, 4);
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
	await this.camera.waitShiftTo(this.temp.selectedUnit);
	this.cursor.moveInstant(this.temp.selectedUnit);
	this.toDraw.hide("cursor");
        this.Panels.show("selectedUnitActionPanel");
	this.temp.traded = false;
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
      onBegin: async () =>
      {
	await this.camera.waitShiftTo(this.temp.selectedUnit);
        this.cursor.moveInstant(this.temp.selectedUnit);
        this.toDraw.hide("cursor");
        this.Panels.show("selectedUnitActionPanel");
      },

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
	  this.camera.setTarget(this.temp.selectedUnit);

	  await this.temp.selectedUnit.tentativeMove(this, this.toDraw.get("selectedUnitPath") )
	  
	  this.camera.setTarget(this.cursor);
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
	if (this.cursor.moving)
	  return;
	let delta = new Coord(0,0);
	
	if (a.once.length > 0)
	{
	  a.once.forEach( (d) => { delta.add( ARROWS[d] );} );

	  triggerEvent("input_arrowStall", {start : a.held.length == 0});

	  // usually outside movable == false. If keypressed, allow it to go outside but only if moves outside
	  this.cursorOutsideMovable = (this.toDraw.get("selectedUnitMovable")[0]
				      .doesNotContain(this.cursor.resultOf(delta)));

	  let ep = this._arrow_editPath(delta);
	  let cm = this.cursor.move(delta);
	  await Promise.all([cm, ep]);
	}
	// if nothing was pressed this tick
	else if (Inputter.accepting == true)
	{
	  a.held.forEach( (d) => { delta.add( ARROWS[d] );} );
	  
	  let inside = this.toDraw.get("selectedUnitMovable")[0].contains(this.cursor.resultOf(delta));

	  if (this.cursorOutsideMovable == true || inside)
	  {
	    let ep = this._arrow_editPath(delta);
	    let cm = this.cursor.move(delta);
	    await Promise.all([cm, ep]);
	    
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
	      this.skipOnBegin = true;
	      await this.setExtStatus(new OptionScreen(this),
		()=>{return "mapOptionSelect"})
	      this.clearAllCtx();
	      this.Panels.show("mapActionPanel");

	      
	      
	    }),
	   new Action("End Turn", async ()=>
	    {
	      // TODO when i decide to remove this for danger area
	      this.toDraw.delc("enemyAtackable");

	      // TODO make camera go to original location instead of seeking to cursor's original location
	      this.Panels.del("mapActionPanel");

	      this.gameStatus = "blockInput";
	      try
	      {
		await this.enemyPhase();
	      }
	      catch(e)
	      {
		if (e == 4141)
		  this.startTurns();
		else
		  throw e;
	      }
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

	    let usableIdx = [-1];
	    let usableWpns = unit.getUsableWeapons(usableIdx);
	    this.toDraw.set("selectedUnitMovable", unit.movable(this, true, true, usableWpns) );
	    this.temp.unitUsableWeapons = usableWpns;
	    this.temp.unitUsableIdx = usableIdx[0];
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
	else if (Inputter.accepting == true)
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
          let prev = this.gameStatus;
	  await this.setExtStatus(new UnitInfoScreen(this, unit),
	    (res) => {return prev;});

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
      onBegin:()=>{},
      select:()=>{},
      arrows:(a)=>{},
      inform:()=>{},
      cancel:()=>{}
    }

    // ONDONE AFTER STATECHANGE
    /*************************************/
    /* ACTION OTHER                      */
    /*************************************/
    
    this.stateAction.other = 
    {
      onBegin: async (nextStatus, onDone)=>
      {
	await this.toDraw.begin( async (retVal) =>
	{
	  this.toDraw = this.temp.mapState;
	  delete this.temp.mapState;

	  if (nextStatus !== null)
	  {
	    let next = nextStatus(retVal);

	    if (this.skipOnBegin === false)
	      this.setStatus(nextStatus(retVal));
	    else
	    {
	      this.gameStatus = next;
	      this.skipOnBegin = false;
	    }
	  }
	  else
	  {
	    this.gameStatus = this.temp.prevGameStatus;
	  }
	  
	  if (onDone) await onDone(retVal);
	  this._extStatusComplete = true;
	});
      },
      select: async () => { await this.toDraw.select(); },
      arrows: async (a) => { await this.toDraw.arrows(a); },
      inform: async ()=> { await this.toDraw.inform(); },
      cancel: async ()=> { await this.toDraw.cancel(); }
    }
  }

  async fadeIn()
  {
    this.blockInput();
    for (let i = 0; i < 32; ++i)
    {
      this.ctx[5].fillStyle = "black";
      this.ctx[5].globalAlpha = (31 - i)/32;
      this.ctx[5].fillRect(0,0,512,384);
      await waitTick();
    }
    this.ctx[5].globalAlpha = 1;
    this.unblockInput();
  }
  async fadeOut()
  {
    this.blockInput();
    for (let i = 0; i < 32; ++i)
    {
      this.ctx[5].fillStyle = "black";
      this.ctx[5].globalAlpha = (i+1)/32;
      this.ctx[5].fillRect(0,0,512,384);
      await waitTick();
    }
    this.ctx[5].globalAlpha = 1;
    this.unblockInput();
  }
  async onVictory()
  {
    this.blockInput();
    this.gameStatus = "blockInput";
    MusicPlayer.stopAll();
    this.draw = ()=>{};
    this.update = ()=>{};
    this.mainloop = ()=>{};
    this.ctx[5].fillStyle = "black";
    for (let i = 0; i < 30; ++i)
    {
      this.ctx[5].globalAlpha = 0.1;
      this.ctx[5].fillRect(0,0,512,384);
      await waitTick();
    }
    this.ctx[5].globalAlpha = 1;
    this.ctx[5].fillRect(0,0,512,384);
  
    console.log("monka");
    this.setTextColor(5, "#0022ec")
    this.setTextFont(5, "22px ABCD Mono")
    this.setTextJustify(5, "center")
    this.drawText(5, "YOU WIN", 256, 130);
    this.setTextFont(5, "11px ABCD Mono")
    this.drawText(5, "Thank you for playing my game!", 256, 200);
    this.drawText(5, "If you can, please give me some feedback.", 256, 222);
    this.drawText(5, "Stay tuned for updates!", 256, 244);
  }
  async onGameOver()
  {
    this.blockInput();
    this.gameStatus = "blockInput";
    MusicPlayer.stopAll();
    this.draw = ()=>{};
    this.update = ()=>{};
    this.mainloop = ()=>{};
    this.ctx[5].fillStyle = "black";
    for (let i = 0; i < 30; ++i)
    {
      this.ctx[5].globalAlpha = 0.1;
      this.ctx[5].fillRect(0,0,512,384);
      await waitTick();
    }
    this.ctx[5].globalAlpha = 1;
    this.ctx[5].fillRect(0,0,512,384);
  
    this.setTextColor(5, "red")
    this.setTextFont(5, "22px ABCD Mono")
    this.setTextJustify(5, "center")
    this.drawText(5, "GAME OVER", 256, 130);
    this.setTextFont(5, "11px ABCD Mono")
    this.drawText(5, "The restart button has not yet been implemented", 256, 200);
    this.drawText(5, "For now, just refresh the page to play again", 256, 222);
    this.drawText(5, "If possible, please give me some feedback.", 256, 244);
  }
  async beginTurn(turnData)
  {
    for (let u of this.Units){ u.turnInit();}

    await this.toDraw.get("banner").flyBanner(turnData.name + " Phase", turnData.bannercolor);

    this.mapTheme = turnData.maptheme;
    MusicPlayer.play(this.mapTheme);
  }

  async startTurns()
  {
    this.temp.cursorPrev = undefined;
    this.turn.reset();
    this.camera.setTarget(this.cursor);
    await this.beginTurn(this.turn.get());
    this.toDraw.show("cursor");
    this.cursor.curAnim().reset();
    this.setStatus("map");
  }
  async enemyPhase()
  {
    this.blockInput();
    await MusicPlayer.fadestop(this.mapTheme);
    this.turn.next();
    let turno = this.turn.get();
    while (turno.name != "Player")
    {
      await this.handleTurnBeginEvents();
      let t_u = this.Units.getTeam(turno.name);
      if (t_u !== undefined && t_u.size > 0)
      {
	await this.beginTurn(turno);

	await this.nonPlayerTurn(turno);
	await MusicPlayer.fadestop(this.mapTheme);

      }
      this.turn.next();
      turno = this.turn.get();
    }

    ++this.turncount;
    ++this.specialCount;

    await this.handleTurnBeginEvents();
    await this.beginTurn(turno);

    if (this.temp.cursorPrev !== undefined)
      this.cursor.moveInstant(this.temp.cursorPrev);

    await this.camera.waitShiftTo(this.cursor.vis);
    this.camera.setTarget(this.cursor);

    this.cursor.curAnim().reset();
    
    this.setStatus("map");
    this.unblockInput();
  }


  /*************************************/
  /* NON-PLAYER TURN                   */
  /*************************************/
  async nonPlayerTurn(turndata)
  {
    let team = turndata.name;
    let t = new EnemyController(this);

    let hostile = this.Units.getTeams(this.getHostile(team));
    this.Map.getPathingMap(hostile);

    for (let unit of this.Units.teams[team])
    {
      await waitTime(250);
      let info = await t.offense(unit);

      if (info.action == false)
	continue;
      
      await this.camera.waitShiftTo(unit);
      this.camera.setTarget(unit);


      this.cursor.moveInstant(unit);
      this.toDraw.show("cursor");
      this.cursor.curAnim().reset();
      await waitTime(500);
      this.toDraw.hide("cursor");

      await unit.tentativeMove(this, info.path);
      unit.confirmMove(this);


      if (info.attacks == true)
      {
	let battle = new Battle(this, unit, info.target, turndata.btltheme);

	this.cursor.moveInstant(info.target);

	this.toDraw.show("cursor");
	this.cursor.curAnim().reset();
	await waitTime(500);
	this.toDraw.hide("cursor");

	await MusicPlayer.fadeout(this.mapTheme);

	await this.setExtStatus(battle, null);
	let casualty = battle.dead;
	MusicPlayer.fadein(this.mapTheme);

	await this.killUnit(casualty);
	await this.handleAfterBattleEvents();
      }
      unit.endTurn(this);
      await waitTime(250);
    }
  }

  
  /*************************************/
  /* OTHER STUFF                       */
  /*************************************/
  _arrow_editPath(delta, hostile)
  {
    // NEVER TOUCH THIS AGAIN HOLY MOLY
    return new Promise(async (boogey)=>
      {
	let c = new Coord(this.cursor.x + delta.x, this.cursor.y + delta.y);
	let prevcursor = new Coord(this.cursor.x, this.cursor.y);

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
	boogey();
      });
  }













  getAffiliation(unit)
  {
    if (unit.team == "Player")
      return "";
    if (this.Units.teamHostile(unit.team, "Player"))
      return "_enemy";
    return "_ally";
  }



  async recruitJingle(unit)
  {
    MusicPlayer.mute(this.mapTheme);
    await Promise.all(
      [
	MusicPlayer.play("FX_join"),
	this.alert(unit.name + " joined!")
      ]);
    MusicPlayer.unmute(this.mapTheme);
  }
  async leaveJingle(unit)
  {
    MusicPlayer.mute(this.mapTheme);
    await Promise.all(
      [
	MusicPlayer.play("FX_leave"),
	this.alert(unit.name + " is no longer controllable.")
      ]);
    MusicPlayer.unmute(this.mapTheme);
  }

  async switchTeam(unit, team)
  {
    this.Units.switchTeam(unit, team);
  }


  async alert(text, x=256, y=200)
  {
    this.blockInput();
    this.setTextProperty(4, "black", "11px ABCD Mono", "center");
    let w = Math.ceil(this.ctx[4].measureText(text).width);
    let h = 20 + 16.5*text.split("\n").length - 5.5;
    let p = new Panel(x - w/2, y, w + 20, h);
    p.explicitDraw(this, 4);
    this.drawText(4, text, x+10, y+10);
    await waitTime(2000);
    this.ctx[4].clearRect(x - w/2, y, w + 20, h);
    this.unblockInput();
  }
  async cursorFlash(x, y)
  {
    if (Settings.get("cut_skip") == true)
      return;

    await waitTime(250);
    await this.smallCursorFlash(x, y);
  }
  async smallCursorFlash(x, y = null)
  {
    if (Settings.get("cut_skip") == true)
      return;

    if (y === null)
      this.cursor.moveInstant(x);
    else
      this.cursor.moveInstant(new Coord(x, y));

    this.toDraw.show("cursor");
    this.cursor.curAnim().reset();
    await waitTime(1000);
    this.toDraw.hide("cursor");
  }

  isDayTime()
  {
    if (this.dayLength > 0)
      return (Math.floor((this.turncount - 1) / this.dayLength) % 2 == 0);
    else
      return (this.dayLength == 0);
  }
  isNightTime()
  {
    return !this.isDayTime();
  }
  async healUnit(unit, amount = null)
  {
    if (amount === null)
      amount = unit.stats.maxhp;
    await this.camera.waitShiftTo(unit);
    let hb = new MapHealthBar(this, unit);
    let realAmount = Math.min(amount, unit.stats.maxhp - unit.stats.hp);
    if (realAmount > 0)
    {
      this.toDraw.set("hb", hb);
      await waitTime(500);
      for (let i = 0; i < realAmount; ++i)
      {
	++ unit.stats.hp;
	MusicPlayer.play("FX_healblip");
	await waitTick();
	await waitTick();
      }
      await waitTime(500);
      this.toDraw.del("hb");
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

  // if from !== null, unit enters from the "from" coordinate.
  async addUnit( unit, from = null)
  {
    let curTile = this.Map.getTile(unit.x, unit.y);
    if ( curTile != null && curTile.unit == null )
    {
      curTile.unit = unit;
      this.Units.addUnit(unit);
      if (from !== null)
      {
	this.blockInput();
	let dx = unit.x - from.x;
	let dy = unit.y - from.y;
	for (let i = 0; i < 6; ++i)
	{
	  unit.vis.x = from.x + i*dx/6;
	  unit.vis.y = from.y + i*dy/6;
	  await waitTick();
	}
	unit.vis.x = unit.x;
	unit.vis.y = unit.y;
	this.unblockInput();
      }
    }
    else
    {
      console.error( "ERROR - attempted to add unit in position (", unit.x, ", ",unit.y,")!");
    }
  }
  async handleTurnBeginEvents()
  {
    let events = this.chapterScript.events.turnBegin[this.turn.get().name];
    if (events === undefined)
      return;
    // track triggered events in backward order to easily remove
    let triggered = [];
    for (let i = 0; i < events.length; ++i)
    {
      let obj = events[i];
      let turncount;

      if (obj.type == "relative")	turncount = this.specialCount;
      else if (obj.type == "absolute")	turncount = this.turncount;
      else				console.error("handlebeginturn invalid turn type");

      if (obj.turn == turncount && obj.condition(this))
      {
	console.log("Event {" + obj.tag + "} was triggered!");
	await obj.action(this);
	triggered.unshift(i)
      }
    }
    for (let i of triggered)
      events.splice(i, 1);
  }
  async handleAfterBattleEvents()
  {
    let events = this.chapterScript.events.afterBattle;
    // track triggered events in backward order to easily remove
    let triggered = [];
    let dropEverything = false;
    for (let i = 0; i < events.length; ++i)
    {
      let obj = events[i];
      if (obj.condition(this))
      {
	console.log("Event {" + obj.tag + "} was triggered!");
	await obj.action(this);
	if (obj.repeating == false)
	  triggered.unshift(i)
	if (obj.restartTurns)
	  dropEverything = true;
      }
    }
    for (let i of triggered)
    {
      events.splice(i, 1);
    }
    if (dropEverything)
      throw 4141;
  }
  async killUnit( unit )
  {
    if (unit !== null)
    {
      this.blockInput();
      let cursorActive = this.toDraw.isVisible("cursor");
      let portraitActive = this.Panels.isVisible("UMP");
      
      if (cursorActive) this.toDraw.hide("cursor");
      if (portraitActive) this.Panels.hide("UMP");

      this.removeUnit(unit);
      await new Promise(res=>{unit.fadeOut(this, res);});


      let onDeathEvent = this.chapterScript.events.onDeath[unit.name]
      if (onDeathEvent !== undefined)
	await onDeathEvent(this);

      unit.dead = true;

      if (cursorActive) this.toDraw.show("cursor");
      if (portraitActive) this.handlePortrait();
      this.unblockInput();
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

  cameraShift(x, y)
  {
    return this.camera.waitShiftAbsolute(new Coord(x, y), 6)
  }
  cameraCenter(x, y = null)
  {
    if (y !== null)
    {
      x = new Coord(x, y);
    }
    return this.camera.waitShiftCenter(x, 6)
  }


  xg(x)
  {
    return this.gx*x;
  }
  yg(y)
  {
    return this.gy*y;
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
    try
    {
    if ( w == null || h == null )
      this.ctx[ctx].drawImage(this.Album.get(image), x, y);
    else
      this.ctx[ctx].drawImage(this.Album.get(image), x, y, w, h);
    }
    catch
    {
      console.error(image)
    }
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
    if (typeof text == "string")
    {
      let height = this.ctx[ctx].font.substring(0,2)*1.5;
      let lines = text.split('\n');
      for (let i = 0; i<lines.length; ++i)
	this.ctx[ctx].fillText(lines[i], x, y + i*height, maxWidth);
    }
    else
    {
      this.ctx[ctx].fillText(text, x, y, maxWidth);
    }

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

  }
  update()
  {
    if (this._extStatusComplete == true)
    {



      this._extStatusComplete = false;
    }
    // if (this.toDraw.isActive("cursor") && Inputter.arrowStates().input == true)
    if (Inputter.arrowStates().input == true && this.inputting)
    {
	this.stateAction[this.gameStatus].arrows(Inputter.arrowStates());
    }

    Inputter.update();
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
    console.log(this.id)
    // 10! is hghly divisible, so modulos won't run amok
    if (this.counter >= 3628800)
    {
      this.counter = 0;
    }

  }

}

export {Game, FPS};
