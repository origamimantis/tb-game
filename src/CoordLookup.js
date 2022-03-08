"use strict";

// lookup (x,y) : O(1)
// add: O(1)
// del: O(1)

import {Coord} from "./Path.js";


export class CoordLookup
{
  constructor()
  {
    this.c_x = {};
    this.length = 0;
  }
  add(c, val = true)
  {
    if (val == undefined)
    {
      throw "Cannot set a value of undefined";
    }
    else if (this.c_x[c.x] == undefined)
    {
      this.c_x[c.x] = {};
    }
    this.c_x[c.x][c.y] = val;
    ++ this.length;
  }
  del(c)
  {
    if (this.c_x[c.x] != undefined)
    {
      delete this.c_x[c.x][c.y];
      -- this.length;
    }
    else
    {
      throw "Attempted to delete nonexistent coordinate (" + c.x + ", " + c.y + ")";
    }
  }
  get(c)
  {
    if (this.c_x[c.x] == undefined)
    {
      return undefined;
    }
    return this.c_x[c.x][c.y];
  }
  contains(c)
  {
    if (this.c_x[c.x] == undefined || this.c_x[c.x][c.y] == undefined)
    {
      return false;
    }
    return true;
  }
  doesNotContain(c)
  {
    return this.contains(c) == false;
  }
  
  size()
  {
    return this.length;
  }
  *[Symbol.iterator]()
  {
    for (let x of Object.keys(this.c_x))
    {
      for (let y of Object.keys(this.c_x[x]))
      {
	yield new Coord(parseInt(x), parseInt(y));
      }
    }
  }

}

const FRAMES_TO_MAX = 90;
const ALPHA_MAX = 0.2;
export class MapCoordBlob extends CoordLookup
{

  constructor()
  {
    super();
  }
  setArt( art )
  {
    this.art_counter = 0;
    this.drawArt = art;
    this.drawframe = 0;
    this.drawdelta = 1;
    this.drawtimer = 0;
  }
  draw(g)
  {
    let img = g.Album.get(this.drawArt);

    let off = g.camera.getOffset();
    let alph = ALPHA_MAX*Math.abs(FRAMES_TO_MAX - g.counter%(2*FRAMES_TO_MAX)) / FRAMES_TO_MAX;
    g.ctx[1].fillStyle = "#ffffff";
    for (let c of this)
    {
      if (g.camera.visible(c))
      {
        let x = (c.x - off.x)*g.gx;
        let y = (c.y - off.y)*g.gy;

        g.ctx[1].drawImage( img, x, y, g.gx, g.gy);

        g.ctx[1].globalAlpha = alph;
        g.ctx[1].fillRect(x, y, g.gx - 1, g.gy - 1);
        g.ctx[1].globalAlpha = 1;
      }
    }

    if (this.drawframe >= FRAMES_TO_MAX)
    {
      this.drawdelta = -1;
    }
    if (this.drawframe <= 0)
    {
      this.drawdelta = 1;
    }
  }
  toArray()
  {
    let t = [];
    for (let c of this)
    {
      t.push(c);
    }
    return t;
  }
}


