import {Inputter} from "./Inputter.js"
import {Conversation} from "./Conversation.js"
import {spawnSpriteEffect} from "./Effects.js";
import * as Units from "./TypeUnits.js";
import * as Weapons from "./Weapon.js";
import {Coord} from "./Path.js";
import {waitTime} from "./Utils.js";
import {MusicPlayer} from "./MusicPlayer.js";
import {Settings} from "./Settings.js";

let alfred;
let child;
let b1;
let b2;
let billy;
let chloe;
let vargas;
let yuli;
let mali;
let state;
let banditWave = [];
let choddson;
const DEFEND = 0;
const FETCH = 1;
const RETURN = 2;

function initVars()
{
  state = DEFEND;
  alfred = new Units.Farmer(0, 3, 10, {maxhp:9, atk:2,spd:3,skl:2,def:3,con:4,mov: 6}, "Alfred");
  alfred.team = "Player";
  alfred.pArt = "P_Alfred";
  alfred.addWeapon(new Weapons.Pitchfork());
  alfred.setAnim( "idle" );

  child = new Units.Child(1, 17, 12, {maxhp:5, atk:0,spd:5,skl:0,def:0,con:0,mov: 5}, "Timmy");
  child.team = "Player";
  child.pArt = "P_child";
  child.setAnim( "idle" );
  
  billy = new Units.Farmer(4, 8, 3, {maxhp:11, atk:4,spd:2,skl:2,def:4,con:4,mov: 6}, "Billy");
  billy.team = "Player";
  billy.pArt = "P_Billy";
  billy.addWeapon(new Weapons.Shovel());
  billy.setAnim( "idle" );

  chloe = new Units.Farmer(5, 4, 6, {maxhp:8, atk:3,spd:4,skl:3,def:2,con:4,mov: 6}, "Chloe");
  chloe.team = "Player";
  chloe.pArt = "P_Chloe";
  chloe.addWeapon(new Weapons.FryingPan());
  chloe.setAnim( "idle" );

  vargas = new Units.SwordKnight(6, 3,10, {maxhp:28, atk:7,spd:7,skl:12,def:6,con:12,mov: 6}, "Vargas", "S_lead0");
  vargas.team = "Player";
  vargas.pArt = "P_lead";
  vargas.addWeapon(new Weapons.BronzeSlicer());
  vargas.setAnim("idle");

  yuli = new Units.BowKnight(11, 9, 6, {maxhp:16, atk:5,spd:3,skl:40,def:1,con:4,mov: 6}, "Yuliza")
  yuli.team = "Player";
  yuli.pArt = "P_Yuliza";
  yuli.addWeapon(new Weapons.TestBow());
  yuli.setAnim( "idle" );
  vargas.recruited = false;

  mali = new Units.BowKnight(13, 9, 7, {maxhp:17, atk:4,spd:4,skl:3,def:2,con:4,mov: 6}, "Malidale")
  mali.team = "Player";
  mali.pArt = "P_Malidale";
  mali.addWeapon(new Weapons.TestBow());
  mali.setAnim( "idle" );
  vargas.recruited = false;

}



export let script =
  {
    tileMap: "assets/tilemaps/ch2.txt",
    type: "WalkScene",
    cameraInit: {x: 0, y:4},
    teams:  [ {name: "Player", bannercolor: "#aaaaff", maptheme: "btl1",  btltheme: "fght2"},
	      {name: "Village", bannercolor: "#12aa12", maptheme: "village",  btltheme: "fght"}
	    ],
    alliances: {"Player": ["Village"], "Village":["Player"]},
    dayLength: 0,   // 0: always days, <0: always night

    onBegin: async (g) =>
    {
      // TODO
      //Settings.set("cut_skip", "On");
      MusicPlayer.play("just_browsing");
      initVars();
      g.addUnit(vargas);
      g.control(vargas);
    }, //onBegin
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

	  g.specialCount = 0;
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
	    await waitTime(1000);
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
	      await waitTime(200);
	      movePromise.push(billy.moveTo(g, 11, 6));
	    }
	    if (chloeHere)
	    {
	      await waitTime(200);
	      movePromise.push(chloe.moveTo(g, 11, 8));
	    }
	    await waitTime(200);
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
	      g.switchTeam(billy, "Village");
	      await g.leaveJingle(billy);
	      await waitTime(200);
	    }
	    if (chloeHere)
	    {
	      g.switchTeam(chloe, "Village");
	      await g.leaveJingle(chloe);
	      await waitTime(200);
	    }
	    g.switchTeam(child, "Village");
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
	    g.onVictory();
	  }
	}

      ],
      turnBegin:
      {
	"Bandit":
	[
	  { turn: 2,
	    type: "relative",
	    tag: "spawn bandits",
	    condition: ()=>{return state == RETURN;},
	    action: async (g)=>
	    {
	      g.camera.clearTarget();
	      for (let i = 0; i < 6; ++i)
	      {
		let u = new Units.Bandit(8+i, 21,11, {maxhp:17, atk:4,spd:2,skl:2,def:4,con:9,mov: 5}, "Bandit");
		u.team = "Bandit";
		u.addWeapon(new Weapons.LumberAxe());
		u.setAnim("idle");
		u.ai = "targetWeakest";
		banditWave.push(u);
	      }
	      let dests = [[19, 12],[19,11],[20,12],[21,12],[21,10],[20,11]];

	      //TODO
	      //Settings.set("cut_skip", "Off");

	      await g.cameraShift(6,5);
	      let movePromise = [];
	      for (let i = 0; i < 6; ++i)
	      {
		let b = banditWave[i];
		g.addUnit(b);
		let move = b.moveTo(g, ...dests[i]);
		movePromise.push(move);
		await waitTime(150);
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
	  { turn: 3,
	    type: "relative",
	    tag: "re-recruit villagers",
	    condition: ()=>{return state == RETURN;},
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

		await g.switchTeam(billy, "Player");
		await g.recruitJingle(billy);
		await waitTime(500);
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

		await g.switchTeam(chloe, "Player");
		await g.recruitJingle(chloe);
		await waitTime(500);
	      }
	      let conv = new Conversation(g);
	      conv.addSpeaker("Timmy", child.pArt, 120);
	      conv.speaker("Timmy");
	      conv.say("There's more of them...");
	      await g.cursorFlash(child);
	      await g.setExtStatus(conv);

	      await g.switchTeam(child, "Player");
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


