'use strict';

import {TILES} from "./Constants.js";


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
      this.pather = [];
      this.dimension = {"y":undefined, "x":undefined};
      this.artMap = {};
      this.typeMap = {};
    }
    generate( text )
    {
      let lines = text.split("\n");
      
      // last line is empty - let's get rid of it
      lines.pop()
      
      let t = {};
      t["."] = 5;
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
	      throw "Undefined tiletype on tile (x, y) = (" + j + ", " + i + ").";
	    }
	    row.push( new Tile(this, tiles[j] ) );
	    prow.push( this.typeMap[tiles[j]] );
	  }
	}
	
	this.map.push(row);
	this.pather.push(prow);
      }
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

    setArtMapping( s )
    {
	let t = s.split(" ");
	for (let pair of t)
	{
	    let pArr = pair.split(":");
	    this.artmap[pArr[0]] = "T_"+pArr[1];
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
	  return this.map[y][x];
      }
      catch (TypeError)
      {
	  return null;
      }
    }
    removeUnit( unit )
    {
	this.getTile(unit.x, unit.y).unit = null;
    }

    draw( g )
    {
      let off = g.camera.offset;
      let wsize = g.camera.wsize;

      let minx = Math.max(Math.ceil(off.x) - 1, 0)
      let miny = Math.max(Math.ceil(off.y) - 1, 0)
      
      let maxx = Math.min(Math.floor(off.x) + wsize.x + 1, this.dimension.x)
      let maxy = Math.min(Math.floor(off.y) + wsize.y + 1, this.dimension.y)
      
      for (let x = minx; x < maxx; ++x)
      {
	for (let y = miny; y < maxy; ++y)
	{
	  g.ctx[0].drawImage(
	    g.Album.get(
	      this.getTile(x,y).art), 
	    (x - off.x)*g.grid.x, (y - off.y)*g.grid.y,
	    g.grid.x, g.grid.y);
	}
      }
    }
}

