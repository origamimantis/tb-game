"use strict";

import {waitTick} from "./Utils.js";
import {Animation} from "./Animation.js";

const ANIMDATA =
  {
    heal: { image: "FX_heal",
	    weights: [5,5,5,5,5,5],
	    time: 60,
	    fade: true,
	    fadeDelay: 20,
	    loops: true,
	    initialScale: 1,
	    deltaScale: 0,
	    initialAngle: 0,
	    deltaAngle: 0,
	    baseTransparency: 1,
	  },
    cool: { image: "BFX_circle",
	    weights: [100],
	    time: 200,
	    fade: true,
	    fadeDelay: 160,
	    loops: true,
	    initialScale: 0,
	    deltaScale: (t) => { return (t > 120)? 0 : 0.01 },
	    initialAngle: 0,
	    deltaAngle: 12,
	    baseTransparency: 0.7,
    },
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
  constructor( name, layer, x, y, fxonDone = ()=>{})
  {
    let o  = ANIMDATA[name];

    super(o);

    this.fxonDone = fxonDone;
    this.layer = layer;
    this.x = x;
    this.y = y;
    this.s = o.initialScale;
    this.t = 0;
    this.th = o.initialAngle;

    this.ds = o.deltaScale;
    this.dth = o.deltaAngle;
    this.time = o.time;
    this.done = false;
    this.fade = o.fade;
    this.fadeDelay = o.fadeDelay;
    this.a = o.baseTransparency;
    this.da = this.a/(this.time - this.fadeDelay);

  }
  draw(g, x = this.x, y = this.y)
  {
    if (this.fade)
    {
      if (this.t > this.fadeDelay)
	this.a -= this.da;
      g.ctx[this.layer].globalAlpha = Math.max(0, this.a);
    }

    g.applyAngle(this.layer, x, y, this.th,
      ()=> { super.draw(g, this.layer, x, y, this.s); }
    );

    if (this.fade)
    {
      g.ctx[this.layer].globalAlpha = 1;
    }
  }
  update()
  {
    if (this.done == true)
      return;

    if (this.t >= this.time)
    {
      this.fxonDone();
      this.done = true;
    }
    ++ this.t;
    if (typeof(this.ds) == "function")
      this.s += this.ds(this.t);
    else
      this.s += this.ds;
    
    if (typeof(this.dth) == "function")
      this.th += this.dth(this.t);
    else
      this.th += this.dth;
    super.tick();
      
  }
}

export async function waitSpriteEffect( g, name, layer, x, y)
{
  let fx = new SpriteEffect(name, layer, g.xg(x + 0.5), g.yg(y + 0.5));
  while (fx.done == false)
  {
    fx.draw(g);
    fx.update();
    await waitTick();
  }
}
