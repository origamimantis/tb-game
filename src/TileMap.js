'use strict';




class Tile
{
    constructor( tm, arttype, tiletype )
    {
	this.tile = tiletype;
	this.unit = null;
	this.art = tm.artmap[arttype];
    }
}


class TileMap
{
    constructor()
    {
      this.map = [];
      this.dimension = {"y":0, "x":0};
      this.artmap = {};
    }
    generate( text )
    {
      let lines = text.split("\n");
      
      // last line is empty - let's get rid of it
      lines.pop()
      
      this.setDimension(lines[0]);
      this.setArtMapping(lines[1]);

      for ( let i = 0; i < this.dimension.y; ++i )
      {
	let row = [];
	let tiletypes = lines[i+2].split(" ");
	for ( let j = 0; j < this.dimension.x; ++j )
	{
	    let artile = tiletypes[j].split(':');
	    row.push( new Tile(this, ...artile ) );
	}
	this.map.push(row);
      }
    }

    setDimension( s )
    {
	let t = s.split(" ");
	this.dimension.y = +t[0];
	this.dimension.x = +t[1];
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
    getTile( x, y )
    {
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

    draw( g, ctx, s )
    {
	let ymin = Math.max(0, Math.floor(g.camera.y));
	let ymax = Math.min( this.dimension.y, Math.floor(g.camera.y) + g.camera.sizeY + 1);
	let xmin = Math.max(0, Math.floor(g.camera.x));
	let xmax = Math.min( this.dimension.x, Math.floor(g.camera.x) + g.camera.sizeX + 1);
	for (let y = ymin; y < ymax; y++)
	{
	    for (let x = xmin; x < xmax; x++)
	    {
		g.ctx[ctx].drawImage(this.getTile(x,y).art,(x - g.camera.x)*32*s, (y - g.camera.y)*32*s, s*32, s*32);
	    }
	}
    }
}


export {TileMap};


/*

(dimension y) (dimension x)        //2 numbers for size of map
(tileart#):(actualart#)            //a bunch of definitions for what art to use for which number
tileart:tiletype tileart:tiletype  //tiles
tileart:tiletype tileart:tiletype
tileart:tiletype tileart:tiletype














*/


