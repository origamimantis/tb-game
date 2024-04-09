import {SpriteEffect} from "./Effects.js"
import {Album} from "./Images.js"

export class WSProjectile
{
  constructor(x, y, dist, sprite)
  {
    this.set(x, y, dist, sprite)
  }
  set(x, y, dist, sprite, details)
  {
    this.spr = sprite;
    console.log(sprite)
    this.state = sprite?.outcome
    this.deleteOnHit = true;
    this.x = x;
    this.y = y;
    this.v = 15;
    this.a = 0;
    this.d = dist;
    this.hitAttempted = false;
    this.gonnaDie = false;
    this.framesLeft = -1;
    // tt can be edited to reset animations
    this.t = 0;
    this.tt = 0;

    this.w=0;
    this.h=0;
    if (details !== undefined)
    {
      this.img = details.img;
      this.w = Album.images[this.img].width
      this.h = Album.images[this.img].height
    }

    this._init();
  }
  draw(g)
  {
    if (this.a == 0)
      g.drawImage(3, this.img, this.x, this.y);
    else
      // rotate from image center (x/2, y/2)
      g.applyAngle(3, this.x + this.w/2, this.y + this.h/2, this.a,
	()=> { g.drawImage(3, this.img, this.x, this.y); }
      );
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
    ++ this.tt;
    if (this.d < 0 && this.hitAttempted == false)
    {
      this.hitAttempted = true;
      this.onCollideResolve();
      
      if (this._onHit() !== undefined)
	this._onHit()
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
    this.state = this.spr.state
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
    this.tt = 0;
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
    ++ this.tt;
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
