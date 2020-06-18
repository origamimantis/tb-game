"use strict";

class Item
{
  constructor(name, maxuses, img)
  {
    this.name = name;
    this.maxUses = maxuses;
    this.uses = maxuses;
  }
  use(user, target)
  {
  }
}
export class Bandages extends Item
{
  constructor()
  {
    super("Bandages", 20);
  }
}
