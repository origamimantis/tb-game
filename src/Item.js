"use strict";

import {SpriteEffect, spawnSpriteEffect} from "./Effects.js";
import {Album} from "./Images.js";
import {addSpaces} from "./Utils.js";

class Item
{
  constructor(maxuses)
  {
    this.classname = this.constructor.name;
    this.name = addSpaces(this.classname);
    this.icon = "IT_" + this.classname;
    this.maxUses = maxuses;
    this.uses = maxuses;
  }
  get icon() { return this._icon; }
  set icon(val) { this._icon = Album.loadIfExists(val); }

  usable(user)
  {
  }
  use(g, user, target)
  {
    -- this.uses;
  }
}
export class Bandages extends Item
{
  constructor()
  {
    super(5);
    this.tooltip = "A common medicinal tool.\nUse to heal for 10 HP.";
  }
  usable(user)
  {
    return (user.stats.hp < user.stats.maxhp);
  }
  async use(g, user = null, target = null)
  {
    super.use(g, user, target);
    let c = g.camera.adjustedPos(user);
    let e = spawnSpriteEffect(g, "heal", 3, c.x, c.y);
    await e;
    await g.healUnit(user, 10);

    if (this.uses <= 0 && user !== null)
      user.removeItem(this)

  }
}

