"use strict";

import {waitTick} from "./Utils.js";
import {Animation} from "./Animation.js";

const ANIMDATA =
  {
    heal: { image: "FX_heal", weights: [5,5,5,5,5,5], time: 60, fade: true, fadeDelay: 20 ,loops: true}
  };

export class NightTimeEffect
{
  constructor()
  {}
  draw(g)
  {
    if (g.isNightTime())
    {
      g.ctx[2].fillStyle = "#00008D";
      g.ctx[2].globalAlpha = 0.3;
      g.ctx[2].fillRect(0,0,512, 384);
      g.ctx[2].globalAlpha = 1;
    }
  }
  update()
  {}
}

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

  }
  draw(g)
  {
    if (this.fade)
    {
      if (this.time > this.fadeDelay)
	this.a -= this.da;
      g.ctx[this.layer].globalAlpha = this.a;
    }

    super.draw(g, this.layer, this.x, this.y, 1, true)

    if (this.fade)
    {
      g.ctx[this.layer].globalAlpha = 1;
    }
  }
  update()
  {
    -- this.time;
    super.tick();
  }
}

export function raitSpriteEffect( g, name, layer, x, y)
{
  return new Promise( (resolve) => 
    {
      let fx = new SpriteEffect(g, name, layer, x, y, resolve);
    }
  );
}
export async function waitSpriteEffect( g, name, layer, x, y)
{
  let fx = new SpriteEffect(g, name, layer, x, y);
  while (fx.time > 0)
  {
    fx.draw(g);
    fx.update();
    await waitTick();
  }
}
