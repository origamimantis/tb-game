import {Panel} from "./Panel.js";

export class MapHealthBar
{
  constructor(g, unit)
  {
    this.unit = unit;
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
    
    g.Album.drawHealthBar(3, this.hp / this.maxhp, this.x + g.gx, this.y + 10, 2.5*g.gx, 10);
  }
  update(g)
  {
    this.hp = this.unit.stats.hp;
  }
}
