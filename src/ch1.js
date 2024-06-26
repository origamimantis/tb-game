import {Inputter} from "./Inputter.js"
import {Conversation} from "./Conversation.js"
import {spawnSpriteEffect} from "./Effects.js";
import * as Units from "./TypeUnits.js";
import * as Weapons from "./Weapon.js";
import {Coord} from "./Path.js";
import {waitTime, csPause} from "./Utils.js";
import {MusicPlayer} from "./MusicPlayer.js";
import {Settings} from "./Settings.js";

import {Storage} from "./Storage.js";

let units;
export function setUnits(u)
{
  units = u;
}

let alfred;
let child;
let b1;
let b2;
let billy;
let chloe;
let vargas;
let state;
let banditWave;
let choddson;
const DEFEND = 0;
const FETCH = 1;
const RETURN = 2;

function initVars()
{
  state = DEFEND;

//	let u = new Units.Bandit({maxhp:15, atk:4,spd:2,skl:2,def:4,con:9,mov: 5});
  alfred = new Units.Farmer({maxhp:12, atk:3,spd:2,skl:2,def:2,con:4,mov: 6}, "Alfred");
  alfred.team = "Player";
  alfred.addWeapon(new Weapons.Pitchfork());
  alfred.setAnim( "idle" );
  alfred.setXY(3,9)

  child = new Units.Child({maxhp:5, atk:0,spd:5,skl:3,def:0,con:0,mov: 5}, "Timmy");
  child.team = "Player";
  child.setAnim( "idle" );
  child.setXY(17,12)

  billy = new Units.Farmer({maxhp:15, atk:4,spd:1,skl:2,def:3,con:4,mov: 6}, "Billy");
  billy.setXY(8, 3);
  billy.team = "Player";
  billy.addWeapon(new Weapons.Shovel());
  billy.setAnim( "idle" );
  billy.recruited = false;

  chloe = new Units.Farmer({maxhp:13, atk:3,spd:3,skl:4,def:1,con:4,mov: 6}, "Chloe");
  chloe.setXY(4, 6);
  chloe.team = "Player";
  chloe.addWeapon(new Weapons.FryingPan());
  chloe.setAnim( "idle" );
  chloe.recruited = false;

  vargas = new Units.SwordKnight({maxhp:18, atk:3,spd:3,skl:7,def:3,con:12,mov: 6}, "Vargas");
  vargas.setXY(1,25);
  vargas.team = "Player";
  vargas.addWeapon(new Weapons.BronzeSlicer());
  vargas.setAnim("idle");
  vargas.recruited = false;

  
  b1 = new Units.Bandit({maxhp:16, atk:3,spd:1,skl:4,def:3,con:4,mov: 6});
  b1.setXY(18, 12);
  b1.team = "Bandit";
  b1.setAnim( "idle" );
  b1.addWeapon(new Weapons.LumberAxe());
  b1.ai = "targetWeakest";
	
  b2 = new Units.Bandit({maxhp:17, atk:3,spd:2,skl:5,def:2,con:4,mov: 6});
  b2.setXY(17, 13);
  b2.team = "Bandit";
  b2.setAnim( "idle" );
  b2.addWeapon(new Weapons.LumberAxe());
  b2.ai = "targetWeakest";

  choddson = new Units.Bandit({maxhp:20, atk:5,spd:2,skl:6,def:2,con:19,mov: 5}, "Choddson");
  choddson.setXY(21,11);
  choddson.team = "Bandit";
  choddson.pArt = "P_Choddson";
  choddson.addWeapon(new Weapons.LumberAxe());
  choddson.setAnim("idle");
  choddson.ai = "targetWeakest";
  choddson.isBoss = true;

  banditWave = [];
}



export let script =
  {
    chNumber: "1",
    chTitle: "Invasion",
    tileMap: "assets/tilemaps/ch1.txt",
    nextLvl: "./ch2.js",
    type: "Game",
    cameraInit: {x: 0, y:4},
    teams:  [ {name: "Player", bannercolor: "#aaaaff", maptheme: "ch1 map",  btltheme: "player battle"},
	      {name: "Village", bannercolor: "#12aa12", maptheme: "village",  btltheme: "player battle"},
	      {name: "Bandit", bannercolor: "#bd4900", maptheme: "ch1 enemy",  btltheme: "enemy battle"}
	    ],
    alliances: {"Player": ["Village"], "Village":["Player"]},
    dayLength: 0,   // 0: always days, <0: always night

    onBegin: async (g) =>
    {
      initVars();
      g.Map.setMaxBound(null, 17);
      g.addUnit(alfred);
      
      g.addUnit(child);

      g.addUnit(b1);
      g.addUnit(b2);
	
      await g.alertTitle()
      await g.cursorFlash(alfred);
      
      let conv = new Conversation(g);
      conv.addSpeaker("Alfred", alfred.pArt, 100, true);
      conv.addSpeaker("???", null, 480, false);
      conv.speaker("Alfred");
      conv.say("What a nice day...");
      conv.say("...");
      conv.say("......");
      conv.say(".........");
      conv.speaker("???");
      conv.say("HELP!!!!!!!");
      conv.music(script.teams[2].maptheme, false, false);
      conv.setMusicContinue(true);
      conv.speaker("Alfred");
      conv.turn("Alfred");
      conv.say("?!!!");
      conv.say("What in tarnation was that?")
      await g.setExtStatus(conv);
      
      await g.cameraShift(5, 4);
      await g.cursorFlash(child);

      conv = new Conversation(g);
      conv.addSpeaker("Bandit", b1.pArt, 100, false);
      conv.addSpeaker("Child", child.pArt, 256, false);
      conv.addSpeaker("Bandit2", b2.pArt, 412, true);
      conv.speaker("Child");
      conv.say("HELP!!! What do you want from me?!");
      conv.turn("Child");
      conv.say("Why are you doing this?");
      conv.speaker("Bandit2");
      conv.turn("Child");
      conv.say("Hahaha! We're bandits!");
      conv.turn("Child");
      conv.speaker("Bandit");
      conv.say("We're here to take all de gold an' food\nyer village has to offer!");
      conv.turn("Child");
      conv.speaker("Bandit2");
      conv.say("Hehehehehe!")
      conv.speaker("Child");
      conv.say("*gasp*")
      conv.clear();
      conv.leave("Child");
      conv.turn("Bandit");
      conv.pause(250);
      conv.turn("Bandit");
      conv.speaker("Bandit");
      conv.pause(250);
      conv.say("Hm? Where'd the kid go?");
      conv.speaker("Bandit2");
      conv.say("Maybe he went to get our food ready!");
      conv.say("Haw haw haw!");

      await g.setExtStatus(conv);

      await child.moveTo(g, 12, 7);
      g.cameraShift(0, 4);
      await child.moveTo(g, 6, 7);
      await csPause(250);
      await child.moveTo(g, 7, 7);
      await csPause(250);
      await child.moveTo(g, 6, 7);
      await csPause(250);
      await child.moveTo(g, 5, 10);
      await csPause(250);
      await child.moveTo(g, 6, 10);
      await csPause(250);
      await child.moveTo(g, 5, 10);
      await csPause(250);
      await child.moveTo(g, 3, 10);
      
      await g.cursorFlash(child);
      
      conv = new Conversation(g);
      conv.addSpeaker("Alfred", alfred.pArt, 100, false);
      conv.addSpeaker("Child", child.pArt, 412, true);
      
      conv.speaker("Child");
      conv.say("Mister, there are bandits outside!")
      conv.speaker("Alfred");
      conv.say("What? bandits?!");
      conv.speaker("Child");
      conv.say("They want all the gold and food\nthat our village can offer!")
      conv.speaker("Alfred");
      conv.say("This is an emergency!\nChild, what is your name?");
      conv.speaker("Child");
      conv.say("My name is Timmy.");
      conv.speaker("Alfred");
      conv.say("Timmy, I need you to help me gather some people\nto defend the village.");
      conv.say("Follow me!");

      await g.setExtStatus(conv);

      await alfred.moveTo(g, 4, 10);
      alfred.moveTo(g, 5, 9);
      await child.moveTo(g, 5, 10);
      g.cameraShift(0, 0);
      alfred.moveTo(g, 5, 7);
      await child.moveTo(g, 5, 8);
      
      await g.cursorFlash(alfred);
      
      conv = new Conversation(g);
      conv.addSpeaker("Alfred", alfred.pArt, 100, false);
      conv.addSpeaker("Child", child.pArt, 412, true);
      conv.speaker("Alfred");
      conv.say("Aha! Two houses have their doors open.\nTimmy, let's split up and visit both of them.");
      conv.say("Surely the people living here will be\nhelp us defend our village.");
      conv.speaker("Child");
      conv.say("I'm on it!");
      await g.setExtStatus(conv);

      b1.moveTo(g, 14, 7);
      await csPause(125);
      await b2.moveTo(g, 13, 8);

      await MusicPlayer.fadestop(script.teams[2].maptheme)

    }, //onBegin
    conversations: {},
    interactions: {
      "3,6" :  // HOUSE 1 (chloe)
      {
	tooltip: "Visit",
	visited: false,
	canInteract: function() {return state == DEFEND && this.visited == false},
	mapSprite: "T_door_open",
	drawSprite: function() {return this.canInteract()},
	action: async function(g, u, ondone)
	{
	  let conv = new Conversation(g);
	  conv.addSpeaker(u.name, u.pArt, 100, false);
	  conv.addSpeaker("Chloe", chloe.pArt, 412, true);
	  conv.music("village", false, false);
	  conv.speaker("Chloe");
	  conv.say("Spinach salad! Bandits? Hold on just one second.");
	  conv.clear();
	  conv.leave("Chloe");
	  conv.music(null, true);
	  conv.pause(250);
	  conv.enter("Chloe");
	  conv.music("recruit", false, false);
	  conv.say("I got my trusty frying pan.");
	  conv.say("They don't know what's comin' for 'em!");

	  await MusicPlayer.fadeout(g.mapTheme);
	  await g.setExtStatus(conv);
	      
	  MusicPlayer.fadein(g.mapTheme);
	  this.visited = true;
	  chloe.recruited = true;
	  await g.addUnit(chloe, u);
	  await g.recruitJingle(chloe);

	  ondone();
	  await g.setStatus("map");
	}
      }, //3,6 house chloe

      "7,3" :  // HOUSE 2 (billy)
      {
	tooltip: "Visit",
	visited: false,
	canInteract: function() {return state == DEFEND && this.visited == false},
	mapSprite: "T_door_open",
	drawSprite: function() {return this.canInteract()},
	action: async function(g, u, ondone)
	{
	  let conv = new Conversation(g);
	  conv.addSpeaker(u.name, u.pArt, 100, false);
	  conv.addSpeaker("Billy", billy.pArt, 412, true);
	  conv.music("village", false, false);
	  conv.speaker("Billy");
	  conv.say("Holy turnips! Bandits, ya say?\nOf course we gotta drive 'em out.");
	  conv.say("Lemme get my shovel real quick.");
	  conv.clear();
	  conv.leave("Billy");
	  conv.music(null, true);
	  conv.pause(250);
	  conv.enter("Billy");
	  conv.music("recruit", false, false);
	  conv.say("Let's go beat them bandits!");

	  await MusicPlayer.fadeout(g.mapTheme);
	  await g.setExtStatus(conv);
	    
	  MusicPlayer.fadein(g.mapTheme);
	  this.visited = true;
	  billy.recruited = true;
	  await g.addUnit(billy, u);
	  await g.recruitJingle(billy);
	  
	  ondone();
	  await g.setStatus("map");
	}
      }, //7,3 village billy
      "2,25" :  // HOUSE 3 (vargas)
      {
	tooltip: "Visit",
	visited: false,
	canInteract: function() {return state == FETCH && this.visited == false},
	mapSprite: "T_door_open",
	drawSprite: function() {return this.canInteract()},
	action: async function(g, u, ondone)
	{
	  let conv = new Conversation(g);
	  conv.addSpeaker(u.name, u.pArt, 382, true);
	  conv.addSpeaker("???", null, 24, false);
	  conv.addSpeaker("Vargas", vargas.pArt, 130, false, false);
	  conv.music("village", false, false);
	  conv.speaker("Alfred");
	  conv.say("Ummm...");
	  conv.say("*knock* *knock* *knock*");
	  conv.say("Hellooo!")
	  conv.speaker("???");
	  // TODO better change this lol
	  conv.say("No thank you! We don’t want any more visitors,\nwell-wishers or distant relations!");
	  conv.speaker("Alfred");
	  conv.say("(Heh. I know how this one goes.)");
	  conv.say("And what about very old friends?");
	  conv.pause(500);
	  conv.music(null, true);
	  conv.enter("Vargas");
	  conv.speaker("Vargas");
	  conv.music("feels", false, false);
	  conv.say("Alfred?");
	  conv.say("What brings you to these parts?");
	  conv.speaker("Alfred");
	  conv.say("It's been awhile, eh, Vargas?\nHow've you been holding up?")
	  conv.speaker("Vargas");
	  conv.say("Hah! Pretty good, if I do say so myself!");
	  conv.speaker("Alfred");
	  conv.say("Listen, Vargas.\nThe village was just attacked by bandits.");
	  conv.say("I'm here to ask you to come with me\nand defend it.");
	  conv.speaker("Vargas");
	  conv.music(null, true);
	  conv.say("...");
	  conv.music("recruit", false, false);
	  conv.say("Well of course!\nIt should be a piece of cake for a knight like me!");
	  conv.say("We leave immediately!")
	  conv.say("Actually, hold on. Let me get my sword.")
	  conv.clear();
	  conv.leave("Vargas");
	  conv.pause(250);
	  conv.enter("Vargas");
	  conv.say("I'm ready! We should head to the village\nas quickly as possible!");

	  await MusicPlayer.fadeout(g.mapTheme);
	  await g.setExtStatus(conv);
	    
	  MusicPlayer.fadein(g.mapTheme);
	  this.visited = true;
	  vargas.recruited = true;
	  await g.addUnit(vargas, u);
	  await g.recruitJingle(vargas);

	  state = RETURN;
	  
	  ondone();
	  await g.setStatus("map");
	}
      }, //7,3 village billy
	
    }, //interactions
    objects: {
    }, //objects
    events: {
      onDeath: {
        "Alfred": (g)=>{g.onGameOver()},
        "Timmy": (g)=>{g.onGameOver()},
        "Vargas": (g)=>{g.onGameOver()},
      },
      afterBattle: [
	{ tag: "one bandit defeated",
	  repeating: false,
	  restartTurns: false,
	  condition: (g)=>{return (b1.dead && !b2.dead || !b1.dead && b2.dead)},
	  action: (g)=>{}
	},
	{ tag: "initial bandits defeated",
	  condition: (g)=>{return b1.dead && b2.dead},
	  repeating: false,
	  restartTurns: true,
	  action: async (g) =>
	  {
	    g.blockInput();
	    g.gameStatus = "blockInput";
	    g.camera.clearTarget();
	    g.Map.getPathingMap(g.Units.getTeams(g.getHostile("Player")));

	    g.clearCtx(4);
	    g.toDraw.hide("cursor");
	    await MusicPlayer.fadestop(g.mapTheme);
	    await csPause(1000);
	    await g.fadeOut();
	    for (let u of g.Units){ u.turnInit();}

	    let conv = new Conversation(g);

	    alfred.teleport(g, 5, 7)
	    conv.addSpeaker("Alfred", alfred.pArt, 200, false)

	    child.teleport(g, 4, 7)
	    conv.addSpeaker("Timmy", child.pArt, 312, true)
	    
	    let billyHere = ( billy.isAlive() && billy.recruited );
	    let chloeHere = ( chloe.isAlive() && chloe.recruited );
	    if ( billyHere )
	    {
	      billy.teleport(g, 5, 6)
	      conv.addSpeaker("Billy", billy.pArt, 412, true)
	    }
	    if ( chloeHere )
	    {
	      chloe.teleport(g, 5, 8)
	      conv.addSpeaker("Chloe", chloe.pArt, 100, false)
	    }
	    conv.speaker("Alfred");
	    conv.say("That's the last of the bandits.");
	    if ( billyHere )
	    {
	      conv.speaker("Billy");
	      conv.say("We beat 'em good!");
	    }
	    if ( chloeHere )
	    {
	      conv.speaker("Chloe");
	      conv.say("Good job, everyone!");
	    }
	    conv.speaker("Timmy");
	    conv.say("But why are the bandits suddenly attacking\nour village?")
	    conv.say("I don't think I've ever seen them before.")
	    if ( billyHere )
	    {
	      conv.speaker("Billy");
	      conv.say("That's true. I've been livin' round here\never since I was a wee lad.")
	      conv.say("I don't think we've ever been attacked.");
	      conv.speaker("Alfred");
	      conv.say("The same goes for me.");
	    }
	    else
	    {
	      conv.speaker("Alfred");
	      conv.say("That's true. I've been living here since\nI was a kid. We've never been attacked.");
	    }
	    conv.say("This could be bad.\nThey'll likely be back.");
	    conv.say("Hmmm...");
	    conv.say("I've got it! One of my childhood friends is\na knight. Right now, he lives south of here.");
	    conv.say("I'll go ask him to come defend the village.");
	    if ( chloeHere )
	    {
	      conv.speaker("Chloe");
	      conv.say("Sounds good! Kid, you" + ((billyHere)?" and Billy":"")
		+ " and me are\non lookout while Alfred's off!");
	      conv.speaker("Timmy");
	      conv.say("Hey! My name's Timmy!");
	    }
	    else
	    {
	      if ( billyHere )
		conv.say("Timmy, you and Billy stay here in case\nthe bandits attack again.");
	      else
		conv.say("Timmy, you stay here in the village.\nIt's safer that way.");
	    }

	    g.camera.shiftImmediate(0, 2);
	    await g.fadeIn();
	    await g.cursorFlash(alfred);
	    await g.setExtStatus(conv);
	    // TODO instead of this, do "we should rest a bit" and heal everyone

	    let movePromise = [];
	    movePromise.push(alfred.moveTo(g,12, 7));
	    if (billyHere)
	    {
	      await csPause(200);
	      movePromise.push(billy.moveTo(g, 11, 6));
	    }
	    if (chloeHere)
	    {
	      await csPause(200);
	      movePromise.push(chloe.moveTo(g, 11, 8));
	    }
	    await csPause(200);
	    movePromise.push(child.moveTo(g, 8, 7));
	    movePromise.push(g.cameraShift(4,2));
	    await Promise.all(movePromise);
	    await g.cursorFlash(alfred);
	    
	    state = FETCH;

	    conv = new Conversation(g);
	    conv.addSpeaker("Alfred", alfred.pArt, 412, true)
	    conv.speaker("Alfred");
	    conv.say("Now, where was his house?\nIf I recall...");
	    await g.setExtStatus(conv);
	    
	    g.Map.setMaxBound(null, 32);

	    await g.cameraShift(4,20);
	    await g.cameraShift(0,20);
	    await g.cursorFlash(2, 25);
	    conv = new Conversation(g);
	    conv.addSpeaker("Alfred", alfred.pArt, 412, true)
	    conv.speaker("Alfred");
	    conv.say("Ah, I remember! It's in that forest!");
	    await g.setExtStatus(conv);

	    await g.cameraShift(4,2);
	    g.cursor.moveInstant(alfred);
	    
	    let bh = billyHere && (billy.stats.hp < billy.stats.maxhp);
	    let ch = chloeHere && (chloe.stats.hp < chloe.stats.maxhp);
	    let th = child.stats.hp < child.stats.maxhp;
	    let ah = alfred.stats.hp < alfred.stats.maxhp;
	    let heal = (bh || ch || th || ah);

	    if (heal)
	    {
	      conv = new Conversation(g);
	      conv.addSpeaker("Alfred", alfred.pArt, 412, true)
	      conv.speaker("Alfred");
	      conv.say("But first, let's take a quick breather.");
	      await g.setExtStatus(conv);

	      await g.healUnit(child);
	      if (billyHere) await g.healUnit(billy);
	      if (chloeHere) await g.healUnit(chloe);
	      await g.healUnit(alfred);
	    }

	    if (billyHere)
	    {
	      //g.switchTeam(billy, "Village");
	      billy.stats.mov = 0;
	      await g.leaveJingle(billy);
	      await csPause(200);
	    }
	    if (chloeHere)
	    {
	      //g.switchTeam(chloe, "Village");
	      chloe.stats.mov = 0;
	      await g.leaveJingle(chloe);
	      await csPause(200);
	    }
	    //g.switchTeam(child, "Village");
	    child.stats.mov = 0;
	    await g.leaveJingle(child);

	    g.startTurns();
	  }
        },
	{ tag: "victory",
          condition: (g)=>
	  { return state == RETURN
		&& choddson.isDead()
		&& banditWave.every((u)=>{return u.isDead()})
	  },
          repeating: false,
          restartTurns: false,
          action: async (g) =>
          {
	    await g.switchTeam(child, "Village");
	    g.onVictory();
	  }
	}

      ],
      turnBegin:
      {
	"Bandit":
	[
	  { type: "relative",
	    tag: "spawn bandits",
	    activate: (g, e)=>{return state == RETURN;},
	    condition: (g, e)=>{return g.turn == e.turn+2;},
	    action: async (g)=>
	    {
	      console.log(this)
	      g.camera.clearTarget();

	      let dests = [[20,12],[21,12],[21,10],[20,11]];

	      for (let i = 0; i < dests.length; ++i)
	      {
		let u = new Units.Bandit({maxhp:15, atk:3,spd:1,skl:2,def:4,con:9,mov: 5});
		u.setXY(21,11)
		u.team = "Bandit";
		u.addWeapon(new Weapons.LumberAxe());
		u.setAnim("idle");
		u.ai = "targetWeakest";
		banditWave.push(u);
	      }

	      await g.cameraShift(6,5);
	      let movePromise = [];
	      for (let i = 0; i < dests.length; ++i)
	      {
		let b = banditWave[i];
		g.addUnit(b);
		let move = b.moveTo(g, ...dests[i]);
		movePromise.push(move);
		await csPause(150);
	      }
	      g.addUnit(choddson);
	      await Promise.all(movePromise);
	      await g.cursorFlash(choddson);
	      let conv = new Conversation(g);
	      conv.addSpeaker("Choddson", choddson.pArt, 384, true);
	      conv.speaker("Choddson");
	      conv.say("Those two scouts still haven't made it back, eh?");
	      conv.say("Well, it don't matter none. There's bound to be\nlotsa good stuff in this village.");
	      conv.say("Let's get 'em, boys!");
	      await g.setExtStatus(conv);
	    }
	  }
	],
	"Village":
	[
	  { type: "relative",
	    tag: "re-recruit villagers",
	    activate: (g,e)=>{return state == RETURN;},
	    condition: (g,e)=>{return g.turn == e.turn+3;},
	    action: async (g)=>
	    {
	      g.gameStatus = "blockInput";
	      g.camera.clearTarget();

	      await g.cameraShift(4,2);

	      let billyHere = ( billy.isAlive() && billy.recruited );
	      let chloeHere = ( chloe.isAlive() && chloe.recruited );
	      if (billyHere)
	      {
		let conv = new Conversation(g);
		conv.addSpeaker("Billy", billy.pArt, 120);
		conv.speaker("Billy");
		conv.say("Holy beets! More bandits?");
		conv.say(((chloeHere)?"We":"I") + " can't let 'em in the village!");
		await g.cursorFlash(billy);
		await g.setExtStatus(conv);

		//await g.switchTeam(billy, "Player");
		billy.stats.mov = 6;
		await g.recruitJingle(billy);
		await csPause(500);
	      }
	      if (chloeHere)
	      {
		let conv = new Conversation(g);
		conv.addSpeaker("Chloe", chloe.pArt, 120);
		conv.speaker("Chloe");
		conv.say("Squash salad! The bandits are back?");
		conv.say(((billyHere)?"We":"I") + " have to hold them at the entrance!");
		await g.cursorFlash(chloe);
		await g.setExtStatus(conv);

		//await g.switchTeam(chloe, "Player");
		chloe.stats.mov = 6;
		await g.recruitJingle(chloe);
		await csPause(500);
	      }
	      let conv = new Conversation(g);
	      conv.addSpeaker("Timmy", child.pArt, 120);
	      conv.speaker("Timmy");
	      conv.say("There's more of them...");
	      await g.cursorFlash(child);
	      await g.setExtStatus(conv);

	      //await g.switchTeam(child, "Player");
	      child.stats.mov = 5;
	      await g.recruitJingle(child);
	      
	      await g.cameraCenter(vargas);
	      await g.cursorFlash(vargas);
	      conv = new Conversation(g);
	      conv.addSpeaker("Vargas", vargas.pArt, 100);
	      conv.addSpeaker("Alfred", alfred.pArt, 412, true);
	      conv.speaker("Vargas");
	      conv.say("Alfred, the leader of those bandits\nlooks to be very dangerous.");
	      conv.say("You should let me take care of him.");
	      conv.speaker("Alfred");
	      conv.say("Okay, got it.");
	      await g.setExtStatus(conv);
	    }
	  }
	],
	
      } //turnBegin
    } //events
  } //script


