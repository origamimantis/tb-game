import {Inputter} from "./Inputter.js"
import {Conversation} from "./Conversation.js"
import {spawnSpriteEffect} from "./Effects.js";
import * as Units from "./TypeUnits.js";
import * as Weapons from "./Weapon.js";
import {Coord} from "./Path.js";
import {waitTime, csPause, inRange} from "./Utils.js";
import {MusicPlayer} from "./MusicPlayer.js";
import {Settings} from "./Settings.js";
import {Range} from "./Range.js";
import {unitInZone} from "./Utils.js"
import {Bandages} from "./Item.js"

import {Storage} from "./Storage.js";

let units = []
export function setUnits(u)
{
  units = u;
}

let alfred;
let billy;
let chloe;
let vargas;
let yuli;
let mali;
let banditWave = [];
let doddson;
let zone1;
let scrubBanditLeader;

const DEFEND = 0;
const FETCH = 1;
const RETURN = 2;

let uid = 0


function initVars()
{
  alfred = units.Alfred
  billy = units.Billy
  chloe = units.Chloe
  vargas = units.Vargas

  vargas.setXY(0,11)
  vargas.addItem(new Bandages());
  vargas.addItem(new Bandages());
  vargas.items[0].uses=1;
  vargas.items[1].uses=3;

  alfred.setXY(0, 11);

  if (billy)
    billy.setXY(0, 11);

  if (chloe)
    chloe.setXY(0, 11);

  // TODO delay the camp/scout discovery by a couple turns, then spawn both archers
  //      and doddson crew at the same time. move archers deeper into woods to start.
  //      (vargas clearing the camp early makes it too easy)
  yuli = new Units.BowKnight({maxhp:14, atk:9,spd:3,skl:10,def:3,con:4,mov: 6}, "Yuliza")
  yuli.setXY(33, 35)
  yuli.team = "Scout";
  yuli.addWeapon(new Weapons.WoodenBow());
  yuli.setAnim( "idle" );
  yuli.ai = "fleeToUnit"
  yuli.aiparams={target:vargas}
  yuli.addItem(new Bandages());
  yuli.items[0].uses=1;

  mali = new Units.BowKnight({maxhp:16, atk:5,spd:5,skl:6,def:4,con:4,mov: 6}, "Malidale")
  mali.setXY(33, 35)
  mali.team = "Scout";
  mali.addWeapon(new Weapons.WoodenBow());
  mali.setAnim( "idle" );
  mali.ai = "fleeToUnit"
  mali.aiparams={target:vargas}
  mali.addItem(new Bandages());
  mali.items[0].uses=2;
  mali.stats.hp = 5;

  doddson = new Units.Bandit({maxhp:25, atk:7,spd:4,skl:5,def:4,con:9,mov: 5}, "Doddson");
  doddson.setXY( 33,35)
  doddson.team = "Bandit";
  doddson.pArt = "P_Doddson";
  doddson.addWeapon(new Weapons.LumberAxe());
  doddson.setAnim("idle");
  doddson.isBoss = true;
  doddson.addItem(new Bandages());
  doddson.items[0].uses=1;


  zone1 = {rectangle:[[16, 3],[23,24]], triggered:false}
}




export let script =
  {
    chNumber: "2",
    chTitle: "Archers",
    tileMap: "assets/tilemaps/ch2.txt",
    nextLvl: "./ch3.js",
    type: "Game",
    cameraInit: {x: 0, y:5},
    teams:  [ {name: "Player", bannercolor: "#aaaaff", maptheme: "ch2 map",  btltheme: "player battle"},
	      {name: "Scout", bannercolor: "#12aa12", maptheme: "archers",  btltheme: "player battle"},
	      {name: "Bandit", bannercolor: "#bd4900", maptheme: "ch2 enemy",  btltheme: "enemy battle"}
	    ],
    alliances: {"Player": ["Scout"], "Scout":["Player"]},
    dayLength: 0,   // 0: always days, <0: always night

    onBegin: async (g) =>
    {
      initVars();
      
      await g.alertTitle()

    }, //onBegin
    interactions: {
	
    }, //interactions
    objects: {
    }, //objects
    conversations: {
      "Vargas": {
	"Yuliza": async (g) =>
	{
	},
	"Malidale": async (g) => 
	{
	}
      },
      "Yuliza": {
	"Vargas": async (g) => 
	{
	}
      },
      "Malidale": {
	"Vargas": async (g) => 
	{
	}
      },
    }, //conversations

    events: {
      onDeath: {
        "Vargas": (g)=>{g.onGameOver()},
      },
      afterBattle: [
	{ tag: "victory",
          condition: (g)=>
          { return g.Units.getTeam("Bandit").size == 0;},
          repeating: false,
          restartTurns: false,
          action: async (g) =>
          {
            g.onVictory();
          }
        }

      ],
      turnBegin:
      {
	"Player":
	[
	  { type: "absolute",
	    tag: "find camp",
	    condition: (g,e)=>{return g.turn == 2},
	    action: async (g)=>
	    {
	    }
	  },
	],
	"Scout":
	[
	  { type: "absolute",
	    tag: "scout spawn",
	    condition: (g,e)=>{return g.turn == 2},
	    action: async (g)=>
	    {
	    }
	  }
	],
	"Bandit":
	[
	  { type: "everyturn",
	    tag: "enter zone1",
	    condition: (g)=>{return unitInZone(g, zone1.rectangle, "Bandit");},
	    action: async (g)=>
	    {
	    }
	  },
	  { type: "absolute",
	    tag: "bandit chase",
	    condition: (g,e)=>{return g.turn == 4},
	    action: async (g)=>
	    {
	    }
	  }
	],
      } //turnBegin
    } //events
  } //script


