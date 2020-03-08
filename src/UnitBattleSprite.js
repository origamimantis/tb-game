"use strict";

import {AnimatedObject} from "./AnimatedObject.js";

export class UnitBattleSprite extends AnimatedObject
{
  constructor(unit, id, g, x, y)
  {
    super(g, x, y);
    this.id = id;
    for (let [anim, uAnim] of Object.entries(unit.animations))
    {
      this.addAnim( anim, uAnim.copy() );
    }
  }

  draw(g)
  {
    super.draw(g, 3, this.x, this.y, 1, false);
  }

  update(g)
  {
    super.tickAnim();
  }






}
