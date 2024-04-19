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
let scrubBanditLeader;

let zone1;
let zone2;
let archerspawn;

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
  yuli.team = "Scout";
  yuli.addWeapon(new Weapons.WoodenBow());
  yuli.setAnim( "idle" );
  yuli.ai = "fleeToUnit"
  yuli.aiparams={target:vargas}
  yuli.addItem(new Bandages());
  yuli.items[0].uses=1;

  mali = new Units.BowKnight({maxhp:16, atk:5,spd:5,skl:6,def:4,con:4,mov: 6}, "Malidale")
  mali.team = "Scout";
  mali.addWeapon(new Weapons.WoodenBow());
  mali.setAnim( "idle" );
  mali.ai = "fleeToUnit"
  mali.aiparams={target:vargas}
  mali.addItem(new Bandages());
  mali.items[0].uses=2;
  mali.stats.hp = 5;

  doddson = new Units.Bandit({maxhp:25, atk:7,spd:4,skl:5,def:4,con:9,mov: 5}, "Doddson");
  doddson.setXY( 29,35)
  doddson.team = "Bandit";
  doddson.pArt = "P_Doddson";
  doddson.addWeapon(new Weapons.LumberAxe());
  doddson.setAnim("idle");
  doddson.isBoss = true;
  doddson.addItem(new Bandages());
  doddson.items[0].uses=1;


  zone1 = {rectangle:[[15, 3],[23,20]], triggered:false}
  zone2 = {rectangle:[[10, 3],[23,18]], triggered:false}
  archerspawn = false;
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
      g.Map.setMaxBound(16, null);
      
      await g.alertTitle()

      let movePromise = []
      g.addUnit(vargas);
      movePromise.push( vargas.moveTo(g, 2, 11) );
      await csPause(150);

      if (billy)
	g.addUnit(billy);
	movePromise.push( billy.moveTo(g, 1, 10) );
	await csPause(150);

      if (chloe)
	g.addUnit(chloe);
	movePromise.push( chloe.moveTo(g, 1, 12) );
	await csPause(150);

      g.addUnit(alfred);

      movePromise.push( alfred.moveTo(g, 1, 11) );

      await Promise.all(movePromise);

      await g.cursorFlash(vargas);
      let conv = new Conversation(g);
      conv.addSpeaker("Vargas", vargas.pArt, 424, true);
      if (billy)
	conv.addSpeaker("Billy", billy.pArt, 280, false);
      conv.addSpeaker("Alfred", alfred.pArt, 180, false);
      if (chloe)
	conv.addSpeaker("Chloe", chloe.pArt, 88, false);
      conv.speaker("Vargas");
      conv.say("So...");
      conv.say("I would like to go hunt down all of the bandits\nin this area, so that they no longer\nthreaten this village.");
      conv.say("Anyone want to join me?\nI'm fully capable of doing this myself,\nbut it could be a fun opportunity\nfor you all to tag along.");
      conv.clear();
      conv.pause(250);
      conv.turn("Alfred");
      conv.pause(250);
      if (billy)
	conv.turn("Billy");
	conv.pause(250);
      conv.turn("Alfred");
      conv.pause(250);
      if (billy)
	conv.turn("Billy");
	conv.pause(500);
      conv.turn("Vargas");
      conv.say("Wait...")
      await g.setExtStatus(conv);
      

      let bstats = [{maxhp:10, atk:2,spd:3,skl:2,def:3,con:9,mov:4}, // initial
		    {maxhp:16, atk:4,spd:3,skl:3,def:4,con:9,mov:5}] // camp

      let addbandit=(x,y,stat,ai="targetWeakest", aiparams={}) => 
      {
	let u = new Units.Bandit(bstats[stat]);
	u.setXY( x,y)
	u.team = "Bandit";u.addWeapon(new Weapons.LumberAxe());u.setAnim("idle");u.ai = ai;u.aiparams=aiparams;
	g.addUnit(u);
	return u;
      }

      // triggering one bandit alters the zone1 object, causing all bandits of zone1 to attack
      // can also use this to check for dialogue when entering a zone
      scrubBanditLeader = addbandit(18,12, 1, "attackOnEnter", zone1)
      addbandit(18,10, 1, "attackOnEnter", zone1)
      addbandit(17,11, 1, "attackOnEnter", zone1)
      addbandit(16,10, 1, "attackOnEnter", zone1)
      addbandit(20,11, 1, "attackOnEnter", zone1)
      addbandit(19,12, 1, "attackOnEnter", zone1)
      addbandit(19,10, 1, "attackOnEnter", zone1)


      // walk from east
      let b1 = addbandit(17,13,0);
      let b2 = addbandit(18,13,0);
      let b3 = addbandit(19,13,0);
      addbandit(4,17,0);
      addbandit(3,23,0);
      addbandit(1,27,0);
      addbandit(3,31,0);
      addbandit(7,33,0);

      // test archers
      //addbandit(30,34);
      

      await g.cameraShift(0,30);
      await csPause(500);
      await g.cameraShift(0,9);

      movePromise = []
      movePromise.push( b1.moveTo(g, 8, 16) )
      await csPause(150);
      movePromise.push( b2.moveTo(g, 9, 15) )
      await csPause(150);
      movePromise.push( b3.moveTo(g, 12, 14) )
      await Promise.all(movePromise);

      conv = new Conversation(g);
      conv.addSpeaker("Vargas", vargas.pArt, 424, false);
      if (billy)
	conv.addSpeaker("Billy", billy.pArt, 280, false);
      conv.addSpeaker("Alfred", alfred.pArt, 180, false);
      if (chloe)
	conv.addSpeaker("Chloe", chloe.pArt, 80, false);
      conv.speaker("Vargas");
      conv.pause(500);
      conv.turn("Vargas");
      conv.say("It looks like they're coming to us,\ninstead of us to them!");
      conv.say("Now you all kind of have to fight though.");
      conv.say("If it gets too rough, head for the forest.\nYou should find better cover there.");
      conv.turn("Vargas");
      conv.say("...");
      conv.turn("Vargas");
      conv.say("Also, I have some bandages.\nIf you want some, just come and ask me.");
      conv.say("Of course, if I see you in danger,\nI can come to you as well.");
      conv.turn("Vargas");
      conv.say("We go!")
      await g.setExtStatus(conv);
      
      g.cursor.moveInstant(vargas);

     
    }, //onBegin
    interactions: {
	
    }, //interactions
    objects: {
    }, //objects
    conversations: {
      "Vargas": {
	"Yuliza": async (g) =>  //TODO add conditions for which team they are on
	{
	  let conv = new Conversation(g);
	  conv.addSpeaker("Vargas", vargas.pArt, 382, true);
	  conv.addSpeaker("Yuliza", yuli.pArt, 130, false);
	  conv.music("recruit", false, false);
	  conv.speaker("Vargas");
	  conv.say("Our village was attacked by bandits,\nso I'm hunting them down.")
	  conv.say("Your bow could come in handy. Can you help me?")
	  conv.speaker("Yuliza");
	  conv.say("Village, you say?")
	  conv.say("I can help, but this is gonna cost you.")


	  await MusicPlayer.fadeout(g.mapTheme);
	  await g.setExtStatus(conv);

	  yuli.recruited = true;
	  await g.recruitJingle(yuli);
	  g.Units.switchTeam(yuli, "Player");
	  await MusicPlayer.fadein(g.mapTheme);
	},
	"Malidale": async (g) => 
	{
	  let conv = new Conversation(g);
	  conv.addSpeaker("Vargas", vargas.pArt, 382, true);
	  conv.addSpeaker("Malidale", mali.pArt, 130, false);
	  conv.music("recruit", false, false);
	  conv.speaker("Vargas");
	  conv.say("Our village was attacked.\nI'm hunting the bandits who are responsible.")
	  conv.speaker("Malidale");
	  conv.say("Your village? Attacked?")
	  conv.speaker("Vargas");
	  conv.say("Yeah. If it's not too much, could you help me?")
	  conv.speaker("Malidale");
	  conv.say("I mean, sure...\nBut I want to rest in the village afterwards.")
	  await MusicPlayer.fadeout(g.mapTheme);
	  await g.setExtStatus(conv);

	  mali.recruited = true;
	  await g.recruitJingle(mali);
	  g.Units.switchTeam(mali, "Player");
	  await MusicPlayer.fadein(g.mapTheme);
	}
      },
      "Yuliza": {
	"Vargas": async (g) => 
	{
	  let conv = new Conversation(g);
	  conv.addSpeaker("Yuliza", yuli.pArt, 382, true);
	  conv.addSpeaker("Vargas", vargas.pArt, 130, false);
	  conv.music("recruit", false, false);
	  conv.speaker("Yuliza");
	  conv.say("Where's the nearest village?")
	  conv.speaker("Vargas");
	  conv.say("East of here. Why?")
	  conv.speaker("Yuliza");
	  conv.say("I need to get the to evade some bandits.")
	  conv.speaker("Vargas");
	  conv.say("That village is under attack from bandits.\nI'm here to strike back.")
	  conv.say("Why don't you help me?")
	  conv.speaker("Yuliza");
	  conv.say("Alright.")

	  await MusicPlayer.fadeout(g.mapTheme);
	  await g.setExtStatus(conv);

	  yuli.recruited = true;
	  await g.recruitJingle(yuli);
	  g.Units.switchTeam(yuli, "Player");
	  await MusicPlayer.fadein(g.mapTheme);
	}
      },
      "Malidale": {
	"Vargas": async (g) => 
	{
	  let conv = new Conversation(g);
	  conv.addSpeaker("Malidale", mali.pArt, 382, true);
	  conv.addSpeaker("Vargas", vargas.pArt, 130, false);
	  conv.music("recruit", false, false);
	  conv.speaker("Malidale");
	  conv.say("Hey, I'm trying to get to a village near here.\nCould you point me to it?")
	  conv.speaker("Vargas");
	  conv.say("As a matter of fact, I'm hunting down bandits\nto protect that village.")
	  conv.say("If possible, could you help me?\nI can show you afterwards.")
	  conv.speaker("Malidale");
	  conv.say("I mean, I guess.")

	  await MusicPlayer.fadeout(g.mapTheme);
	  await g.setExtStatus(conv);

	  mali.recruited = true;
	  await g.recruitJingle(mali);
	  g.Units.switchTeam(mali, "Player");
	  await MusicPlayer.fadein(g.mapTheme);
	}
      },
    }, //conversations

    events: {
      onDeath: {
        "Alfred": (g)=>{g.onGameOver()},
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
	      g.camera.clearTarget()
	      await g.cameraCenter(vargas)
	      await g.cursorFlash(vargas)

	      //Settings.set("cut_skip", "Off");
	      let conv = new Conversation(g);
	      conv.addSpeaker("Vargas", vargas.pArt, 332, true);
	      conv.addSpeaker("Alfred", alfred.pArt, 180, false);
	      conv.speaker("Vargas")
	      conv.say("Alfred, I think there's a small bandit camp\nto the northeast.")
	      await g.setExtStatus(conv);

	      g.Map.setMaxBound(null, null);
	      g.camera.clearTarget()
	      await g.cameraCenter(18, 11)
	      await csPause(1500)
	      g.camera.clearTarget()
	      await g.cameraCenter(vargas)

	      conv = new Conversation(g);
	      conv.addSpeaker("Vargas", vargas.pArt, 332, true);
	      conv.addSpeaker("Alfred", alfred.pArt, 180, false);
	      conv.speaker("Alfred")
	      conv.say("Oh?");
	      conv.say("That means the ones we are fighting now must be\nanother group, since they came from the south.");
	      conv.speaker("Vargas")
	      conv.say("Yes, exactly. But this matters not.\nAfter all, we should clear out both groups.")
	      conv.speaker("Alfred")
	      conv.say("Alright buddy, let's calm down.");
	      conv.say("But yes, we'll have to do that eventually.")
	      await g.setExtStatus(conv);
	    }
	  },
	],
	"Scout":
	[
	  { type: "absolute",
	    tag: "scout spawn",
	    // spawn on turn 3 or if someone goes too far right
	    condition: (g,e)=>{return g.turn == 6 || unitInZone(g, zone2.rectangle, "Bandit");},
	    action: async (g)=>
	    {

	      g.camera.clearTarget()
	      await g.cameraShift(29,34)

	      yuli.setXY(29, 35)
	      mali.setXY(29, 35)

	      g.addUnit(yuli);
	      let a = yuli.moveTo(g, 26, 33)
	      await csPause(150);
	      g.addUnit(mali);
	      let b = mali.moveTo(g, 27, 33)
	      await(a)
	      await(b)

	      await g.cursorFlash(yuli)

	      let conv = new Conversation(g);
	      conv.addSpeaker("Yuliza", yuli.pArt, 180, true);
	      conv.addSpeaker("Malidale", mali.pArt, 348, true);
	      conv.speaker("Yuliza");
	      conv.say("Bruh...")
	      conv.say("How do we get outta here?")
	      conv.say("Those bandits are probably close on our trail.")
	      conv.speaker("Malidale");
	      conv.say("I think there was a village to the northwest.")
	      conv.say("We could lay low for a while there.")
	      conv.speaker("Yuliza");
	      conv.say("Okay, let's move that way then.")
	      conv.speaker("Malidale");
	      conv.enter("Malidale")
	      conv.say("Ack")
	      conv.turn("Yuliza");
	      conv.speaker("Yuliza");
	      conv.say("Are you hurt?")
	      conv.speaker("Malidale");
	      conv.say("Yeah, they slashed me pretty hard when we ran.")
	      conv.speaker("Yuliza");
	      conv.say("Do you have bandages?\nWe have time, you should use some.")
	      conv.speaker("Malidale");
	      conv.say("Uh... heh, I think I lost mine somewhere.\nLet's just go to the village, we need to hurry.")
	      conv.speaker("Yuliza");
	      conv.say("Are you serious right now bruh...")
	      conv.say("How do you lose bandages? Take mine and rest up.")
	      conv.turn("Yuliza");
	      conv.say("After you do that, follow me.")
	      conv.speaker("Malidale");
	      conv.say("Oh...")
	      conv.leave("Yuliza");
	      conv.say("Thanks bruv!")
	      await g.setExtStatus(conv);

	      archerspawn = true;
	      //await csPause(250)
	      //await mali.items[0].use(g, mali);

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
	      zone1.triggered = true
	      g.camera.clearTarget();
	      await g.cameraCenter(scrubBanditLeader);
	      await g.cursorFlash(scrubBanditLeader);


	      let conv = new Conversation(g);
	      conv.addSpeaker("Bandit", scrubBanditLeader.pArt, 256, true);
	      conv.addSpeaker("Bandit1", scrubBanditLeader.pArt, 150, false);
	      conv.addSpeaker("Bandit2", scrubBanditLeader.pArt, 50, false);
	      conv.addSpeaker("Bandit3", scrubBanditLeader.pArt, 350, true);
	      conv.addSpeaker("Bandit4", scrubBanditLeader.pArt, 460, true);
	      conv.speaker("Bandit");
	      conv.say("Yo there's some people over on that road!");
	      conv.turn("Bandit");
	      conv.say("Quick boys lets go steal all their food!");
	      await g.setExtStatus(conv);
	    }
	  },
	  { type: "absolute",
	    tag: "bandit chase",
	    activate: (g)=>{return archerspawn == true;},
	    condition: (g,e)=>{return g.turn == e.turn+1},
	    action: async (g)=>
	    {

	      g.camera.clearTarget();
	      await g.cameraCenter(doddson);
	      
	      // remove smallest x and largest y
	      let dests_atk = [ [27,34],[28,33]]
	      let dests_guard = [[27,35],[28,34],[28,35],[29,33],[29,34]];
	      let dests = [dests_atk, dests_guard]
	      let ais = ["targetWeakest","targetWeakest"];

	      for (let i = 0; i < dests_atk.length + dests_guard.length; ++i)
	      {
		let bad = 0;
		if (i < 2)
		  bad = 1;
		let u = new Units.Bandit({maxhp:17-bad, atk:5-bad,spd:3,skl:5,def:5,con:9,mov: 5});
		u.setXY(29,35);
		u.team = "Bandit";
		u.addWeapon(new Weapons.LumberAxe());
		u.setAnim("idle");
		banditWave.push(u);
	      }

	      let movePromise = [];
	      let j = 0
	      for (let x = 0; x < ais.length; ++x)
	      {
		let d = dests[x]
		for (let i = 0; i < d.length; ++i)
		{
		  let b = banditWave[j];
		  b.ai = ais[x];

		  g.addUnit(b);

		  let move = b.moveTo(g, ...d[i])
		  movePromise.push(move);
		  await csPause(150);
		  j += 1
		}
	      }
	      g.addUnit(doddson);
	      doddson.ai = "targetWeakest";
	      await Promise.all(movePromise);

	      await g.cursorFlash(doddson);
	      //Settings.set("cut_skip", "Off");

	      let conv = new Conversation(g);
	      conv.addSpeaker("Doddson", doddson.pArt, 440, true);
	      conv.addSpeaker("Bandit1", scrubBanditLeader.pArt, 300, false);
	      conv.addSpeaker("Bandit2", scrubBanditLeader.pArt, 200, false);
	      conv.addSpeaker("Bandit3", scrubBanditLeader.pArt, 100, false);

	      conv.speaker("Doddson")
	      conv.say("I donno how you gits let this happen!")
	      conv.say("All ye had ta do was guard two people!")
	      conv.move("Bandit1", -10)
	      conv.move("Bandit2", -10)
	      conv.move("Bandit3", -10)
	      conv.say("Two!")
	      conv.move("Bandit1", -10)
	      conv.move("Bandit2", -10)
	      conv.move("Bandit3", -10)
	      conv.say("People!")
	      conv.move("Bandit1", -10)
	      conv.move("Bandit2", -10)
	      conv.move("Bandit3", -10)
	      conv.say("There's seven of ya!")
	      conv.speaker("Bandit3")
	      conv.say("We'll -- we'll go catch them and bring them back!")
	      conv.move("Bandit1", -10)
	      conv.move("Bandit2", -10)
	      conv.move("Bandit3", -10)
	      conv.speaker("Doddson")
	      conv.say("Wotterya saying?!")
	      conv.move("Bandit1", -10)
	      conv.move("Bandit2", -10)
	      conv.move("Bandit3", -10)
	      conv.say("We chase 'em down, kill 'em, and take their valuables!\nI can't trust any of ye to guard 'em, anyways!");
	      conv.speaker("Bandit1")
	      conv.say("Y- y- y- yes!");
	      conv.clear();
	      conv.turn("Bandit3")
	      conv.turn("Bandit2")
	      conv.turn("Bandit1")
	      conv.move("Bandit3", -350)
	      conv.move("Bandit2", -350)
	      conv.move("Bandit1", -350)
	      conv.pause(250)
	      await g.setExtStatus(conv);
	    }

	  }
	],
      } //turnBegin
    } //events
  } //script


