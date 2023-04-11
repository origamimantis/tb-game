"use strict";

import {requestFile} from "./Utils.js";
import * as Units from "./TypeUnits.js";
import * as Weapons from "./Weapon.js";
import * as Items from "./Item.js";
import * as Equipments from "./Equipment.js";

/*
{
  current_chapter: 0
  units: {
    alfred: {
      unitclass: {
      }
      stats: {
      }
      caps: {
      }
      items: {
      }
      weapons: {
      }
      etc: {
      }
    }
    vargas: {
      ...
    }
  }
}
*/


export class Storage
{
  static async init(savesList)
  {
    for (let save of savesList)
    {
      let jsonsave = (await requestFile("src/"+save+".json")).responseText
      window.localStorage.setItem("LOCALSAVE_" + save, jsonsave);
    }
    if (window.localStorage.getItem("SAVELIST") !== null)
    {
      try
      {
	let s = JSON.parse(window.localStorage.getItem("SAVELIST"))
	let new_s = []
	// validate that savefiles exist (if unreadable then that's a later problem)
	for (let savename of s)
	{
	  if (window.localStorage.getItem("LOCALSAVE_"+savename) !== null)
	  {
	    new_s.push(savename);
	  }
	}
	window.localStorage.setItem("SAVELIST", JSON.stringify(new_s))
	return
      }
      // if error happens while parsing json then "break"
      catch (e)
      {
	window.localStorage.removeItem("SAVELIST")
      }
      
    }
    if (window.localStorage.getItem("SAVELIST") === null)
    {
      window.localStorage.setItem("SAVELIST", JSON.stringify(savesList));
    }


  }
  static save(g)
  {
    let data = {}
    data.chapter = Storage.saveChapter(g)
    data.units = Storage.saveUnits(g)
    // Am not writing stringify(stringify(data)) so saves are easier to modify
    console.log(JSON.stringify(data))
    window.localStorage.setItem("LOCALSAVE_autosave", JSON.stringify(data));

    let s = JSON.parse(window.localStorage.getItem("SAVELIST"))
    let ss = new Set(s)
    ss.add("autosave")
    s = Array.from(ss)
    console.log(s)
    window.localStorage.setItem("SAVELIST", JSON.stringify(s));

    return data
  }
  static saveChapter(g)
  {
    if (g.chapterScript !== undefined)
    {
      //return g.chapterScript.scriptFile;
      return g.chapterScript.nextLvl;
    }
    return "./ch1.js"
  }
  static saveUnits(g)
  {
    let units = {};
    if (g.Units !== undefined)
    {
      let gunits = g.Units.teams["Player"];
      for (let gunit of gunits)
      {
	let unit = {}
	unit.name = gunit.name
	unit.class = gunit.constructor.name
	unit.stats = gunit.stats
	unit.growths = gunit.growths
	unit.caps = gunit.caps
	unit.eqWeap = gunit.eqWeap

	let items = []
	let weapons = []
	let equipment = []

	gunit.items.forEach((gi, i, _) =>
	{
	  let it = {}
	  it.class = gi.constructor.name
	  it.uses = gi.uses
	  items.push(it);
	});

	gunit.weapons.forEach((gw, i, _) =>
	{
	  let w = {}
	  w.class = gw.constructor.name
	  w.uses = gw.uses
	  weapons.push(w);
	});

	gunit.equipment.forEach((ge, i, _) =>
	{
	  let e = {}
	  e.class = ge.constructor.name
	  equipment.push(e);
	});


	unit.items = items
	unit.weapons = weapons
	unit.equipment = equipment

	units[unit.name] = unit
      }
    }
    return units;

  }


  static loadObj(save_obj)
  {
    let units = {}
    for (let [name, data] of Object.entries(save_obj.units))
    {
      let unit = new Units[data.class](data.stats, name);
      unit.team = "Player";

      for (let wdata of data.weapons)
      {
	let w = new Weapons[wdata.class]
	w.uses = wdata.uses
	unit.addWeapon(w)
      }

      for (let idata of data.items)
      {
	let i = new Items[idata.class]
	i.uses = idata.uses
	unit.addItem(i)
      }

      for (let edata of data.equipment)
      {
	let e = new Equipments[edata.class]
	unit.addEquipment(e)
      }
      unit.setAnim( "idle" );
      units[name] = unit
    }
    return units

  }




}
