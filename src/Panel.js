
const EDGEW = 10


export class Panel
{

  constructor( x, y, w, h, xalt, yalt )
  {
    this.x = x;
    this.y = y;
    this.xa = xalt;
    this.ya = yalt;
    this.w = w;
    this.h = h;
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
    g.ctx[3].drawImage(g.Album.get("C_menutl"), this.x, this.y, EDGEW, EDGEW);
    g.ctx[3].drawImage(g.Album.get("C_menutr"), this.x+this.w-EDGEW, this.y, EDGEW, EDGEW);
    g.ctx[3].drawImage(g.Album.get("C_menubl"), this.x, this.y+this.h-EDGEW, EDGEW, EDGEW);
    g.ctx[3].drawImage(g.Album.get("C_menubr"), this.x+this.w-EDGEW, this.y+this.h-EDGEW, EDGEW, EDGEW);

    g.ctx[3].drawImage(g.Album.get("C_menuel"), this.x, this.y+EDGEW, EDGEW, this.h-2*EDGEW);
    g.ctx[3].drawImage(g.Album.get("C_menuer"), this.x+this.w-EDGEW, this.y+EDGEW, EDGEW, this.h-2*EDGEW);
    g.ctx[3].drawImage(g.Album.get("C_menuet"), this.x+EDGEW, this.y, this.w-2*EDGEW, EDGEW);
    g.ctx[3].drawImage(g.Album.get("C_menueb"), this.x+EDGEW, this.y+this.h-EDGEW, this.w-2*EDGEW, EDGEW);

    g.ctx[3].drawImage(g.Album.get("C_menucn"), this.x+EDGEW, this.y+EDGEW, this.w-2*EDGEW, this.h-2*EDGEW);
  }





}
