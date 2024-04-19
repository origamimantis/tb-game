"use strict";

import {SpriteEffect, spawnSpriteEffect} from "./Effects.js";
import {addSpaces} from "./Utils.js";
import {Album} from "./Images.js";

const ARMOR = 0
const HELMET = 1
const GLOVES = 2
const LEGGING = 3
const BOOTS = 4
const MISC = 5


class Equipment
{
  constructor(name, type, img)
  {
    this.classname = this.constructor.name;
    this.name = addSpaces(this.classname);
    this.icon = "EQ_"+this.classname;
    this.type = type;
  }
  get icon() { return this._icon; }
  set icon(val) { this._icon = Album.loadIfExists(val); }
  effect(user)
  {
  }
}

export class Armor extends Equipment
{
  constructor()
  {
    super(ARMOR);
  }
}

export class LeatherTunic extends Armor
{
  constructor()
  {
    super();
    this.tooltip = "Light armor.\nGrants Def +3."
    this.stats = {def:3}
  }
}

export class SteelPlating extends Armor
{
  constructor()
  {
    super();
    this.tooltip = "Well-fortified, heavy armor.\n"
    this.tooltip+= "Grants Spd -2, Def +8."
    this.stats = {def:8, spd:-2}
  }
}

export class SwiftBlessing extends Armor
{
  constructor()
  {
    super();
    this.tooltip = "A shirt that was blessed as a joke.\nGrants Spd +3, Mov +3."
    this.stats = {spd:3, mov:3}
  }
}
