import {Panel} from "./Panel.js";
import {Album} from "./Images.js";
import {waitTick,waitTime} from "./Utils.js";

export class MapHealthBar
{
  constructor(g, unit, color)
  {
    this.unit = unit;
    this.color = color
    this.maxhp = unit.stats.maxhp;
    this.hp = unit.stats.hp;

    this.off = 0.8;
    if (unit.y >= g.Map.max("y") - 1)
    {
      this.off = -0.5;
    }

    let c = g.camera.adjustedPos(unit);

    this.x = c.x*g.gx - 1.5*g.gx;
    this.y = c.y*g.gy + this.off*g.gy;
    this.w = 4*g.gx;
    this.h = 30;
    this.p = new Panel(this.x, this.y, this.w, this.h);

  }
  draw(g)
  {
    g.ctx[3].globalAlpha = 1;
    this.p.drawBase(g, 3);
    
    g.setTextProperty(3, "#000000", "11px ABCD Mono", "right");
    g.drawText(3, this.hp, this.x + g.gx - 4, this.y + 10);
    
    g.Album.drawHealthBar(3, this.hp / this.maxhp, this.x + g.gx, this.y + 10, 2.5*g.gx, 8, this.color);
  }
  update(g, hp)
  {
    if (hp === undefined)
      this.hp = this.unit.stats.hp;
    else
      this.hp = hp
  }
}

export class DoubleMapHealthBar
{
  constructor(g, u1, u2)
  {
    let c1 = g.camera.adjustedPos(u1).y;
    let c2 = g.camera.adjustedPos(u2).y;

    this.u1 = u1
    this.u2 = u2

    // u1 is on the left.
    // if vertical, u1 in on the top
    if (c1.x > c2.x || (c1.x == c2.x && c1.y > c2.y))
    {
      this.u1 = u2
      this.u2 = u1

      let t = c1
      c1 = c2
      c2 = t
    }

    this.hp1 = u1.stats.hp;
    this.hp2 = u2.stats.hp;
    this.maxhp1 = u1.stats.maxhp;
    this.maxhp2 = u2.stats.maxhp;


    // prefer to put at y=6
    // if units are not in row, y=6
    // otherwise, choose the unobstructed row but prefer y=7
    this.y;
    if (c1 != 6 && c2 != 6)
      this.y = 6;
    else if (c1 == 6)
    {
      if (c2 > 6)
	this.y = 5
      else
	this.y = 7
    }
    else if (c2 == 6)
    {
      if (c1 > 6)
	this.y = 5
      else
	this.y = 7
    }
    this.y = (this.y+0.05)*g.gy;
    this.w = 150;
    this.h = 0.90*g.gx;
    this.p1 = new Panel(g.windowx/2-this.w, this.y, this.w, this.h, undefined,undefined,0,0,4);
    this.p2 = new Panel(g.windowx/2, this.y, this.w, this.h, undefined,undefined,0,0,4);
  }
  async spawn(g)
  {
    this._1 = new Panel(g.windowx/2-this.w, 0, this.w, 0, undefined,undefined,0,0,4);
    this._2 = new Panel(g.windowx/2, 0, this.w, 0, undefined,undefined,0,0,4);
    this._n = 4
    for (let i = 1; i < this._n; ++i)
    {
      let h = i*this.h/this._n;
      let y = this.y + this.h - h;

      this._1.y = y;
      this._2.y = y;

      this._1.h = h;
      this._2.h = h;

      this._1.explicitDraw(g,3);
      this._2.explicitDraw(g,3);

      await waitTick();
    }
  }
  async despawn(g)
  {
    // do NOT call this before spawn()
    for (let i = this._n-1; i > 0; --i)
    {
      let h = i*this.h/this._n;
      let y = this.y + this.h - h;

      this._1.y = y;
      this._2.y = y;

      this._1.h = h;
      this._2.h = h;

      this._1.explicitDraw(g,3);
      this._2.explicitDraw(g,3);

      await waitTick();
    }

  }
  draw(g)
  {
    g.ctx[3].globalAlpha = 1;
    this.p1.drawBase(g, 3);
    this.p2.drawBase(g, 3);
    
    g.Album.drawHealthBar(3, this.hp1 / this.maxhp1, this.p1.x + g.gx-6, this.p1.y + 16, 3.5*g.gx+6,8,undefined);
    g.Album.drawHealthBar(3, this.hp2 / this.maxhp2, this.p2.x + g.gx-6, this.p2.y + 16, 3.5*g.gx+6,8,undefined);

    g.setTextProperty(3, "#000000", "11px ABCD Mono", "center");
    g.drawText(3, this.u1.name, this.p1.x + this.p1.w/2, this.p1.y + 5);
    g.drawText(3, this.u2.name, this.p2.x + this.p2.w/2, this.p2.y + 5);

    g.setTextProperty(3, "#000000", "11px ABCD Mono", "right");
    g.drawText(3, this.hp1, this.p1.x + g.gx - 10, this.p1.y + 16);
    g.drawText(3, this.hp2, this.p2.x + g.gx - 10, this.p2.y + 16);
  }
  update(g)
  {
    this.hp1 = this.u1.stats.hp;
    this.hp2 = this.u2.stats.hp;
  }
}
