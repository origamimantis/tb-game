import {Conversation} from "./Conversation.js"
import {waitSpriteEffect} from "./Effects.js";
import * as Units from "./TypeUnits.js";
import * as Weapons from "./Weapon.js";
import * as Items from "./Item.js";
import * as Equipment from "./Equipment.js";
import {Coord} from "./Path.js";
import {waitTime} from "./Utils.js";
import {MusicPlayer} from "./MusicPlayer.js";

import {Storage} from "./Storage.js";

let units = []
export function setUnits(u)
{
  units = u;
}

let alfred;
let child;
let b1;
let b2;
let yuli;
let mali;
let mag;
let mag2;
let mag3;
let billy;
let chloe;
let vargas;

let choddson;

function initVars()
{
  alfred = new Units.Farmer({maxhp:13, atk:2,spd:3,skl:2,def:2,con:4,mov: 6}, "Alfred");
  alfred.setXY(9,9)
  alfred.team = "Player";
  alfred.stats.hp = 5;
  alfred.pArt = "P_Alfred";
  alfred.addWeapon(new Weapons.Pitchfork());
  alfred.addItem(new Items.Bandages());
  alfred.setAnim( "idle" );

  child = new Units.Child({maxhp:5, atk:0,spd:5,skl:0,def:0,con:0,mov: 5}, "Timmy");
  child.setXY(5, 8);
  child.team = "Player";
  child.pArt = "P_child";
  child.setAnim( "idle" );

  b1 = new Units.Bandit({maxhp:16, atk:3,spd:2,skl:4,def:3,con:4,mov: 6}, "Bandit");
  b1.setXY(13, 6);
  b1.team = "Bandit";
  b1.setAnim( "idle" );
  b1.addWeapon(new Weapons.LumberAxe());
  b1.ai = "targetWeakest";
	
  b2 = new Units.Bandit({maxhp:14, atk:2,spd:3,skl:5,def:2,con:4,mov: 6}, "Bandit");
  b2.setXY(13, 8);
  b2.team = "Bandit";
  b2.setAnim( "idle" );
  b2.addWeapon(new Weapons.LumberAxe());
  b2.ai = "targetWeakest";

  billy = new Units.Farmer({maxhp:16, atk:3,spd:2,skl:300,def:3,con:4,mov: 6}, "Billy");
  billy.setXY(10, 4);
  billy.team = "Player";
  billy.pArt = "P_Billy";
  billy.addWeapon(new Weapons.Shovel());
  billy.setAnim( "idle" );
  billy.recruited = true;
  billy.ai = "guard";

  yuli = new Units.BowKnight({maxhp:16, atk:5,spd:3,skl:40,def:1,con:4,mov: 6}, "Yuliza")
  yuli.setXY( 9, 6);
  yuli.team = "Player";
  yuli.pArt = "P_Yuliza";
  yuli.addWeapon(new Weapons.TestBow());
  yuli.equipment.push(new Equipment.SwiftBlessing());
  yuli.setAnim( "idle" );

  mali = new Units.BowKnight({maxhp:17, atk:4,spd:4,skl:3,def:2,con:4,mov: 6}, "Malidale")
  mali.setXY( 9, 7);
  mali.team = "Player";
  mali.pArt = "P_Malidale";
  mali.addWeapon(new Weapons.TestBow());
  mali.equipment.push(new Equipment.LeatherTunic());
  mali.setAnim( "idle" );

  mag = new Units.SwordKnight({maxhp:18, atk:5,spd:6,skl:4,def:4,con:3,mov: 6}, "Grefta", "S_kn0");
  mag.setXY( 9, 8);
  mag.team = "Player";
  mag.pArt = "P_Grefta";
  mag.classname = "Mage Knight";
  mag.addWeapon(new Weapons.TestMagic());
  mag.setAnim( "idle" );

  mag2 = new Units.SwordKnight({maxhp:18, atk:5,spd:6,skl:4,def:4,con:3,mov: 6}, "Odunfel", "S_kn0");
  mag2.setXY( 10, 8);
  mag2.team = "Player";
  mag2.pArt = "P_Odunfel";
  mag2.classname = "Mage Knight";
  mag2.addWeapon(new Weapons.TestMagic());
  mag2.setAnim( "idle" );

  mag3= new Units.SwordKnight({maxhp:18, atk:5,spd:6,skl:4,def:4,con:3,mov: 6}, "Margolik", "S_kn0");
  mag3.setXY( 11, 8);
  mag3.team = "Player";
  mag3.pArt = "P_Margolik";
  mag3.classname = "Mage Knight";
  mag3.addWeapon(new Weapons.TestMagic());
  mag3.setAnim( "idle" );




  chloe = new Units.Farmer({maxhp:16, atk:2,spd:3,skl:3,def:2,con:4,mov: 6}, "Chloe");
  chloe.setXY(9, 5);
  chloe.team = "Player";
  chloe.pArt = "P_Chloe";
  chloe.addWeapon(new Weapons.FryingPan());
  chloe.setAnim( "idle" );
  chloe.recruited = true;
  chloe.ai = "guard";

  vargas = new Units.SwordKnight({maxhp:28, atk:6,spd:7,skl:12,def:5,con:12,mov: 6}, "Vargas", "S_lead0");
  vargas.setXY(8, 7);
  vargas.team = "Player";
  vargas.pArt = "P_lead";
  vargas.addWeapon(new Weapons.BronzeSlicer());
  vargas.equipment.push(new Equipment.SteelPlating());
  vargas.setAnim("idle");
  
  choddson = new Units.Bandit({maxhp:33, atk:8,spd:3,skl:5,def:7,con:19,mov: 6}, "Choddson");
  choddson.setXY(12,7);
  choddson.team = "Bandit";
  choddson.pArt = "P_Choddson";
  choddson.addWeapon(new Weapons.LumberAxe());
  choddson.setAnim("idle");
  choddson.ai = "targetWeakest";

}

export let script =
  {
    chNumber: null,
    chTitle: "Test Level",
    tileMap: "assets/tilemaps/ch1.txt",
    nextLvl: null,
    type: "Game",
    cameraInit: {x: 0, y: 0},
    teams:  [ {name: "Player", bannercolor: "#aaaaff", maptheme: "ch1 map",  btltheme: "player battle"},
	      {name: "Village", bannercolor: "#12aa12", maptheme: "village",  btltheme: "player battle"},
	      {name: "Bandit", bannercolor: "#bd4900", maptheme: "ch1 enemy",  btltheme: "enemy battle"}
	    ],
    alliances: {"Player": ["Village"], "Village":["Player"]},
    dayLength: 0,   // 0: always days, <0: always night
    
    onBegin: async (g) =>
    {
      console.log("loaded ch1");
      initVars();

      g.Map.setMaxBound(null, 17);
      g.addUnit(alfred);
      
      g.addUnit(child);

      g.addUnit(vargas);

      g.addUnit(b1);
      g.addUnit(b2);
      g.addUnit(choddson);

      g.addUnit(chloe, new Coord(3,6));
      await g.addUnit(billy, new Coord(7,3));
      g.addUnit(yuli);
      g.addUnit(mali);
      g.addUnit(mag);
      g.addUnit(mag2);
      g.addUnit(mag3);

    }, //onBegin
    conversations: {},
    interactions: {
      "3,6" :  // HOUSE 1 (chloe)
      {
	type: "Village",
	tooltip: "Visit",
	visited: false,
	canInteract: function() {return this.visited == false},
	mapSprite: "T_door_open",
	drawSprite: function() {return this.visited == false},
	action: async function(g, u, ondone)
	{
	  let conv = new Conversation(g);
	  conv.addSpeaker(u.name, u.pArt, 100, false);
	  conv.addSpeaker("Chloe", chloe.pArt, 412, true);
	  conv.music("village", false, false);
	  conv.speaker("Chloe");
	  conv.say("Spinach salad! Bandits? Hold on just one second.");
	  conv.leave("Chloe");
	  conv.pause(250);
	  conv.enter("Chloe");
	  conv.say("I got my trusty frying pan.");
	  conv.say("They don't know what's comin' for 'em!");

	  await MusicPlayer.fadeout(g.mapTheme);
	  await g.setExtStatus(conv, ()=>{return "blockInput"},
	    async ()=>
	    {
	      MusicPlayer.fadein(g.mapTheme);
	      this.visited = true;

	      ondone();
	      await g.setStatus("map");
	    }
	  );
	}
      }, //3,6 house

      "7,3" :  // HOUSE 2 (billy)
      {
	type: "Village",
	tooltip: "Visit",
	visited: false,
	canInteract: function() {return this.visited == false},
	mapSprite: "T_door_open",
	drawSprite: function() {return this.visited == false},
	action: async function(g, u, ondone)
	{
	  let healed = false;
	  let conv = new Conversation(g);
	  conv.addSpeaker(u.name, u.pArt, 100, false);
	  conv.addSpeaker("Billy", billy.pArt, 412, true);
	  conv.music("village", false, false);
	  conv.speaker("Billy");
	  conv.say("Holy turnips! Bandits, ya say?\nOf course we gotta drive 'em out.");
	  conv.say("Lemme get my shovel real quick.");
	  conv.leave("Billy");
	  conv.pause(250);
	  conv.enter("Billy");
	  conv.say("Let's go beat them bandits!");

	  await MusicPlayer.fadeout(g.mapTheme);
	  await g.setExtStatus(conv, null);
	  console.log("MonkaS");
	  MusicPlayer.fadein(g.mapTheme);
	  this.visited = true;
	      
	  ondone();
	  await g.setStatus("map");
	}
      }, //7,3 village
    }, //interactions
    events: {
      onDeath: {
	//"Alfred": (g)=>{g.onGameOver()},
	"Timmy": (g)=>{g.onGameOver()},
      },
      afterBattle: [
        { tag: "initial bandits defeated",
	  repeating: false,
          condition: (g)=>{return false;},
          action: async (g)=>
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
	      conv.say("Sounds good! Kid, you" + ((billyHere)?" and Billy":"") + " and me are\non lookout while Alfred's off!");
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
	    movePromise.push(g.cameraShift(3,2));
	    await Promise.all(movePromise);
	    await g.cursorFlash(alfred);
	    
	    conv = new Conversation(g);
	    conv.addSpeaker("Alfred", alfred.pArt, 412, true)
	    conv.speaker("Alfred");
	    conv.say("Now, where was his house?\nIf I recall...");
	    await g.setExtStatus(conv);
	    
	    g.Map.setMaxBound(null, 32);

	    await g.cameraShift(3,20);
	    await g.cameraShift(0,20);
	    await g.cursorFlash(2, 25);
	    conv = new Conversation(g);
	    conv.addSpeaker("Alfred", alfred.pArt, 412, true)
	    conv.speaker("Alfred");
	    conv.say("Ah, I remember! It's in that forest!");
	    await g.setExtStatus(conv);
	    await g.cameraShift(3,2);
	    g.cursor.moveInstant(alfred);
	    g.resetTurns();
	  }
        }
      ],
      turnBegin:
      {
      },
    } //events
  } //script
