import {PanelComponent, PanelType} from "./PanelComponent.js";
import {Album} from "./Images.js";


const EDGEW = 10


export class Panel
{

  // x,y: coordinates of top left of panel
  constructor( x, y, w, h, gridx, gridy, xalt, yalt, edgew)
  {
    this.x = x;
    this.y = y;
    this.xo = x;
    this.yo = y;

    if (edgew === undefined)
      edgew = EDGEW
    this.edgew = edgew

    this.body = {x: x + this.edgew, y:y+this.edgew};
    this.xa = xalt;
    this.ya = yalt;

    if (gridx === undefined)
      this.gx = (w-2*this.edgew);
    else
      this.gx = gridx;
    
    if (gridy === undefined)
      this.gy = (h-2*this.edgew);
    else
      this.gy = gridy;

    this.gsx = (w-2*this.edgew)/this.gx;
    this.gsy = (h-2*this.edgew)/this.gy;

    this.w = w;
    this.h = h;

    this.innerw = w-2*this.edgew
    this.innerh = h-2*this.edgew

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
      throw "component on panel already has this name! " + name;
    }

    if (x >= this.gx || y >= this.gy)
    {
      //throw "index out of bounds";
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
    this.body = {x: this.x + this.edgew, y:this.y+this.edgew};
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
    g.ctx[ctx].drawImage(Album.get("C_menutl"), this.x, this.y, this.edgew, this.edgew);
    g.ctx[ctx].drawImage(Album.get("C_menutr"), this.x+this.w-this.edgew, this.y, this.edgew, this.edgew);
    g.ctx[ctx].drawImage(Album.get("C_menubl"), this.x, this.y+this.h-this.edgew, this.edgew, this.edgew);
    g.ctx[ctx].drawImage(Album.get("C_menubr"), this.x+this.w-this.edgew, this.y+this.h-this.edgew, this.edgew, this.edgew);

    g.ctx[ctx].drawImage(Album.get("C_menuel"), this.x, this.y+this.edgew, this.edgew, this.h-2*this.edgew);
    g.ctx[ctx].drawImage(Album.get("C_menuer"), this.x+this.w-this.edgew, this.y+this.edgew, this.edgew, this.h-2*this.edgew);
    g.ctx[ctx].drawImage(Album.get("C_menuet"), this.x+this.edgew, this.y, this.w-2*this.edgew, this.edgew);
    g.ctx[ctx].drawImage(Album.get("C_menueb"), this.x+this.edgew, this.y+this.h-this.edgew, this.w-2*this.edgew, this.edgew);

    g.ctx[ctx].drawImage(Album.get("C_menucn"), this.x+this.edgew, this.y+this.edgew, this.w-2*this.edgew, this.h-2*this.edgew);
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
  constructor(sp, xoff = 0, edgew=EDGEW)
  {
    if (edgew === undefined)
      edgew = EDGEW
    this.edgew = edgew;

    this.setTarget(sp, xoff);
  }
  setTarget(sp, xoff = 0)
  {
    this.panel = sp;
    this.x = sp.x + this.edgew + xoff;
    this.y = sp.y + this.edgew;
    this.xa = sp.xa + this.edgew + xoff;
    this.ya = sp.ya + this.edgew;
    
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
    g.ctx[ctx].drawImage(Album.get("C_ptr"), this.x - this.edgew + OSCILLATION_AMT*(this.offx- 2), this.y + this.offy);
  }
}


export class SelectionPanel extends Panel
{
  constructor( x, y, w, h, gridx, gridy, xalt, yalt, loopselector, grayFunction =(i)=>{return false})
  {
    super(x, y, w, h, gridx, gridy, xalt, yalt);
    this._ls = loopselector;
    this.grayF = grayFunction;
    
    this._loadStuff();

    this.ptr = new SelectionPointer(this);
    this.updateY();
  }
  _loadStuff()
  {
    for (let i = 0; i < this._ls.length; ++i)
    {
      let thing = this._ls.list[i];
      let action = (thing !== null) ? thing.name : "";
      this.addComponent( new PanelComponent( PanelType.TEXT, action ), i, 0, i,
			 (this.grayF(thing))?"#880000":"#000000", "11px ABCD Mono", "left")
    }
  }
  resetLoopSelector(loopselector)
  {
    this._ls = loopselector;
    this.components = {};
    
    this._loadStuff();
  }

  nonempty()
  {
    return (this._ls.length > 0);
  }
  update()
  {
    this.ptr.update();
  }
  updateX(ptr = this.ptr)
  {
    ptr.x = this.x + this.edgew;
  }
  updateY(ptr = this.ptr)
  {
    let cmp = this.components[this.idx()];
    if (cmp !== undefined)
      ptr.updateY(cmp.y);
    else
      ptr.updateY(0);
  }
  drawComp(g)
  {
    super.drawComp(g);
  }
  explicitDraw(g, ctx = 4, fill = true, selected = null)
  {
    this.drawBase(g, ctx);
    if (fill)
    {
      g.ctx[4].fillStyle = "#9eefff";
      if (selected == null)
      {
	let y = this.components[this.idx()];
	if (y !== undefined)
	  y = y.y;
	else
	  y = 0;
	g.ctx[4].fillRect(this.body.x, this.body.y + y + 3, this.w-2*this.edgew, 12)
      }
      else
      {
	for (let i of selected)
	{
	  let y = this.components[i];
	  if (y)
	    g.ctx[4].fillRect(this.body.x, this.body.y + y.y + 3, this.w-2*this.edgew, 12)
	}
      }
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
  constructor( x, y, w, h, gridx, gridy, loopselector, artPrefix, amtFunction, grayFunction = (i)=>{return false})
  {
    super(x, y, w, h, gridx, gridy, null, null, loopselector, grayFunction);

    this.artP = artPrefix;
    this.amtF = amtFunction;

    this._loadItems();
  }
  _loadItems()
  {
    for (let i = 0; i < this._ls.length; ++i)
    {
      let item = this._ls.list[i];
      this.components[i].x += 24;

      if (item !== null)
      {
	this.addComponent( new PanelComponent( PanelType.ART, this.artP + item.constructor.name ),
			   "a" + i, 0, i, 1, 16, 16);

	this.addComponent( new PanelComponent( PanelType.TEXT, this.amtF(item) ),
			   "t" + i, 0, i, (this.grayF(item))?"#880000":"#000000", "11px ABCD Mono", "right")
	this.components["t" + i].x = this.w - 2*this.edgew;
      }
    }
  }
  resetLoopSelector(loopselector)
  {
    super.resetLoopSelector(loopselector);
    this._loadItems();

  }
}

export class UnitProfileStatPanel extends Panel
{
  constructor( x, y, w, h, text )
  {
    super(x, y, w, h);
    this.text = text;
  }
  explicitDraw(g, ctx)
  {
    this.drawBase(g, ctx);
    g.setTextProperty(ctx, "black", "16.5px ABCD Mono", "left");
    g.drawText(ctx, this.text, this.x + 15, this.y + 15);
  }
}

import {BattleInfo} from "./Battle.js";
export class BattlePreviewPanel extends Panel
{
  constructor(g, left, right)
  {
    let x = 30;
    let y = 80;
    let w = 180
    super(x, y, w, 170, 1,1, 512 - x - w, y);
    this.left = new BattleInfo(left, null, g, null);
    this.right = new BattleInfo(right, null, g, null);
  }
  explicitDraw(g, ctx)
  {
    this.drawBase(g, ctx);
    g.setTextProperty(ctx, "black", "11px ABCD Mono", "center");

    this.drawCentered(g, ctx, this.left.name, -50, 0);
    this.drawCentered(g, ctx, this.right.name, 50, 0);

    this.drawCentered(g, ctx, "HP", 0, 20);
    this.drawCentered(g, ctx, this.left.stats.hp, -50, 20);
    this.drawCentered(g, ctx, this.right.stats.hp, 50, 20);

    this.drawCentered(g, ctx, "Atk", 0, 40);
    this.drawCentered(g, ctx, this.left.stats.atk, -50, 40);
    this.drawCentered(g, ctx, this.right.stats.atk, 50, 40);

    this.drawCentered(g, ctx, "Def", 0, 60);
    this.drawCentered(g, ctx, this.left.stats.def, -50, 60);
    this.drawCentered(g, ctx, this.right.stats.def, 50, 60);

    this.drawCentered(g, ctx, "Hit", 0, 80);
    this.drawCentered(g, ctx, this.left.dispHit(this.right), -50, 80);
    this.drawCentered(g, ctx, this.right.dispHit(this.left), 50, 80);

    this.drawCentered(g, ctx, "Crt", 0, 100);
    this.drawCentered(g, ctx, this.left.dispCrt(this.right), -50, 100);
    this.drawCentered(g, ctx, this.right.dispCrt(this.left), 50, 100);

    this.drawCentered(g, ctx, "Spd", 0, 120);
    this.drawCentered(g, ctx, this.left.stats.spd, -50, 120);
    this.drawCentered(g, ctx, this.right.stats.spd, 50, 120);

  }
  drawCentered(g, ctx, text, x, y)
  {
    g.drawText(ctx, text, this.x + this.w/2 + x, this.y + this.edgew + 5 + y);
  }
}
export class TooltipWeaponPanel extends Panel
{
  constructor( )
  {
    super(94, 270, 402, 100);
    this.fontsize = "16.5"
  }
  explicitDraw(g, ctx, w)
  {
    this.drawBase(g, ctx);
    g.setTextProperty(ctx, "black", this.fontsize+"px ABCD Mono", "left");
    g.drawText(ctx, `Power ${w.pow}   Hit ${w.hit}   Crit ${w.crt}`, this.x + 15, this.y + 15);
    if (w.tooltip !== undefined)
      g.drawText(ctx, "\n" + w.tooltip, this.x + 15, this.y + 15);
  }
}
export class TooltipItemPanel extends Panel
{
  constructor( )
  {
    super(94, 270, 402, 100);
    this.fontsize = "16.5"
  }
  explicitDraw(g, ctx, i)
  {
    let font = this.fontsize + "px ABCD Mono"
    this.drawBase(g, ctx);
    g.setTextProperty(ctx, "black", font, "left");
    g.drawText(ctx, i.tooltip, this.x + 15, this.y + 15);
  }
}
export class UnitProfileItemPanel extends Panel
{
  constructor( x, y, w, h, loopselector, artPrefix, amtFunction, grayFunction = (i)=>{return false})
  {
    super(x, y, w, h);
    this._ls = loopselector;
    this.artP = artPrefix;
    this.amtF = amtFunction;
    this.grayF = grayFunction;
    
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
    g.setTextFont(ctx, "16.5px ABCD Mono");
    let l = this._ls.list;
    for (let i = 0; i < l.length; ++i)
    {
      g.setTextColor(ctx, this.grayF(l[i])?"#880000":"#000000");
      g.setTextJustify(ctx, "left");
      g.drawImage(ctx, this.artP + l[i].constructor.name , this.x + 32, this.y + 14 + 24*i, 16, 16);
      g.drawText(ctx, l[i].name, this.x + 54, this.y + 16 + 24*i);
      g.setTextJustify(ctx, "right");
      g.drawText(ctx, this.amtF(l[i]), this.x + this.w - 32 , 56 + 24*i);
    }
    g.setTextColor(ctx, "#000000");
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
      o.comp.draw(g, this.body, o);
    }
  }
}
