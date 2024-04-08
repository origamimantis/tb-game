"use strict";

import {SpriteEffect, spawnSpriteEffect} from "./Effects.js";

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
    this.name = name;
    this.type = type;
  }
  effect(user)
  {
  }
}

export class Armor extends Equipment
{
  constructor(name)
  {
    super(name, ARMOR);
  }
}

export class LeatherTunic extends Armor
{
  constructor()
  {
    super("Leather Tunic");
    this.tooltip = "Light armor.\nGrants Def +3."
    this.stats = {def:3}
  }
}

export class SteelPlating extends Armor
{
  constructor()
  {
    super("Steel Plating");
    this.tooltip = "Well-fortified, heavy armor.\n"
    this.tooltip+= "Grants Spd -2, Def +8."
    this.stats = {def:8, spd:-2}
  }
}

export class SwiftBlessing extends Armor
{
  constructor()
  {
    super("Swift Blessing");
    this.tooltip = "A shirt that was blessed as a joke.\nGrants Spd +3, Mov +3."
    this.stats = {spd:3, mov:3}
  }
}
