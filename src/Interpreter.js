'use strict';

import {requestFile} from "./Utils.js";
import {Game, FPS} from "./Game.js";
import {Unit} from "./Unit.js";
import {Units} from "./TypeUnits.js";
import {Animation} from "./Animation.js";
import {AnimFrame} from "./AnimFrame.js";
import {Weapon, Weapons} from "./Weapon.js";


const commentChar = "#";


class Interpreter
{
  constructor(g)
  {
    this.g = g;
    this.commands = 
    {
      ADDUNIT: (id, x, y) => {return new Promise( (resolve) =>
      {
	id = parseInt(id); x = parseInt(x); y = parseInt(y);  
	let u = new Unit(id, x, y, {}, {mov: 7});
	u.addAnim( "idle", new Animation("S_kn0", [20,10,20,10]));
	u.setAnim( "idle" );
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
	this.g.getUnitById(id).moveTo(this.g, x, y);
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
	throw  "invalid command: " + tokens[0];
      }
    }
  }

  
}



export {Interpreter};
