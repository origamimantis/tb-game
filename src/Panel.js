import {PanelComponent, PanelType} from "./PanelComponent.js";


const EDGEW = 10


export class Panel
{

  constructor( x, y, w, h, gridx, gridy, xalt, yalt )
  {
    this.x = x;
    this.y = y;
    this.xa = xalt;
    this.ya = yalt;

    this.gx = gridx;
    this.gy = gridy;

    this.gsx = w/gridx;
    this.gsy = h/gridy;

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
  }

  draw( g )
  {
    g.ctx[3].drawImage(g.Album.get("C_menutl"), this.x - EDGEW, this.y - EDGEW, EDGEW, EDGEW);
    g.ctx[3].drawImage(g.Album.get("C_menutr"), this.x+this.w, this.y - EDGEW, EDGEW, EDGEW);
    g.ctx[3].drawImage(g.Album.get("C_menubl"), this.x - EDGEW, this.y+this.h, EDGEW, EDGEW);
    g.ctx[3].drawImage(g.Album.get("C_menubr"), this.x+this.w, this.y+this.h, EDGEW, EDGEW);

    g.ctx[3].drawImage(g.Album.get("C_menuel"), this.x - EDGEW, this.y, EDGEW, this.h);
    g.ctx[3].drawImage(g.Album.get("C_menuer"), this.x+this.w, this.y, EDGEW, this.h);
    g.ctx[3].drawImage(g.Album.get("C_menuet"), this.x, this.y - EDGEW, this.w, EDGEW);
    g.ctx[3].drawImage(g.Album.get("C_menueb"), this.x, this.y+this.h, this.w, EDGEW);

    g.ctx[3].drawImage(g.Album.get("C_menucn"), this.x, this.y, this.w, this.h);


    for (let o of Object.values(this.components))
    {
      o.comp.draw(g, this, o);
    }
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
  }
  draw(g)
  {
    super.draw(g);
    let sel = this.components[this._ls.get().name]
    sel.comp.draw(g, {x:this.x + 1, y:this.y}, sel);
  }

}
