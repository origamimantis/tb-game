"use strict";

import {Animation} from "./Animation.js";

const ANIMDATA =
  {
    heal: { image: "FX_heal", weights: [5,5,5,5,5,5], time: 60, fade: true, fadeDelay: 20 ,loops: true}
  };

export class SpriteEffect extends Animation
{
  constructor( g, name, layer, x, y, fxonDone = ()=>{})
  {
    let o  = ANIMDATA[name];

    super(o);

    this.fxonDone = fxonDone;
    this.g = g;
    this.layer = layer;
    this.x = x;
    this.y = y;

    this.time = o.time;
    this.fade = o.fade;
    this.fadeDelay = o.fadeDelay;
    this.a = 1;
    this.da = 1/(this.time - this.fadeDelay);

    g.toDraw.set("effect", this);
  }
  draw()
  {
    if (this.fade)
    {
      if (this.time > this.fadeDelay)
	this.a -= this.da;
      this.g.ctx[this.layer].globalAlpha = this.a;
    }

    super.draw(this.g, this.layer, this.x, this.y, 1, true)

    if (this.fade)
    {
      this.g.ctx[this.layer].globalAlpha = 1;
    }
  }
  update()
  {
    -- this.time;
    super.tick();
    if (this.time < 0)
    {
      this.draw = () => {};
      this.update = this.draw;

      this.g.toDraw.del("effect");

      this.fxonDone();
    }
  }
}

export function waitSpriteEffect( g, name, layer, x, y)
{
  return new Promise( (resolve) => 
    {
      let fx = new SpriteEffect(g, name, layer, x, y, resolve);
    }
  );
}
