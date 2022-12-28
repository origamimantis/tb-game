'use strict';

import {triggerEvent, requestFile, respondToEvent} from "./Utils.js";
import {TileMap} from "./TileMap.js";
import {Album, ImageLoader} from "./Images.js";
import {MusicPlayer} from "./MusicPlayer.js";
import {MusicLoader} from "./MusicLoader.js";
import {ImageModifier} from "./ImageModifier.js";
import {Inputter, toggleLog} from "./Inputter.js";
import {BattleAnimationAlbum} from "./BattleAnimationAlbum.js";
import {Characters} from "./Characters.js";

import {Game, FPS} from "./Game.js";
import {Jukebox} from "./Jukebox.js";
import {TitleScreen} from "./TitleScreen.js";
import {LevelSelect} from "./LevelSelect.js";
import {OptionScreen} from "./OptionScreen.js";
import {WalkScene} from "./WalkScene.js";
import {Unit} from "./Unit.js";
import * as Units from "./TypeUnits.js";
import {Animation} from "./Animation.js";
import {AnimFrame} from "./AnimFrame.js";
import {Interpreter} from "./Interpreter.js";
import {PathFinder} from "./PathFinder.js";
import {Settings} from "./Settings.js";
import {LoadScreen} from "./LoadScreen.js";

import {C_WIDTH, C_HEIGHT, SCALE, NUMLAYER} from "./Constants.js";

const noState = {inputting : false, cursor: undefined};
const SCENETYPE = {
                   Game,
                   WalkScene,
                   Jukebox,
                   TitleScreen,
                   OptionScreen,
                   LevelSelect
		  };

let interpreter;
let game;

console.settings = Settings;
console.Album = Album;

console.exe = function(s)
{
  interpreter.execute(s);
}

console.execute = console.exe;

console.game = function()
{
  return Main.scene;
}

console.inputlog = toggleLog;

function _bindInteractions(script)
{
  if (script.interactions === undefined)
    return

  for (let [coord, ia] of Object.entries(script.interactions))
  {
    let c = coord.split(",");
    ia.position = {x: parseInt(c[0]), y: parseInt(c[1])};
    for (let key of Object.keys(ia))
    {
      if (typeof ia[key] == "function")
        ia[key].bind(ia);
    }
    // TODO bind for objects as well, not just interactions
  }
}

async function loadScript(script)
{
  let level = await import(script);
  level = rfdc({ proto: false, circles: false })(level.script)
  _bindInteractions(level);
  triggerEvent("load_progress", "Loaded chapter script");

  return level;
}
async function loadMap(mapFile)
{
  if (mapFile === undefined || mapFile === null)
    return null;
  let map = new TileMap();
  // load map
  mapFile = await requestFile(mapFile, true);
  map.generate(mapFile.responseText);
  return map;
}

async function loadImgs(imgList, reset = false)
{
  // load images
  if (reset == true)
    Album.reset();

  let i = new ImageLoader();
  await i.loadImgs( imgList );
}

async function modImgs(imgMod)
{
  let imscript = await requestFile(imgMod, true);
  imscript = imscript.responseText;

  ImageModifier.init(Album);
  await ImageModifier.execute(imscript)
}
async function loadMusic()
{
  await MusicLoader.load();
}

async function loadFonts()
{
  document.fonts.load("11px ABCD Mono");
  document.fonts.load("11px ABCD Mono Bold");
  document.fonts.load("16.5px ABCD Mono");
  document.fonts.load("16.5px ABCD Mono Bold");
  document.fonts.load("22px ABCD Mono");
  document.fonts.load("22px ABCD Mono Bold");
}
function loadDrawContext()
{
  // 0: bg, 1: walkable/other effects, 2: units, 3: cursor/effects, 4: hud
  let canv = document.getElementById("canvases");
  let ctx = [];
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
    ctx.push(can.getContext('2d'));
    ctx[i].imageSmoothingEnabled = false;
    ctx[i].scale(SCALE, SCALE);
    ctx[i].fillStyle = "white";
    ctx[i].textBaseline = "top";
    //ctx[i]["font-smooth"] = "never";
  }
  return ctx;
}


function setDrawFunctions(g)
{


  for (let func of [
      "clearCtx",
      "clearAllCtx",
      "setTextColor",
      "setTextFont",
      "setTextJustify",
      "setTextProperty",
      "drawText",
      "drawOutlinedText",
      "strokeText",
      "applyAngle"])
  {
    g[func] = (...args) => {Album[func](...args)};
  }
  g.drawImage = (...args) => {Album.draw(...args)};

}


class Main
{
  static init()
  {
    this.loading = true;
    this.playing = true;
    this.scene = noState;
    // LOAD BAR
    this.loadScreen = new LoadScreen(this);
    respondToEvent("load_progress", (e) =>
      {
	if (this.loading)
	  this.loadScreen.eventUpdate(e);
      });

    this.ctx = loadDrawContext();

    Inputter.init(this);
    // KEYPRESS 
    document.addEventListener( "keydown", (e)=>{Inputter.onKeyDown(e.code)} );
    document.addEventListener( "keyup", (e)=>{Inputter.onKeyUp(e.code)} );

    // GAME INPUT
    respondToEvent("input_arrowStall", (e) =>{ Inputter.arrowStall(e.start, e.speed, e.subtract); });

    respondToEvent("input_select",  async () =>
    {
      if (this.scene.inputting)
      {
        this.scene.inputting = false;
        await this.scene.select();
        this.scene.inputting = true;
      }
    });
    respondToEvent("input_cancel",  async () =>
    {
      if (this.scene.inputting)
      {
        this.scene.inputting = false;
        await this.scene.cancel();
        this.scene.inputting = true;
      }
    });
    respondToEvent("input_inform",  async () =>
    {
      if (this.scene.inputting)
      {
        this.scene.inputting = false;
	await this.scene.inform();
        this.scene.inputting = true;
      }
    });
    
    respondToEvent("cursor_move", (c) =>
    {
      this.scene.handlePortrait();
    });

  }
  static async initload(things)
  {
    Settings.init();
    Album.init(this);
    await loadFonts();
    MusicPlayer.init()
    await loadMusic();
  }
  static async unload()
  {
    MusicPlayer.stopAll();
    this.scene = noState;
  }
  static async chload(chapterScript, things=thingsToLoad, extraAssets = null)
  {
    this.scene = this.loadScreen;
    if (things !== null)
    {
      this.loadScreen.reset(things.ImgLoad.length + 57);
    }

    if (extraAssets !== null)
      this.assets = extraAssets
    else
      this.assets = {};

    this.scriptFile = chapterScript;
    this.level = await loadScript( this.scriptFile )
    this.level.scriptFile = this.scriptFile;
    this.assets.Map = await loadMap( this.level.tileMap )

    // load the tileset
    let tileset = this.imgsToLoad([])

    await loadImgs( tileset );

    if (things !== null)
    {
      await loadImgs( things.ImgLoad );
      await modImgs( things.ImgMod );
    }

    this.nextUp = new SCENETYPE[this.level.type](this.assets, this.ctx, this);
    setDrawFunctions(this.nextUp);

    PathFinder.init(this.nextUp);
  }
  static async chreset()
  {
    await this.unload();
    this.level = await loadScript( this.scriptFile )
    this.level.scriptFile = this.scriptFile;
    this.assets.Map = await loadMap( this.level.tileMap )
    
    this.nextUp = new SCENETYPE[this.level.type](this.assets, this.ctx, this);
    setDrawFunctions(this.nextUp);

    PathFinder.init(this.nextUp);
  }
  static imgsToLoad(getridofthislater)
  {
    let a = getridofthislater.slice(0);
    
    // load the tileset
    if (this.assets.Map !== null)
    a.push(...Object.values(this.assets.Map.artMap));

    return a;
  }
  static start()
  {
    if (this.nextUp === null)
      return;
    
    this.scene = this.nextUp;
    this.nextUp = null;

    Album.clearAllCtx()
    this.scene.beginGame(this.level)

  }
  static update()
  {
    if (Inputter.arrowStates().input == true && this.scene.inputting)
    {
      this.scene.arrows(Inputter.arrowStates());
    }
    Inputter.update();

    this.scene.update(this.scene);
  }
  static draw()
  {
    this.scene.draw(this.scene);
  }
  static mainloop()
  {
    if (this.playing)
      requestAnimationFrame(() => {this.mainloop()});

    if (this.scene !== noState)
    {
      this.update(this.scene);
      this.draw(this.scene);
    }
  }
}




console.main = Main;
let thingsToLoad = {
      Script : "./ch1.js",
      ImgLoad : [ "P_gen", "P_lead", "P_janitor", "P_vmp", "P_Alfred", "P_child",
		  "P_Yuliza", "P_Malidale",
		  "P_Grefta", "P_Odunfel","P_Margolik",
		  "P_bandit", "P_Billy", "P_Chloe", "P_Choddson", "P_kn", "P_Doddson",
		  "S_lead0", "S_kn0", "S_kn1", "S_kn4", "S_lead1", "S_vmp0", "S_farmerAlfred", "S_child",
		  "S_bandit", "S_farmerBilly", "S_farmerChloe",
		  "S_Yuliza_BowKnight", "S_Malidale_BowKnight",

		  "BS_kn_run", "BS_kn_hit", "BS_kn_idle", "BS_kn_hit2",
		  "BattleSprites/BS_kn_hit3",

		  "BattleSprites/Alfred/Farmer/idle",
		  "BattleSprites/Alfred/Farmer/run",
		  "BattleSprites/Alfred/Farmer/hit",

		  "BattleSprites/Billy/Farmer/idle",
		  "BattleSprites/Billy/Farmer/run",
		  "BattleSprites/Billy/Farmer/hit",

		  "BattleSprites/Chloe/Farmer/idle",
		  "BattleSprites/Chloe/Farmer/run",
		  "BattleSprites/Chloe/Farmer/hit",

		  "BattleSprites/Vargas/SwordKnight/idle",
		  "BattleSprites/Vargas/SwordKnight/run",
		  "BattleSprites/Vargas/SwordKnight/hit",

		  "BattleSprites/generic/Bandit/idle",
		  "BattleSprites/generic/Bandit/run",
		  "BattleSprites/generic/Bandit/hit",
		  "BattleSprites/generic/Child/idle",
	
		  "BattleSprites/Yuliza/BowKnight/idle",
		  "BattleSprites/Yuliza/BowKnight/hit",

		  "BattleSprites/Malidale/BowKnight/idle",
		  "BattleSprites/Malidale/BowKnight/hit",

		  "B_backdrop", "BG_unitprofile",
		  "W_spook", "W_stick", "W_sword",
		  "W_Pitchfork", "W_Shovel", "W_FryingPan", "W_LumberAxe",
		  "WT_BronzeSlicer", "WT_VampireFang", "WT_BraveSword",
		  "WT_Pitchfork", "WT_Shovel", "WT_FryingPan", "WT_LumberAxe",
		  "WT_TestBow", "WT_TestMagic",
		  "PR_arrow", 
		  "IT_Bandages",
		  "EQ_LeatherTunic",
		  "EQ_SteelPlating",
		  "EQ_SwiftBlessing",
		  "C_c0", "C_ptr", "C_audio", "C_move", "C_walk", "C_atk",
		  
		  "C_menutl", "C_menuel", "C_menucn",
		  "C_talk_indicator",
		  "FX_heal", "BFX_circle",
		  "boss_indic",
		  "T_door_open"
		],
      ImgMod : "assets/scripts/imgmod.txt",
    }

console.chload = async function(scriptPath)
{
  Main.unload();
  Album.clearAllCtx();
  await Main.chload(scriptPath, thingsToLoad);
  Main.start();
}

window.onload = async ()=>
{
  Main.init();
  await Main.initload();

  Main.mainloop();

  await Main.chload("./chtitle.js", thingsToLoad);
  //await Main.chload("./ch1.js", thingsToLoad);
  //await Main.chload("./ch1.js", thingsToLoad);
  Main.start();
};
