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

    if (gridx === undefined)
      this.gx = (w-2*EDGEW);
    else
      this.gx = gridx;
    
    if (gridy === undefined)
      this.gy = (h-2*EDGEW);
    else
      this.gy = gridy;

    this.gsx = (w-2*EDGEW)/this.gx;
    this.gsy = (h-2*EDGEW)/this.gy;

    this.w = w;
    this.h = h;

    this.components = {};
  }
  createComponent(type, data, name, x, y, s = 1, sx = 1, sy = 1)
  {
    this.addComponent(new PanelComponent(type, data), name, x, y, s, sx, sy);
  }

  // if useGrid: x,y are grid indices; w, h are width, height
  addComponent(comp, name, x, y, s = 1, w = 1, h = 1)
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
	s: s, // TEXT: color
	w: w, // TEXT: font
	h: h  // TEXT: justify
      };

  }
  setComponentData(name, arg)
  {
    this.components[name].comp.setData(arg);
  }
 
  getComponent(name)
  {
    return this.components[name].comp;
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

  drawBase( g, ctx)
  {
    g.ctx[ctx].drawImage(g.Album.get("C_menutl"), this.x, this.y, EDGEW, EDGEW);
    g.ctx[ctx].drawImage(g.Album.get("C_menutr"), this.x+this.w-EDGEW, this.y, EDGEW, EDGEW);
    g.ctx[ctx].drawImage(g.Album.get("C_menubl"), this.x, this.y+this.h-EDGEW, EDGEW, EDGEW);
    g.ctx[ctx].drawImage(g.Album.get("C_menubr"), this.x+this.w-EDGEW, this.y+this.h-EDGEW, EDGEW, EDGEW);

    g.ctx[ctx].drawImage(g.Album.get("C_menuel"), this.x, this.y+EDGEW, EDGEW, this.h-2*EDGEW);
    g.ctx[ctx].drawImage(g.Album.get("C_menuer"), this.x+this.w-EDGEW, this.y+EDGEW, EDGEW, this.h-2*EDGEW);
    g.ctx[ctx].drawImage(g.Album.get("C_menuet"), this.x+EDGEW, this.y, this.w-2*EDGEW, EDGEW);
    g.ctx[ctx].drawImage(g.Album.get("C_menueb"), this.x+EDGEW, this.y+this.h-EDGEW, this.w-2*EDGEW, EDGEW);

    g.ctx[ctx].drawImage(g.Album.get("C_menucn"), this.x+EDGEW, this.y+EDGEW, this.w-2*EDGEW, this.h-2*EDGEW);
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
  explicitDraw(g, ctx = 4)
  {
    this.drawBase(g, ctx);
    this.drawComp(g);
  }
}



const OSCILLATION_AMT = 8;

export class SelectionPointer
{
  constructor(sp, xoff = 0)
  {
    this.panel = sp;
    this.x = sp.x + EDGEW + xoff;
    this.y = sp.y + EDGEW;
    this.xa = sp.xa + EDGEW + xoff;
    this.ya = sp.ya + EDGEW;
    
    this.offy = 0;

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
  draw(g, ctx = 5)
  {
    g.ctx[ctx].drawImage(g.Album.get("C_ptr"), this.x - EDGEW + OSCILLATION_AMT*(this.offx- 2), this.y + this.offy);
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
      let action = loopselector.list[i].name;
      this.addComponent( new PanelComponent( PanelType.TEXT, action ), i, 0, i,
			 "#000000",  "11px ABCD Mono", "left");
    }

    this.ptr = new SelectionPointer(this);
    this.updateY();
  }
  nonempty()
  {
    return (this._ls.length > 0);
  }
  update()
  {
    this.ptr.update();
  }
  updateY()
  {
    let cmp = this.components[this.idx()];
    if (cmp !== undefined)
      this.ptr.updateY(cmp.y);
    else
      this.ptr.updateY(0);
  }
  drawComp(g)
  {
    super.drawComp(g);
  }
  explicitDraw(g, ctx = 4, fill = true)
  {
    this.drawBase(g, ctx);
    if (fill)
    {
      let y = this.components[this.idx()];
      if (y !== undefined)
	y = y.y;
      else
	y = 0;
      g.ctx[4].fillStyle = "#9eefff";
      g.ctx[4].fillRect(this.body.x, this.body.y + y + 3, this.w-2*EDGEW, 12)
    }
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
    this.updateY();
  }
  prev()
  {
    this._ls.prev();
    this.updateY();
  }
  get()
  {
    return this._ls.get();
  }
  idx()
  {
    return this._ls.idx;
  }
  setIdx(i)
  {
    this._ls.idx = i;
  }
  reset()
  {
    this._ls.reset();
    this.updateY();
  }
}

export class ItemPanel extends SelectionPanel
{
  constructor( x, y, w, h, gridx, gridy, loopselector, artPrefix, amtFunction)
  {
    super(x, y, w, h, gridx, gridy, null, null, loopselector);

    for (let i = 0; i < this._ls.length; ++i)
    {
      let item = this._ls.list[i];
      this.components[i].x += 24;

      this.addComponent( new PanelComponent( PanelType.ART, artPrefix + item.constructor.name ),
			 "a" + i, 0, i, 1, 16, 16);

      this.addComponent( new PanelComponent( PanelType.TEXT, amtFunction(item) ),
			 "t" + i, 0, i, "#000000", "11px ABCD Mono", "right")
      this.components["t" + i].x = w - 2*EDGEW;
    }

    this.artP = artPrefix;
    this.amtF = amtFunction;
  }
}

export class UnitProfileItemPanel extends Panel
{
  constructor( x, y, w, h, loopselector, artPrefix, amtFunction)
  {
    super(x, y, w, h);
    this._ls = loopselector;
    this.artP = artPrefix;
    this.amtF = amtFunction;
    
    this.ptr = new SelectionPointer(this, 16);
    this.ptr.updateY(0);
  }
  nonempty()
  {
    return (this._ls.length > 0);
  }
  shift(){}
  update()
  {
    this.ptr.update();
  }
  explicitDraw(g, ctx, eqIdx, drawSelection)
  {
    this.drawBase(g, ctx);
    if (drawSelection)
    {
      g.ctx[ctx].fillStyle = "#9eefff";
      g.ctx[ctx].fillRect(this.x + 20, this.y + 14 + 24*this._ls.idx, this.w-40, 16)
    }
    g.setTextJustify(ctx, "left");
    if (eqIdx != -1)
    {
      g.drawOutlinedText(ctx, "E", this.x + this.w - 24, 58 + 24 * eqIdx,
	"11px ABCD Mono Bold", "#4bdfcf","#000000");
    }
    g.setTextColor(ctx, "#000000");
    g.setTextFont(ctx, "16.5px ABCD Mono");
    let l = this._ls.list;
    for (let i = 0; i < l.length; ++i)
    {
      g.setTextJustify(ctx, "left");
      g.drawImage(ctx, this.artP + l[i].constructor.name , this.x + 32, this.y + 14 + 24*i, 16, 16);
      g.drawText(ctx, l[i].name, this.x + 54, this.y + 16 + 24*i);
      g.setTextJustify(ctx, "right");
      g.drawText(ctx, this.amtF(l[i]), this.x + this.w - 32 , 56 + 24*i);
    }
  }
  draw(g, ctx)
  {
    this.ptr.draw(g, ctx);
  }
  
  // functionality of *Selector here since no multiple inheritance
  next()
  {
    this._ls.next();
    this.ptr.updateY(24*this._ls.idx);
  }
  prev()
  {
    this._ls.prev();
    this.ptr.updateY(24*this._ls.idx);
  }
  get()
  {
    return this._ls.get();
  }
  reset()
  {
    this._ls.reset();
    this.ptr.updateY(0);
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
    this.setComponentData("portrait", unit.pArt);
    this.setComponentData("name", unit.name);
    this.setComponentData("health", "HP " + formattedHP(unit.stats.hp, unit.stats.maxhp));
    this.setComponentData("healthbar", unit.stats.hp / unit.stats.maxhp);

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
