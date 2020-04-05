'use strict';

import {requestFile, waitTick} from "./Utils.js";
import {Game, FPS} from "./Game.js";
import {Unit} from "./Unit.js";
import {Animation} from "./Animation.js";
import {AnimFrame} from "./AnimFrame.js";
import * as Weapons from "./Weapon.js";
import * as Units from "./TypeUnits.js";


const commentChar = "#";


class Interpreter
{
  constructor(g)
  {
    this.g = g;
    this.commands = 
    {
      ADDUNIT: (id, x, y, alliance = "player") => {return new Promise( (resolve) =>
      {
	id = parseInt(id); x = parseInt(x); y = parseInt(y);  
	let u = new Units.SwordKnight(id, x, y, {mov: 7});
	u.team = alliance;
	u.setAnim( "idle" );
	//u.addWeapon(new Weapons.Spook());
	u.addWeapon(new Weapons.BraveSword());
	
	this.g.addUnit(u);
	resolve();
      });},

      DELUNIT: (id) => {return new Promise( (resolve) =>
      {
	id = parseInt(id);
	let u = this.g.Units[id];
	if (u != null)
	{
	  this.g.Map.removeUnit(u);
	  delete this.g.Units[id];
	}
	resolve();
      });},

      WAIT: (amt) => {return new Promise( (resolve) =>
      {
	amt = parseInt(amt);
	setTimeout( resolve , amt );
      });},
      
      MOVE: (id, x, y) => {return new Promise( (resolve) =>
      {
	id = parseInt(id); x = parseInt(x); y = parseInt(y);
	let destUnit = this.g.Map.getTile(x,y).unit;
	if (destUnit == null || destUnit.id == id)
	{
	  let u = this.g.getUnitById(id);
	  if (u.moving == false)
	  {
	    this.g.getUnitById(id).moveTo(this.g, x, y);
	  }
	  else
	  {
	    throw "Unit already in motion."
	  }
	}
	else
	{
	  throw "Can't move there since a unit is already there or heading there."
	}
	resolve();
      });},

      SETSTAT: (id, ...args) => {return new Promise( (resolve) =>
      {
	id = parseInt(id);
	for (let chunk of args)
	{
	  let [name, val] = chunk.split(':');
	  name = name.trim().toLowerCase();
	  val = parseInt(val.trim());
	  if (this.g.getUnitById(id).stats[name] != undefined)
	  {
	    this.g.getUnitById(id).stats[name] = val;
	  }
	}
	resolve();
      });},
      
      LOGUNIT: (id) => {return new Promise( (resolve) =>
      {
	id = parseInt(id);
	console.log(this.g.getUnitById(id));
	resolve();
      });},

      COLORUNIT: (id, r, g = null, b = null) => {return new Promise( async (resolve) =>
      {
	id = parseInt(id);
	if (g != null && b != null)
	{
	  r = parseInt(r); g = parseInt(g); b = parseInt(b);  
	}
	else if (r.toUpperCase() == "RANDOM")
	{
	  r = Math.floor(Math.random()*256);
	  g = Math.floor(Math.random()*256);
	  b = Math.floor(Math.random()*256);
	}
	else
	{
	  throw "Bad input";
	}

	await this.g.getUnitById(id).recolorAnim(this.g, "idle", [r, g, b], "idle_" + r + "_" + g + "_" + b);
	resolve();
      });},

      TESTALTER: (id) => {return new Promise( async (resolve) =>
      {
	id = parseInt(id);
	let unit = this.g.getUnitById(id);
	await unit.test(this.g, "idle", unit.curAnim().image + "_testalter");
	resolve();
      });},
      
 



    }


  }

  async execute( string )
  {
    let lines = string.split("\n");

    for (let line of lines)
    {
      if (line.length == 0 || line[0] == commentChar)
      {
	continue;
      }
      let args = line.split(" ");
      let func = args.shift().toUpperCase();
      if (this.commands[func] != null)
      {
	await this.commands[func] (...args);
      }
      else
      {
	throw  "invalid command: " + func;
      }
    }
  }

  
}



export {Interpreter};
