import {Panel} from "./Panel.js";
import {Album} from "./Images.js";
import {waitTick,waitTime} from "./Utils.js";

export class MapHealthBarBase
{
  constructor(g, u, initialDraw = false)
  {
    this.u = u
    this.isAnim = !initialDraw

    this.hp = u.stats.hp;
    this.maxhp = u.stats.maxhp;
  }
  setprops(x,y,w,h,e=4)
  {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
    this.e = e
    this.p = new Panel(this.x, this.y, this.w, this.h, undefined,undefined,0,0,this.e);
  }
  async spawn(g)
  {
    if (this._1 === undefined)
      this._1 = new Panel(this.x, undefined, this.w, undefined, undefined,undefined,0,0,this.e);

    this._n = 4
    this.isAnim = true

    for (let i = 1; i < this._n; ++i)
    {
      let h = i*this.h/this._n;
      let y = this.y + this.h - h;

      this._1.y = y;

      this._1.h = h;

      //this._1.explicitDraw(g,3);

      await waitTick();
    }
    this.isAnim = false;
  }
  async despawn(g)
  {
    this.isAnim = true
    // do NOT call this before spawn()
    for (let i = this._n-1; i > 0; --i)
    {
      let h = i*this.h/this._n;
      let y = this.y + this.h - h;

      this._1.y = y;

      this._1.h = h;

  //    this._1.explicitDraw(g,3);

      await waitTick();
    }
    this._1.y = undefined
    this._1.h = undefined;
  }
  draw(g)
  {
    g.ctx[3].globalAlpha = 1;
    if (this.isAnim == false)
    {
      this.p.drawBase(g, 3);
      
      g.Album.drawHealthBar(3, this.hp / this.maxhp, this.p.x + g.gx-6, this.p.y + 16, this.w - g.gx,8,undefined);

      g.setTextProperty(3, "#000000", "11px ABCD Mono", "center");
      g.drawText(3, this.u.name, this.p.x + this.p.w/2, this.p.y + 5);

      g.setTextProperty(3, "#000000", "11px ABCD Mono", "right");
      g.drawText(3, this.hp, this.p.x + g.gx - 10, this.p.y + 16);
    }
    else
    {
      this._1.explicitDraw(g,3);
    }
  }
  update(g)
  {
    this.hp = this.u.stats.hp;
  }
}

export class MapHealthBar extends MapHealthBarBase
{
  constructor(g, unit, color)
  {
    super(g, unit, false)

    this.color = color

    let h = 30;
    let w = 4;

    let cam = g.camera;
    let c = cam.adjustedPos(unit);

    let offy = 1.05;
    if (c.y + offy + h/g.gy >= cam.wsize.y)
      offy = -h/g.gy - 0.05

    let offx = 0;
    if (c.x+0.5-w/2 < 0)
      offx = w/2-0.5-c.x
    else if (c.x+0.5+w/2 >= cam.wsize.x)
      offx = cam.wsize.x - w/2-0.5-c.x

    this.setprops(
	  (c.x + 0.5 - w/2 + offx)*g.gx,
	  c.y*g.gy + offy*g.gy,
	  w*g.gx,
	  h
    );
  }
}

export class DoubleMapHealthBar
{
  constructor(g, u1, u2)
  {
    let c1 = g.camera.adjustedPos(u1);
    let c2 = g.camera.adjustedPos(u2);

    this.u1 = u1
    this.u2 = u2

    // u1 is on the left.
    // if vertical, u1 in on the top
    if (c1.x > c2.x || (c1.x == c2.x && c1.y > c2.y))
    {
      this.u1 = u2
      this.u2 = u1

      // swap c1,c2
      let t = c1; c1 = c2; c2 = t
    }

    this.p1 = new MapHealthBarBase(g, this.u1, false)
    this.p2 = new MapHealthBarBase(g, this.u2, false)

    // prefer to put at y=6
    // if units are not in row, y=6
    // otherwise, choose the unobstructed row but prefer y=7
    let w = 150;
    let h = 0.90*g.gx;
    let y;
    if (c1.y != 6 && c2.y != 6)
      y = 6;
    else if (c1.y == 6)
    {
      if (c2.y > 6)
	y = 5
      else
	y = 7
    }
    else if (c2.y == 6)
    {
      if (c1.y > 6)
	y = 5
      else
	y = 7
    }
    y = (y+0.05)*g.gy;

    this.p1.setprops(g.windowx/2-w, y, w, h)
    this.p2.setprops(g.windowx/2,   y, w, h)
  }
  async spawn(g)
  {
    await Promise.all([this.p1.spawn(g), this.p2.spawn(g)])
  }
  async despawn(g)
  {
    let a = this.p1.despawn(g)
    let b = this.p2.despawn(g)
    await Promise.all([a,b])
  }
  draw(g)
  {
    this.p1.draw(g);
    this.p2.draw(g);
  }
  update(g)
  {
    this.p1.update(g);
    this.p2.update(g);
  }
}
