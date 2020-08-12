"use strict";

import {SpriteEffect, waitSpriteEffect} from "./Effects.js";

class Item
{
  constructor(name, maxuses, img)
  {
    this.name = name;
    this.maxUses = maxuses;
    this.uses = maxuses;
  }
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
    super("Bandages", 20);
  }
  usable(user)
  {
    return (user.stats.hp < user.stats.maxhp);
  }
  async use(g, user = null, target = null)
  {
    super.use(g, user, target);
    let c = g.camera.adjustedPos(user);
    let e = waitSpriteEffect(g, "heal", 3, c.x, c.y);
    await e;
    await g.healUnit(user, 10);
  }
}
