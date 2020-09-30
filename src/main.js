'use strict';

import {requestFile, respondToEvent} from "./Utils.js";
import {TileMap} from "./TileMap.js";
import {Album, ImageLoader} from "./Images.js";
import {MusicPlayer} from "./MusicPlayer.js";
import {ImageModifier} from "./ImageModifier.js";
import {Inputter} from "./Inputter.js";
import {BattleAnimationAlbum} from "./BattleAnimationAlbum.js";
import {Characters} from "./Characters.js";

import {Game, FPS} from "./Game.js";
import {Unit} from "./Unit.js";
import * as Units from "./TypeUnits.js";
import {Animation} from "./Animation.js";
import {AnimFrame} from "./AnimFrame.js";
import {Interpreter} from "./Interpreter.js";
import {PathFinder} from "./PathFinder.js";
import {Settings} from "./Settings.js";
import {toggleLog} from "./Inputter.js";

let interpreter;
let game;

console.settings = function(s)
{
  let i = {}
  for (let k of Object.keys(Settings.values))
  {
    i[k] = Settings.get(k);
  }
  return i;
}
console.exe = function(s)
{
  interpreter.execute(s);
}

console.execute = console.exe;

console.game = function()
{
  return Main.game;
}

console.inputlog = toggleLog;

function _bindInteractions(script)
{
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
  return level;
}
async function loadMap(mapFile)
{
  let map = new TileMap();
  // load map
  mapFile = await requestFile(mapFile);
  map.generate(mapFile.responseText);
  return map;
}

async function loadImgs(imgList, imgMod)
{
  // load images
  Album.init();
  let i = new ImageLoader();
  await i.loadImgs( imgList );

  let imscript = await requestFile(imgMod);
  imscript = imscript.responseText;

  ImageModifier.init(Album);
  ImageModifier.execute(imscript)
}
async function loadMusic()
{
  await MusicPlayer.loadMusic();
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

class Main
{
  static init()
  {
    Inputter.init();
    // KEYPRESS 
    document.addEventListener( "keydown", (e)=>{Inputter.onKeyDown(e.code)} );
    document.addEventListener( "keyup", (e)=>{Inputter.onKeyUp(e.code)} );

    // MUSIC
    respondToEvent("sfx_play_beep_effect", () => {MusicPlayer.play("beep");});
    respondToEvent("sfx_play_cursormove_effect", () => {MusicPlayer.play("cbeep2");});
    respondToEvent("sfx_play_err_effect", () => {MusicPlayer.play("errbeep");});
    respondToEvent("sfx_play", (name) => {MusicPlayer.play("name");});


    // GAME INPUT
    respondToEvent("input_arrowStall", (e) =>{ Inputter.arrowStall(e.start); });
    respondToEvent("cursor_finishMoveTo", (e) =>{ this.game.handleArrows = this.game.arrow_map; });

    respondToEvent("game_win", (e) =>{ console.log("you won"); } );
    respondToEvent("game_lose", (e) =>{ console.log("you lost"); } );

    respondToEvent("input_select",  async () =>
    {
      if (this.game.inputting)
      {
        this.game.blockInput();
        await this.game.stateAction[this.game.gameStatus].select();
        this.game.unblockInput();
      }
    });
    respondToEvent("input_cancel",  async () =>
    {
      if (this.game.inputting)
      {
        this.game.blockInput();
        await this.game.stateAction[this.game.gameStatus].cancel();
        this.game.unblockInput();
      }
    });
    respondToEvent("input_inform",  async () =>
    {
      if (this.game.inputting)
      {
        let i = this.game.stateAction[this.game.gameStatus].inform;
        if (i !== undefined)
        {
          this.game.blockInput();
          await i();
          this.game.unblockInput();
        }
      }
    });
    
    respondToEvent("cursor_move", (c) =>
    {
      this.game.handlePortrait();
    });

  }
  static async load(things)
  {
    this.assets = {};
    this.scriptFile = things.Script;

    this.level = await loadScript( this.scriptFile )
    this.assets.Map = await loadMap( this.level.tileMap )
    await loadImgs( things.ImgLoad, things.ImgMod );
    await loadFonts();
    await loadMusic();
    
    Settings.init();

    this.game = new Game(this.assets);

    PathFinder.init(this.game);
    //interpreter = new Interpreter(game);
    //interpreter.execute(loaded.script);
  }
  static async reload()
  {
    MusicPlayer.stopAll();
    this.game.mainloop = ()=>{};
    this.level = await loadScript( this.scriptFile )
    this.assets.Map = await loadMap( this.level.tileMap )
    this.game = new Game(this.assets);
  }
  static start()
  {
    Inputter.setGame(this.game);
    this.game.beginGame(this.level)

    this.game.mainloop();
  }
}



async function restartGame()
{

  await Main.reload()
  Main.start();
}
console.restart = restartGame;

let thingsToLoad = {
      Script : "./ch1.js",
      ImgLoad : [ "P_gen", "P_kn", "P_janitor", "P_vmp", "P_Alfred", "P_child",
		  "P_bandit", "P_Billy", "P_Chloe",
		  "T_grass_forest_B", "T_grass_forest_M", "T_grass_forest_T", 
		  "T_grass",
		  "T_wall_B", "T_wall_BR",
		  "T_wall_EL", "T_wall_ER", "T_wall_TL", "T_wall_TR",
		  "T_field", "T_field_tree",
		  "T_house_0", "T_house_1",
		  "T_house_2", "T_house_3",
		  "T_house_4", "T_house_5", "T_door_open",
		  "T_path_v", "T_path_h",
		  "T_path_tl", "T_path_tr", "T_path_bl", "T_path_br",
		  "T_path_stl", "T_path_str", "T_path_sbl", "T_path_sbr",
		  "T_path_3u", "T_path_3r", "T_path_3d", "T_path_3l", "T_path_4",
		  "S_kn0", "S_kn1", "S_lead1", "S_vmp0", "S_farmerAlfred", "S_child",
		  "S_bandit", "S_farmerBilly", "S_farmerChloe",
		  "BS_kn_run", "BS_kn_hit", "BS_kn_idle", "BS_kn_hit2",

		  "BattleSprites/Alfred/Farmer/idle",
		  "BattleSprites/Alfred/Farmer/run",
		  "BattleSprites/Alfred/Farmer/hit",

		  "BattleSprites/Billy/Farmer/idle",
		  "BattleSprites/Billy/Farmer/run",
		  "BattleSprites/Billy/Farmer/hit",

		  "BattleSprites/Chloe/Farmer/idle",
		  "BattleSprites/Chloe/Farmer/run",
		  "BattleSprites/Chloe/Farmer/hit",

		  "BattleSprites/generic/Bandit/idle",
		  "BattleSprites/generic/Bandit/run",
		  "BattleSprites/generic/Bandit/hit",
		  "BattleSprites/generic/Child/idle",

		  "B_backdrop", "BG_unitprofile",
		  "W_spook", "W_stick", "W_sword",
		  "W_Pitchfork", "W_Shovel", "W_FryingPan", "W_LumberAxe",
		  "WT_BronzeSlicer", "WT_VampireFang", "WT_BraveSword",
		  "WT_Pitchfork", "WT_Shovel", "WT_FryingPan", "WT_LumberAxe",
		  "IT_Bandages",
		  "C_c0", "C_ptr", "C_move", "C_walk", "C_atk",
		  "C_menutl", "C_menuel", "C_menucn",
		  "C_talk_indicator",
		  "FX_heal"
		],
      ImgMod : "assets/scripts/imgmod.txt",
    }
window.onload = async ()=>
{
  Main.init();
  await Main.load(thingsToLoad);
  Main.start();
};
