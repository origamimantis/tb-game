'use strict';

import {TILES} from "./Constants.js";
import {Coord} from "./Path.js";
import {triggerEvent} from "./Utils.js";
import {Album} from "./Images.js";


class Tile
{
    constructor( tm, tile)
    {
	this.tile = tm.typeMap[tile];;
	this.unit = null;
	this.art = tm.artMap[tile];
    }
}


export class TileMap
{
  constructor()
  {
    this.map = [];
    this.dimension = {"y":undefined, "x":undefined};
    this.bounds = {max:{}, min:{}};
    this.artMap = {};
    this.typeMap = {};
    
    this.pather = [];
    this.pRestore = [];
  }
  generate( text )
  {
    let lines = text.split("\n");
    
    // last line is empty - let's get rid of it
    lines.pop()
    
    this.setDimension(lines[0].trim());

    let optLen = lines.length - this.dimension.y;
    let lastApply = null;
    for ( let i = 1; i < optLen; ++i )
    {
      let line = lines[i].trim();
      if (line == '')
      { continue;}
      let tokens = line.split(' ');
      if (tokens[0] == "!!")
      {
	if (tokens.length != 2)
	{
	  throw "Incorrect number of arguments for tile specifier\nat line " + (i+1) + "; expected: 2, actual: " + tokens.length;
	}
	if (TILES[tokens[1]] == undefined)
	{
	  throw "Unknown tile specifier '" + tokens[1] + "' at line " + (i+1) + ".";
	}
	lastApply = TILES[tokens[1]];
      }
      else
      {
	for (let pair of tokens)
	{
	  if (pair.length == 0)
	  { continue;}

	  let [tile, art] = pair.split(':');
	  this.artMap[tile] = "T_" + art;
	  this.typeMap[tile] = lastApply;
	}
      }

      this.setMinBound(0,0);
      this.setMaxBound(this.dimension.x, this.dimension.y);
    }

    for ( let i = 0; i < this.dimension.y; ++i )
    {
      let row = [];
      let prow = [];
      let tiles = lines[i+optLen].split(" ");
      for ( let j = 0; j < this.dimension.x; ++j )
      {
	if (tiles[j] != "")
	{
	  if (this.typeMap[tiles[j]] == undefined)
	  {
	    console.log(lines[i+optLen])
	    throw "Undefined tiletype on tile (x, y) = (" + j + ", " + i + "): " + tiles[j];
	  }
	  row.push( new Tile(this, tiles[j] ) );
	  prow.push( this.typeMap[tiles[j]] );
	}
      }
      
      this.map.push(row);
      this.pather.push(prow);
    }
    triggerEvent("load_progress", "Generated tilemap");
  }


  setDimension( s )
  {
    let t = s.split(" ");
    for (let pair of t)
    {
      let u = pair.split(":")
      if (u.length == 1)
      {
	throw "Invalid size specifier at line 1.";
      }
      this.dimension[u[0]] = +u[1];
    }
    if (this.dimension.x == undefined || this.dimension.y == undefined)
    {
      throw "Invalid map size in tilemap.";
    }
  }
  max(dim)
  {
    return this.bounds.max[dim];
  }
  min(dim)
  {
    return this.bounds.min[dim];
  }

  // top left of the bounds rectangle
  // null to leave unchanged
  setMinBound( x, y )
  {
    if (x !== null)
      this.bounds.min.x = Math.max(0, x);
    if (y !== null)
      this.bounds.min.y = Math.max(0, y);
  }
  // bot right of the bounds rectangle
  // noninclusive bound
  setMaxBound( x, y )
  {
    if (x === null)
      x = this.dimension.x
    if (y === null)
      y = this.dimension.y

    this.bounds.max.x = Math.min(this.dimension.x, x)-1;
    this.bounds.max.y = Math.min(this.dimension.y, y)-1;
  }
  setArtMapping( s )
  {
      let t = s.split(" ");
      for (let pair of t)
      {
	  let pArr = pair.split(":");
	  this.artMap[pArr[0]] = "T_"+pArr[1];
      }
  }
  getTile( x, y = null )
  {
    if (y == null)
    {
      y = x.y;
      x = x.x;
    }
    try
    {
      let a = this.map[y][x];
      if (a === undefined)
	return null;
      return a;
    }
    catch (TypeError)
    {
      return null;
    }
  }
  contains(x,y = null)
  {
    if (y == null)
    {
      y = x.y;
      x = x.x;
    }
    return (x >= 0 && x < this.dimension.x && y >= 0 && y < this.dimension.y);
  }
  removeUnit( unit )
  {
      this.getTile(unit.x, unit.y).unit = null;
  }

  draw( g )
  {
    let off = g.camera.getOffset();
    let wsize = g.camera.wsize;

    let minx = Math.max(Math.ceil(off.x) - 1, 0)
    let miny = Math.max(Math.ceil(off.y) - 1, 0)
    
    let maxx = Math.min(Math.floor(off.x) + wsize.x + 1, this.dimension.x)
    let maxy = Math.min(Math.floor(off.y) + wsize.y + 1, this.dimension.y)
    
    for (let x = minx; x < maxx; ++x)
    {
      for (let y = miny; y < maxy; ++y)
      {
	Album.draw(0, this.getTile(x,y).art, (x - off.x)*g.gx, (y - off.y)*g.gy);//,
	  //g.gx, g.gy);
      }
    }
  }

  _patherRestore()
  {
    for (let c of this.pRestore)
    {
      this.pather[c.y][c.x] = this.getTile(c.x, c.y).tile;
    }
    this.pRestore = []
  }
  //            [Unit]
  getPathingMap(enemies)
  {
    this._patherRestore();

    for (let u of enemies)
    {
      if (this.contains(u))
      {
	this.pRestore.push(new Coord(u));
	this.pather[u.y][u.x] = TILES.ENEMY;
      }
    }
    return this.pather;
  }
}

