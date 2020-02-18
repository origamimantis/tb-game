'use strict'

import {PathFinder} from "./PathFinder.js";
import {Path, Coord} from "./Path.js";
import {FPS, TICK_RATE} from "./Constants.js";
import {Queue} from "./Queue.js";
import {CoordLookup} from "./CoordLookup.js";


function nextFrameDo(f)
{
  requestAnimationFrame(f);
  //setTimeout( () => {requestAnimationFrame(f)}, TICK_RATE);
}


async function generatePath(g, x0, y0, xf, yf, cost)
{
  return new Promise( (resolve, reject) => 
    {
      PathFinder.setMap(g.Map.pather);
      PathFinder.findPath(x0, y0, xf, yf, cost)
      .then( (thing) => 
	{
	  resolve(thing);
	}
      );
    }
  );
}

function inMap(pos, min, max)
{
  return (pos.x >= min.x && pos.x <= max.x && pos.y >= min.y && pos.y <= max.y);
}

function generateMovable(g, x, y, mov, cost)
{
  let mem = new CoordLookup();
  
  let min = new Coord(0,0);
  let max = new Coord(g.Map.dimension.x - 1, g.Map.dimension.y - 1);

  let tmp = cost[g.Map.getTile(x, y).tile];

  let toVisit = new Queue();
  toVisit.enqueue({c: new Coord(x, y), m: mov + tmp});

  // breadth-first search
  while (toVisit.nonempty())
  {
    let cur = toVisit.dequeue();

    let cd = cur.c;
    let mv = cur.m;
    
    if (inMap(cd, min, max) && ( mem.doesNotContain(cd) || mem.get(cd) < mv) )
    {
      let type = g.Map.getTile(cd.x, cd.y).tile;
      let cst = cost[type];

      if (cst != undefined && mv >= cst)
      {
	mem.add(cd, mv);

	toVisit.enqueue( {c: new Coord(cd.x + 1, cd.y    ), m: mv - cst} );
	toVisit.enqueue( {c: new Coord(cd.x - 1, cd.y    ), m: mv - cst} );
	toVisit.enqueue( {c: new Coord(cd.x    , cd.y + 1), m: mv - cst} );
	toVisit.enqueue( {c: new Coord(cd.x    , cd.y - 1), m: mv - cst} );
      }
    }
  }
  return mem;
}




let requestFile = function (url, method)
{
  // Create the XHR request
  let request = new XMLHttpRequest();

  // Return it as a Promise
  return new Promise( (resolve, reject) =>
    {
      request.onreadystatechange = () =>
      {
	if (request.readyState !== 4)
	{
	  return;
	}

	if (request.status >= 200 && request.status < 300)
	{
	  resolve(request);
	}
	else
	{
	  reject(
	    {
	      status: request.status,
	      statusText: request.statusText
	    });
	}

      };

      request.open('GET', url, true);

      request.send();

    });
};

function triggerEvent(name, detail)
{
  document.dispatchEvent(new CustomEvent(name, {detail: detail}));
}

function respondToEvent(name, f)
{
  document.addEventListener( name, (e) => f(e.detail));
}

export {requestFile, triggerEvent, respondToEvent, generatePath, generateMovable, nextFrameDo};
