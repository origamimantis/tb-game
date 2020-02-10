'use strict';

import {Path} from "./Path.js";

class PathFinder
{
  static init( g )
  {
    this.g = g;
    this.As = new EasyStar.js();
  }
  static setMap( tiles )
  {
    this.As.setGrid(tiles);
  }

  static async findPath(x0, y0, xf, yf, mcost)
  {
    return new Promise
    (
      (resolve, reject) =>
      {

	this.As.setAcceptableTiles(Object.keys(mcost));

	for (let [tile,cost] of Object.entries(mcost))
	{
	  this.As.setTileCost(tile,cost);
	}

	this.As.findPath(x0, y0, xf, yf,  ( path ) => 
	{
	  if (path != null)
	  {
	    resolve( new Path( path ) );
	  }
	  resolve( null );

	});
	this.As.calculate();
      }
    );
  }
    
    largestwalkable(unit, limit)
    {
	let l = 0;
	for (let movreq of Object.values(unit.movcost))
	{
	    if (movreq <500 && movreq > l)
	    {
		l= movreq;
	    }
	}
	return l;
    }
    removeloop( tp )
    {
	for (let i = 0; i < tp.length; ++i)
	{
	    let is = tp.idxs(tp[i], i);
	    if (is.length > 1)
	    {
		let howmany = is[is.length-1] - is[0];
		tp.splice(is[0], howmany);
	    }
	}
    }



}

export {PathFinder};
