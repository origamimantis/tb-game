import {SpriteEffect} from "./Effects.js"

export class WSProjectile
{
  constructor(x, y, dist, sprite)
  {
    this.set(x, y, dist, sprite)
  }
  set(x, y, dist, sprite, details)
  {
    this.spr = sprite;
    this.x = x;
    this.y = y;
    this.v = 15;
    this.d = dist;
    this.hitAttempted = false;
    this.gonnaDie = false;
    this.framesLeft = -1;
    this.t = 0;

    if (details !== undefined)
    {
      this.img = details.img;
    }

    this._init();
  }
  draw(g)
  {
    g.drawImage(3, this.img, this.x, this.y);
  }
  _init() // override for different movements
  {
  }
  _update() // override for different movements
  {
    // default straight line
    this.x += this.v;
    this.d-= this.v;
  }
  update()
  {
    this._update();
    ++ this.t;
    if (this.d < 0 && this.hitAttempted == false)
    {
      this.hitAttempted = true;
      this.onCollideResolve();
    }
    if (this.gonnaDie)
    {
      -- this.framesLeft;
      if (this.framesLeft <= 0)
      {
	this.selfInstantDelete();
      }
    }
  }
  selfInstantDelete()
  {
    this.spr.proj = undefined;
    this._f();
  }
  selfTimedDelete()
  {
    this.framesLeft = 15;
    this.gonnaDie = true;
  }
  setOnFinish(f)
  {
    this._f = f;
  }
}
export class WSEffect
{
  constructor(x, y, dist, sprite)
  {
    this.spr = sprite;
    this.x = x;
    this.y = y;
    this.d = dist;
    this.t = 0;
    this.hitAttempted = false;
  }
  set(x, y, dist, sprite, details)
  {
    this.spr = sprite;
    this.fxDone = false;
    this.fx = new SpriteEffect(details.fxname, 3, x, y, ()=>{this.fxDone = true});
    this.x = x;
    this.y = y;
    this.d = dist;
    this.t = 0;
    this.hitAttempted = false;
    this.fuh = details.framesUntilHit;
    this._init();
  }
  draw(g)
  {
    this.fx.draw(g, this.x, this.y);
  }
  _init() // override for different movements
  {
  }
  update()
  {
    this.fx.update();

    ++ this.t;
    if (this.t > this.fuh && this.hitAttempted == false)
    {
      this.hitAttempted = true;
      this.onCollideResolve();
    }
    if (this.fxDone == true)
    {
      this._f();
      this.spr.proj = undefined;
    }
  }
  // duck typing, does nothing since deletes at end of animation
  selfInstantDelete()
  {
  }
  selfTimedDelete()
  {
  }
  setOnFinish(f)
  {
    this._f = f;
  }
}
