'use strict';

import {Path, Coord} from "./Path.js";
import {Queue} from "./Queue.js";

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
	    let q = new Queue();
	    for (let c of path)
	    {
	      q.enqueue(new Coord(c.x, c.y));
	    }
	    resolve( q );
	  }
	  resolve( null );

	});
	this.As.calculate();
      }
    );
  }

}

export {PathFinder};
