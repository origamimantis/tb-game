'use strict'

import {PathFinder} from "./PathFinder.js";
import {Path, Coord} from "./Path.js";
import {FPS, TICK_RATE} from "./Constants.js";
import {Queue} from "./Queue.js";
import {CoordLookup, MapCoordBlob} from "./CoordLookup.js";
import {ARROW} from "./Inputter.js";
import {Settings} from "./Settings.js"
import {Inputter} from "./Inputter.js";
import {MusicPlayer} from "./MusicPlayer.js";


export function fracAmtFn(c)
{
  return (c !== null) ? formattedHP(c.uses, c.maxUses) : "";
}
export function emptyAmtFn(c)
{
  return "";
}

export function toTitle(s)
{
  return s[0].toUpperCase() + s.slice(1);
}
export function addSpaces(s)
{
  // converts "ClassName" to "Class Name"
  // requres s.length > 0
  let s2 = s[0];
  for (let i = 1; i < s.length; ++i)
  {
    if (s[i] == s[i].toUpperCase())
      s2 += " ";
    s2 += s[i];
  }
  return s2
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

export function pathCost(g, path, mcost)
{
  let cost = 0;
  for (let c of path)
  {
    let tiletype = g.Map.getTile(c).tile
    cost += mcost[tiletype]
  }
  return cost
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

export function linspace(start, stop, amount, include_last = true)
{
  // linspace(0,1,6) = [0, 0.2, 0.4, 0.6, 0.8, 1]
  // linspace(0,1,5, false) = [0, 0.2, 0.4, 0.6, 0.8]
  if (include_last == true)
    amount -= 1
  let range = stop - start
  let a = []
  for (let i = 0; i < amount; ++i)
  {
    a.push(start + range*i/amount)
  }
  if (include_last == true)
    a.push(stop)

  return a
}

export function scrollSelect_LR(keys, selector, beepOnErr = true, loop = true, beepOnMove = true)
{
  let ret = false;

  for (let k of keys.once)
  {
    switch (k)
    {
    case ARROW.LEFT:
      if (beepOnMove)
	MusicPlayer.play("cbeep");
      if (loop == true || selector.idx > 0)
	selector.prev();
      ret = true;
      break;
    case ARROW.RIGHT:
      if (beepOnMove)
	MusicPlayer.play("cbeep");
      if (loop == true || selector.idx < selector.length - 1)
	selector.next();
      ret = true;
      break;
    default:
      if (beepOnErr)
      {
	// error beep only on the first time
	if (keys.held.includes(k) == false)
	{
	  MusicPlayer.play("errbeep");
	}
      }
    }
  }
  return ret;
}
export function scrollSelect_UD(keys, selector, beepOnErr = true, loop = true, beepOnMove = true)
{
  let ret = false;

  for (let k of keys.once)
  {
    switch (k)
    {
    case ARROW.UP:
      if (beepOnMove)
	MusicPlayer.play("cbeep");
      if (loop == true || selector.idx > 0)
	selector.prev();
      ret = true;
      break;
    case ARROW.DOWN:
      if (beepOnMove)
	MusicPlayer.play("cbeep");
      if (loop == true || selector.idx < selector.length - 1)
	selector.next();
      ret = true;
      break;
    default:
      if (beepOnErr)
      {
	// error beep only on the first time
	if (keys.held.includes(k) == false)
	{
	  MusicPlayer.play("errbeep");
	}
      }

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

// speed is a multiplicative offset to the base scroll speed
export function applyArrowStall(a, speed = 1, scrollspeedoverride = null)
{

  let slow;
  let fast;

  if (scrollspeedoverride === null)
    [slow, fast] = Settings.get("option_scroll_speed")
  else
    [slow, fast] = scrollspeedoverride

  let active = false;
  if (a.once.length > 0)
  {
    if (slow !== null)
    {
      triggerEvent("input_arrowStall", {start: null, speed : slow*speed });
    }
    active = true;
  }
  // if nothing was pressed this tick
  else if (Inputter.accepting == true)
  {
    if (fast !== null)
    {
      triggerEvent("input_arrowStall", {start: null, speed : fast*speed });
    }
    active = true;

    for (let x of a.held)
    {
      if (a.once.includes(x) == false)
	a.once.push(x)
    }
  }
  return !active

}


export function csPause(time)
{
  if (Settings.get("cut_skip") == true)
    return

  else
    return waitTime(time)
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

export function fileExists(url)
{
    let r = new XMLHttpRequest();
    r.open('HEAD', url, false);
    r.send();
    return r.status != 404;
}


export function requestFileSync(url)
{
  let ret = null;
  let request = new XMLHttpRequest();

  request.open('GET', url, false);
  request.send();

  if (request.status >= 200 && request.status < 300)
  {
    if (loadbar)
      triggerEvent("load_progress", `Loaded file ${url}`);
    ret = request;
  }
  return ret
}


export function requestFile(url, loadbar = false)
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
	  if (loadbar)
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

export function unitInZone(g, zone, zonecontroller)
{
  // zone= [ [top left xy], [bot right xy] ]
  let [tl, br] = zone
  for (let x = tl[0]; x <= br[0]; ++x)
  {
    for (let y = tl[1]; y <= br[1]; ++y)
    {
      if (g.Map.getTile(x,y).unit === null)
	continue
      let other = g.Map.getTile(x,y).unit.team;

      if (g.Units.teamHostile(zonecontroller, other))
      {
	return true;
      }
    }
  }
  return false
}

export function bezierp(p0, p1, p2, p3, x = 0, y = 0){
  // parameterized from t=0 to t=1
  // https://stackoverflow.com/questions/16227300/how-to-draw-bezier-curves-with-native-javascript-code-without-ctx-beziercurveto
  // https://www.desmos.com/calculator/cahqdxeshd to visualize
  // https://www.desmos.com/calculator/4var5ey87n
  //   p1          p2
  //     _________
  // p0 /         \ p3
  // ^ from 1->0
  // x,y are the initial position to start at (y-values are flipped)
  
  let cx = 3 * (p1[0] - p0[0]),
      bx = 3 * (p2[0] - p1[0]) - cx,
      ax = p3[0] - p0[0] - cx - bx;

  let cy = 3 * (p1[1] - p0[1]),
      by = 3 * (p2[1] - p1[1]) - cy,
      ay = p3[1] - p0[1] - cy - by;
  return {ax:ax, bx:bx,cx:cx,dx:x+p0[0],ay:-ay,by:-by,cy:-cy,dy:y-p0[1]}
}

export function beziert(t, bez)
{
  let x = (bez.ax * Math.pow(t, 3)) + (bez.bx * Math.pow(t, 2)) + (bez.cx * t) + bez.dx
  let y = (bez.ay * Math.pow(t, 3)) + (bez.by * Math.pow(t, 2)) + (bez.cy * t) + bez.dy

  return [x,y]
}
