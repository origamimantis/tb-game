'use strict'

import {PathFinder} from "./PathFinder.js";
import {Path, Coord} from "./Path.js";
import {FPS, TICK_RATE} from "./Constants.js";
import {Queue} from "./Queue.js";
import {CoordLookup, MapCoordBlob} from "./CoordLookup.js";
import {ARROW} from "./Inputter.js";

export function fracAmtFn(c)
{
  return (c !== null) ? formattedHP(c.uses, c.maxUses) : "";
}

export function toTitle(s)
{
  return s[0].toUpperCase() + s.slice(1);
}

export function formattedEXP(exp)
{
  let s = "EXP ";
  if (exp < 10)
    s += " ";
  s += hp.toString();
  s += "/";
  return s;
}
export function leftPad(num, amount)
{
  return num.toString().padStart(amount, " ");
}
export function formattedHP(hp, max)
{
  let s = "";
  if (hp < 10)
    s += " ";
  if (hp < 100)
    s += hp.toString();
  else
    s += "??";

  s += "/";
  
  if (max < 10)
    s += " ";
  if (max < 100)
    s += max.toString();
  else
    s += "??";

  return s;
}

export function cursorStop(cur)
{
  return new Promise( async (resolve) =>
    {
      while (cur.moving != false)
      {
	await new Promise( (resolve) => {setTimeout(resolve, 5)});
      }
      resolve();
    });
}



export function nextFrameDo(f)
{
  requestAnimationFrame(f);
  //setTimeout( () => {requestAnimationFrame(f)}, TICK_RATE);
}


export async function generatePath(g, x0, y0, xf, yf, cost, hostile)
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

export function getCost(map, x, y, cost)
{
  return cost[map.pather[y][x]];
}

export function generateMovable(map, x, y, mov, cost)
{
  let min = new Coord(map.min("x"), map.min("y"));
  let max = new Coord(map.max("x"), map.max("y"));

  let toVisit = new Queue();
  let previouslyVisited = new MapCoordBlob();
  let mostMovAt = new CoordLookup();
  let mostMovPrev = new MapCoordBlob();

  let tmp = getCost(map, x, y, cost);
  let curCoord = new Coord(x, y);

  toVisit.enqueue( curCoord);
  mostMovAt.add(curCoord, -tmp);

  // breadth-first search
  while (toVisit.nonempty())
  {
    //check first coordinate
    let cd = toVisit.front();
    toVisit.dequeue();

    let mv = mostMovAt.get(cd);

    let costOfWalking = getCost(map, cd.x, cd.y, cost);

    if (costOfWalking != undefined && mv + costOfWalking <= mov && previouslyVisited.doesNotContain(cd) )
    {
      previouslyVisited.add(cd, mv);

      for (let nex of [ new Coord(cd.x + 1, cd.y    ),
			new Coord(cd.x - 1, cd.y    ),
			new Coord(cd.x    , cd.y + 1),
			new Coord(cd.x    , cd.y - 1)])
      {
	if (inMap(nex, min, max))
	{
	  if ( toVisit.doesNotContain(nex) )
	  {
	    toVisit.enqueue(nex);
	    mostMovAt.add(nex, mv + costOfWalking);
	  }
	  else if ( mostMovAt.get(nex) > mv + costOfWalking )
	  {
	    mostMovAt.add(nex, mv + costOfWalking);
	  }
	}
      }
    }
  }
  return previouslyVisited;
}

export function generateMovable_(g, x, y, mov, cost)
{
  let mem = new Queue();
  let min = new Coord(g.Map.min("x"), g.Map.min("y"));
  let max = new Coord(g.Map.max("x"), g.Map.max("y"));
  console.log( new Coord(g.Map.max("x"), g.Map.max("y")));
  console.log( new Coord(g.Map.dimension.x, g.Map.dimension.y));

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

export function randRange(lb, ub)
{
  return Math.random()*(ub-lb)+lb;
}
export function randInt(lb, ub)
{
  return Math.floor(randRange(lb, ub));
}
export function randChoice(array)
{
  return array[randInt(0, array.length)];
}

// range is array of range numbers ie [1,2] or [1]
export function inRange(c,range,type, map, t = null, conditions = [(x)=>{return true}])
{
  if (t == null)
  {
    t = new Queue();
  }

  let x = c.x;
  let y = c.y;
  let adder;
  if (type == "units")
  {
      adder = _unitinrange;
  }
  else if (type == "tiles")
  {
      adder = _inrange;
  }
  else
  {
  throw new Error("unknown range type " + type);
  }

  for (let r of range)
  {
    if (r == 0)
    {
      adder(x, y, t,map,conditions);
    }
    else
    {
      for (let i = 0; i < r; ++i)
      {
	adder(x+r-i, y-i  , t,map, conditions);
	adder(x-r+i, y+i  , t,map, conditions);
	adder(x+i  , y+r-i, t,map, conditions);
	adder(x-i  , y-r+i, t,map, conditions);
      }
    }
  }
  return t;
}
function _inrange(x,y, t,map, conditions)
{
  if (map.contains(x,y))
  {
    t.push(new Coord(x, y));
  }
}
function _unitinrange(x,y, t,map, conditions)
{
  if (map.contains(x,y))
  {
    let tl = map.getTile(x, y);
    if (tl != null && tl.unit != null && all( conditions, tl.unit))
    {
      t.push(new Coord(x, y));
    }
  }
}

function all(conditions, param)
{
  for (let f of conditions)
  {
    if ( f(param) == false)
    {
      return false;
    }
  }
  return true;
}

export function scrollSelect_LR(keys, selector, beepOnErr = true, loop = true)
{
  let ret = false;
  for (let k of keys.once)
  {
    switch (k)
    {
    case ARROW.LEFT:
      triggerEvent("sfx_play_cursormove_effect");
      if (loop == true || selector.idx > 0)
	selector.prev();
      ret = true;
      break;
    case ARROW.RIGHT:
      triggerEvent("sfx_play_cursormove_effect");
      if (loop == true || selector.idx < selector.length - 1)
	selector.next();
      ret = true;
      break;
    default:
      if (beepOnErr)
	triggerEvent("sfx_play_err_effect");
    }
  }
  return ret;
}
export function scrollSelect_UD(keys, selector, beepOnErr = true, loop = true)
{
  let ret = false;
  for (let k of keys.once)
  {
    switch (k)
    {
    case ARROW.UP:
      triggerEvent("sfx_play_cursormove_effect");
      if (loop == true || selector.idx > 0)
	selector.prev();
      ret = true;
      break;
    case ARROW.DOWN:
      triggerEvent("sfx_play_cursormove_effect");
      if (loop == true || selector.idx < selector.length - 1)
	selector.next();
      ret = true;
      break;
    default:
      if (beepOnErr)
	triggerEvent("sfx_play_err_effect");
    }
  }
  return ret;
}
export function scrollSelect_4W(keys, selector, loop = true)
{
  for (let k of keys.once)
  {
    switch (k)
    {
    case ARROW.UP:
    case ARROW.LEFT:
      if (loop == true || selector.idx > 0)
	selector.prev();
      break;
    case ARROW.DOWN:
    case ARROW.RIGHT:
      if (loop == true || selector.idx < selector.length - 1)
	selector.next();
      break;
    }
  }
  return true;
}



export function waitTime(time)
{
  return new Promise(resolve =>
    {
      setTimeout(resolve, time);
    });
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
	  triggerEvent("load_progress", `Loaded file ${url}`);
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

export function layermap(map)
{
  map = map.slice().reverse();
  // map is [  [key, value] , [key, value] , ... ]
  let f = (key) =>
  {
    for (let [k, v] of map)
    {
      if (key > k)
	return v
    }
    return 0
  }
  return f
}
