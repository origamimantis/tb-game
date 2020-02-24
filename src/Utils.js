'use strict'

import {PathFinder} from "./PathFinder.js";
import {Path, Coord} from "./Path.js";
import {FPS, TICK_RATE} from "./Constants.js";
import {Queue} from "./Queue.js";
import {CoordLookup} from "./CoordLookup.js";


export function cursorStop(cur)
{
  return new Promise( async (resolve) =>
    {
      while (cur.moving != false)
      {
	await new Promise( (resolve) => {setTimeout(() => {resolve();}, 5)});
      }
      resolve();
    });
}



export function nextFrameDo(f)
{
  requestAnimationFrame(f);
  //setTimeout( () => {requestAnimationFrame(f)}, TICK_RATE);
}


export async function generatePath(g, x0, y0, xf, yf, cost)
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

export function getCost(g, x, y, cost)
{
  return cost[g.Map.getTile(x, y).tile];
}

export function generateMovable(g, x, y, mov, cost)
{
  let mem = new Queue();
  let min = new Coord(0,0);
  let max = new Coord(g.Map.dimension.x - 1, g.Map.dimension.y - 1);

  let tmp = getCost(g, x, y, cost);

  let toVisit = new Queue();
  toVisit.enqueue( new Coord(x, y), -tmp);

  // breadth-first search
  while (toVisit.nonempty())
  {
    //check first coordinate
    let cd = toVisit.front();
    let mv = toVisit.get(cd);
    toVisit.dequeue();

    let costOfWalking = getCost(g, cd.x, cd.y, cost);

    if (costOfWalking != undefined && mv + costOfWalking <= mov)
    {
      if (mem.doesNotContain(cd))
      {
	mem.push(cd, mv);
      }
      else if ( mem.get(cd) > mv )
      {
	mem.set(cd, mv);
      }
      else
      {
	continue;
      }

      for (let nex of [ new Coord(cd.x + 1, cd.y    ),
			new Coord(cd.x - 1, cd.y    ),
			new Coord(cd.x    , cd.y + 1),
			new Coord(cd.x    , cd.y - 1)])
      {
	if (inMap(nex, min, max))
	{
	  if ( toVisit.doesNotContain(nex) )
	  {
	    toVisit.enqueue(nex, mv + costOfWalking);
	  }
	  else if ( toVisit.get(nex) > mv + costOfWalking )
	  {
	    toVisit.set(nex, mv + costOfWalking);
	  }
	}
      }
    }
  }
  return mem;
}

export function waitTick()
{
  return new Promise(resolve =>
    {
      nextFrameDo(() => {resolve();});
    });
}


export function requestFile(url, method)
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

export function triggerEvent(name, detail)
{
  document.dispatchEvent(new CustomEvent(name, {detail: detail}));
}

export function respondToEvent(name, f)
{
  document.addEventListener( name, (e) => f(e.detail));
}

