import {PanelComponent, PanelType} from "./PanelComponent.js";


const EDGEW = 10


export class Panel
{

  // x,y: coordinates of top left of panel
  constructor( x, y, w, h, gridx, gridy, xalt, yalt )
  {
    this.x = x;
    this.y = y;
    this.xo = x;
    this.yo = y;

    this.body = {x: x + EDGEW, y:y+EDGEW};
    this.xa = xalt;
    this.ya = yalt;

    this.gx = gridx;
    this.gy = gridy;

    this.gsx = (w-2*EDGEW)/gridx;
    this.gsy = (h-2*EDGEW)/gridy;

    this.w = w;
    this.h = h;

    this.components = {};
  }

  // if useGrid: x,y are grid indices; sx,sy are the scale of the component.
  addComponent(comp, name, x, y, s = 1, sx = 1, sy = 1)
  {
    if (this.components[name] != undefined)
    {
      throw "component on panel already has this name!";
    }

    if (x >= this.gx || y >= this.gy)
    {
      throw "index out of bounds";
    }
    this.components[name] = 
      {
	comp: comp,
	x: this.gsx*x,
	y: this.gsy*y,
	sx: sx*this.gsx,
	sy: sy*this.gsy,
	s: s
      };

  }

  // the standard 3 (*2) line swap
  shift()
  {
    let xx = this.x;
    let yy = this.y;
    this.x = this.xa;
    this.y = this.ya;
    this.xa = xx;
    this.ya = yy;
    this.body = {x: this.x + EDGEW, y:this.y+EDGEW};
  }
  shiftOriginal()
  {
    if (this.xa == this.xo && this.ya == this.yo)
      this.shift();
  }
  shiftAlternate()
  {
    if (this.x == this.xo && this.y == this.yo)
      this.shift();
  }

  drawBase( g )
  {
    g.ctx[4].drawImage(g.Album.get("C_menutl"), this.x, this.y, EDGEW, EDGEW);
    g.ctx[4].drawImage(g.Album.get("C_menutr"), this.x+this.w-EDGEW, this.y, EDGEW, EDGEW);
    g.ctx[4].drawImage(g.Album.get("C_menubl"), this.x, this.y+this.h-EDGEW, EDGEW, EDGEW);
    g.ctx[4].drawImage(g.Album.get("C_menubr"), this.x+this.w-EDGEW, this.y+this.h-EDGEW, EDGEW, EDGEW);

    g.ctx[4].drawImage(g.Album.get("C_menuel"), this.x, this.y+EDGEW, EDGEW, this.h-2*EDGEW);
    g.ctx[4].drawImage(g.Album.get("C_menuer"), this.x+this.w-EDGEW, this.y+EDGEW, EDGEW, this.h-2*EDGEW);
    g.ctx[4].drawImage(g.Album.get("C_menuet"), this.x+EDGEW, this.y, this.w-2*EDGEW, EDGEW);
    g.ctx[4].drawImage(g.Album.get("C_menueb"), this.x+EDGEW, this.y+this.h-EDGEW, this.w-2*EDGEW, EDGEW);

    g.ctx[4].drawImage(g.Album.get("C_menucn"), this.x+EDGEW, this.y+EDGEW, this.w-2*EDGEW, this.h-2*EDGEW);
  }

  drawComp( g )
  {
    for (let o of Object.values(this.components))
    {
      o.comp.draw(g, this.body, o);
    }
  }

  draw(g)
  {
  }
  explicitDraw(g)
  {
    this.drawBase(g);
    this.drawComp(g);
  }
}


const OSCILLATION_AMT = 8;

class SelectionPointer
{
  constructor(sp)
  {
    this.panel = sp;
    this.x = sp.x + EDGEW;
    this.y = sp.y + EDGEW;
    this.xa = sp.xa + EDGEW;
    this.ya = sp.ya + EDGEW;
    
    this.offy = sp.components[sp.get().name].y;

    this.offx = 0;
    this.dx = 0.06;
  }
  updateY(y)
  {
    this.offy = y;
  }
  shift()
  {
    let xx = this.x;
    let yy = this.y;
    this.x = this.xa;
    this.y = this.ya;
    this.xa = xx;
    this.ya = yy;
  }
  update()
  {
    this.offx += this.dx;
    if (this.offx > 1 || this.offx < 0)
    {
      this.dx *= -1;
    }
  }
  draw(g)
  {
    g.ctx[5].drawImage(g.Album.get("C_ptr"), this.x - EDGEW + OSCILLATION_AMT*(this.offx- 2), this.y + this.offy);
  }
}


export class SelectionPanel extends Panel
{
  constructor( x, y, w, h, gridx, gridy, xalt, yalt, loopselector)
  {
    super(x, y, w, h, gridx, gridy, xalt, yalt);
    this._ls = loopselector;
    
    for (let i = 0; i < loopselector.length; ++i)
    {
      let action = loopselector.get().name;
      this.addComponent( new PanelComponent( PanelType.TEXT, action ), action, 0, i);
      loopselector.next();
    }

    this.ptr = new SelectionPointer(this);
  }
  update()
  {
    this.ptr.update();
  }
  drawComp(g)
  {
    g.setTextProperty(4, "#000000",  "11px ABCD Mono", "left");
    super.drawComp(g);
  }
  explicitDraw(g)
  {
    this.drawBase(g);
    let y = this.components[this.get().name].y;
    g.ctx[4].fillStyle = "#9eefff";
    g.ctx[4].fillRect(this.body.x, this.body.y + y + 3, this.w-2*EDGEW, 12)
    this.drawComp(g);
    this.draw(g);
  }
  draw(g)
  {
    this.ptr.draw(g);
  }
  shift()
  {
    super.shift();
    this.ptr.shift();
  }
  
  // functionality of *Selector here since no multiple inheritance
  next()
  {
    this._ls.next();
    this.ptr.updateY(this.components[this.get().name].y);
  }
  prev()
  {
    this._ls.prev();
    this.ptr.updateY(this.components[this.get().name].y);
  }
  get()
  {
      return this._ls.get();
  }
  reset()
  {
    this._ls.reset();
    this.ptr.updateY(this.components[this.get().name].y);
  }


}

const UMP_W = 192;
const UMP_H = 96;
const UMP_X = 0;
const UMP_XA = 512-UMP_W;
const UMP_Y = 0;

import {formattedHP} from "./Utils.js";

export class UnitMapPanel extends Panel
{
  constructor()
  {
    super(UMP_X, UMP_Y, UMP_W, UMP_H, 1, 1, UMP_XA, UMP_Y);
    this.addComponent(new PanelComponent(PanelType.ART , "P_gen"), "portrait", 3, 8);
    this.addComponent(new PanelComponent(PanelType.TEXT, "???"), "name", 80, 8);
    this.addComponent(new PanelComponent(PanelType.TEXT, "??/??"), "health", 80, 40);
    this.addComponent(new PanelComponent(PanelType.HEALTHBAR, 1), "healthbar", 80, 60, 1, 86, 10);
  }
  setInfo(unit)
  {
    this.components.portrait.comp.setData(unit.pArt);
    this.components.name.comp.setData(unit.name);
    this.components.health.comp.setData(formattedHP(unit.stats.hp, unit.stats.maxhp));
    this.components.healthbar.comp.setData(unit.stats.hp / unit.stats.maxhp);

  }
  addComponent(comp, name, x, y, s = 1, w = null, h = null)
  {
    this.components[name] = 
      {
	comp: comp,
	x: x,
	y: y,
	w: w,
	h: h,
	s: s
      };
  }
  drawComp( g )
  {
    g.setTextProperty(4, "#000000",  "11px ABCD Mono", "left");
    for (let o of Object.values(this.components))
    {
      o.comp.draw(g, this.body, o, false);
    }
  }
}
