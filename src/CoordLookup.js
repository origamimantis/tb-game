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
    this.sz = 0;
  }
  add(c, val = true)
  {
    if (val == undefined)
    {
      throw "Cannot set a value of undefined";
    }
    if (this.c_x[c.x] == undefined)
    {
      this.c_x[c.x] = {};
    }
    this.c_x[c.x][c.y] = val;
    ++ this.sz;
  }
  del(c)
  {
    if (this.c_x[c.x] != undefined)
    {
      delete this.c_x[c.x][c.y];
      -- this.sz;
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
    return this.sz;
  }
  *iter()
  {
    for (let x of Object.keys(this.c_x))
    {
      for (let y of Object.keys(this.c_x[x]))
      {
	yield new Coord(x, y);
      }
    }
  }

}


