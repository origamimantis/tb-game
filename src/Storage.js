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
    if (window.localStorage.getItem("NUMSAVES") !== null)
    {
      try
      {
	let s = JSON.parse(window.localStorage.getItem("NUMSAVES"))
	let new_s = []
	// validate that savefiles exist (if unreadable then that's a later problem)
	for (let i = 0; i < s; ++i)
	{
	  if (window.localStorage.getItem("LOCALSAVE_"+i+"data") !== null && 
	      window.localStorage.getItem("LOCALSAVE_"+i+"meta") !== null)
	  {
	    new_s.push(i);
	  }
	}
	for (let i = 0; i < new_s.length; ++i)
	{
	  let j = new_s[i]
	  if (j != i)
	  {
	    window.localStorage.setItem("LOCALSAVE_"+i+"data", window.localStorage.getItem("LOCALSAVE_"+j+"data"))
	    window.localStorage.setItem("LOCALSAVE_"+i+"meta", window.localStorage.getItem("LOCALSAVE_"+j+"meta"))
	  }
	}

	window.localStorage.setItem("NUMSAVES", JSON.stringify(new_s.length))
	return
      }
      // if error happens while parsing json then "break"
      catch (e)
      {
	console.log(e)
	window.localStorage.removeItem("NUMSAVES")
      }
      
    }
    if (window.localStorage.getItem("NUMSAVES") === null)
    {
      window.localStorage.setItem("NUMSAVES", JSON.stringify(0));
    }


  }

  static async saveFromFile(file, avoid_duplicate=true)
  {
    let jsonsave = (await requestFile(file)).responseText
    jsonsave = JSON.stringify(JSON.parse(jsonsave))
    if (avoid_duplicate == true)
    {
      let s = JSON.parse(window.localStorage.getItem("NUMSAVES"))
      for (let i = 0; i < s; ++i)
      {
	let save = "LOCALSAVE_"+String(i)
	let src = JSON.parse(window.localStorage.getItem(save+"meta")).source
	if (src == file)
	{
	  let data = window.localStorage.getItem(save+"data")
	  if (jsonsave == data)
	  {
	    console.log("Not adding provided save for "+file+" since it already exists.")
	    return
	  }
	}
      }
    }
    return Storage.save(JSON.parse(jsonsave), file);
  }
  static async saveFromGame(g)
  {
    let data = {}
    data.chapter = Storage.saveChapter(g)
    data.units = Storage.saveUnits(g)
    // Am not writing stringify(stringify(data)) so saves are easier to modify
    return Storage.save(data, "autosave");
  }
  static save(data, name="autosave")
  {
    let meta = {}
    meta.time = Storage.saveCurrentTime()
    meta.source = name
    meta.chapter = data.chapter

    let s = JSON.parse(window.localStorage.getItem("NUMSAVES"))
    ++s;
    let savefilename = "LOCALSAVE_"+String(s-1);

    window.localStorage.setItem(savefilename+"data", JSON.stringify(data));
    window.localStorage.setItem(savefilename+"meta", JSON.stringify(meta));
    window.localStorage.setItem("NUMSAVES", JSON.stringify(s));

    return data
  }
  static saveCurrentTime()
  {
    let date = new Date()
    return date.getTime()
  }
  static saveChapter(g)
  {
    if (g.chapterScript !== undefined)
    {
      //return g.chapterScript.scriptFile;
      return g.chapterScript.nextLvl;
    }
    return "./chtitle.js"
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
