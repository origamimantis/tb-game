'use strict'

import {PathFinder} from "./PathFinder.js";
import {Path, Coord} from "./Path.js";
import {FPS, TICK_RATE} from "./Constants.js";
import {Queue} from "./Queue.js";


function nextFrameDo(f)
{
  //requestAnimationFrame(f);
  setTimeout( () => {requestAnimationFrame(f)}, 1000*TICK_RATE);
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
  let visited = new Path();
  
  // Paths stored as strings : mov left when visiting that spot
  let mem = {};
  
  let min = {x: 0, y: 0};
  let max = {x: g.Map.dimension.x - 1, y: g.Map.dimension.y - 1};

  let tmp = g.Map.getTile(x, y).tile;
  tmp =  cost[tmp];
  let toVisit = new Queue();
  toVisit.enqueue({c: new Coord(x, y), m: mov + tmp});

  // breadth-first search
  while (toVisit.size > 0)
  {
    let cur = toVisit.dequeue();

    let cd = cur.c;
    let mv = cur.m;
    
    if (inMap(cd, min, max) && ( mem[cd] == undefined || mem[cd] < mv) )
    {
      let type = g.Map.getTile(cd.x, cd.y).tile;
      let cst = cost[type];

      if (cst != undefined && mv >= cst)
      {
	if ( mem[cd] == undefined)
	{
	  visited.push(cd);
	}
	mem[cd] = mv;

	toVisit.enqueue( {c: new Coord(cd.x + 1, cd.y    ), m: mv - cst} );
	toVisit.enqueue( {c: new Coord(cd.x - 1, cd.y    ), m: mv - cst} );
	toVisit.enqueue( {c: new Coord(cd.x    , cd.y + 1), m: mv - cst} );
	toVisit.enqueue( {c: new Coord(cd.x    , cd.y - 1), m: mv - cst} );
      }
    }
  }
  return visited;
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
