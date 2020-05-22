import {PanelComponent, PanelType} from "./PanelComponent.js";


const EDGEW = 10


export class Panel
{

  // x,y: coordinates of top left of panel
  constructor( x, y, w, h, gridx, gridy, xalt, yalt )
  {
    this.x = x;
    this.y = y;
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

  addComponent(comp, name, x, y, sx = 1, sy = 1)
  {
    if (x >= this.gx || y >= this.gy)
    {
      throw "index out of bounds";
    }
    if (this.components[name] != undefined)
    {
      throw "component on panel already has this name!";
    }
    this.components[name] = 
      {
	comp: comp,
	x: this.gsx*x,
	y: this.gsy*y,
	sx: sx*this.gsx,
	sy: sy*this.gsy
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
    this.dx = 0.05;
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
    g.ctx[4].drawImage(g.Album.get("C_ptr"), this.x - EDGEW + OSCILLATION_AMT*(this.offx- 2), this.y + this.offy);
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
      this.addComponent( new PanelComponent( PanelType.TEXT, action ), action, 0, i);;
      loopselector.next();
    }

    this.ptr = new SelectionPointer(this);
  }
  update()
  {
    this.ptr.update();
  }
  draw(g)
  {
    this.drawBase(g);
    let y = this.components[this.get().name].y;
    g.ctx[4].fillStyle = "#9eefff";
    g.ctx[4].fillRect(this.body.x, this.body.y + y + 3, this.w-2*EDGEW, 12)
    this.drawComp(g);
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
