'use strict';

import {respondToEvent, waitTick} from "./Utils.js";
import {Coord} from "./Path.js";
import {Queue} from "./Queue.js";


const MOVE_BORDER = {x: 3,
		     y: 2}

//  Follow cursor by responding to listeners by doing something/nothing
class Camera
{
  constructor( g, wx, wy, mx, my )
  {
    this.g = g;
    
    this.wsize = {x: wx, y: wy};
    this.max = {x: mx - wx, y: my - wy};
    // topleft is camera's internal position relative to map (but seems kinda useless)
    this.topleft = {x: 0, y: 0};
    // offset is camera's visible position relative to map
    this.offset = {x: 0, y: 0};

    this.moveTriggers = { l: MOVE_BORDER.x,
			  r: this.wsize.x - MOVE_BORDER.x - 1,
			  t: MOVE_BORDER.y,
			  b: this.wsize.y - MOVE_BORDER.y - 1}

    this.toMove = {x: false, y: false};
    this.target = g.cursor.vis;

    this.path = new Queue();
    this.shift = false;
    this.shiftSpeed = 2;
  }

  resetBorders()
  {
    this.setBorders(MOVE_BORDER.x, MOVE_BORDER.y);
  }

  setBorders(x, y)
  {
    this.moveTriggers = { l: x,
			  r: this.wsize.x - x - 1,
			  t: y,
			  b: this.wsize.y - y - 1}
  }
  shiftTo(c, onDone)
  {
    if (this.path.nonempty())
    {
      throw "Cannot shift camera while moving.";
    }
    let off = new Coord( this.offset.x, this.offset.y );
    let dest = new Coord( c.x, c.y );

    while (dest.x - off.x > this.moveTriggers.r || dest.x - off.x < this.moveTriggers.l)
    {
      let dx = dest.x - off.x;
      if (dest.x - off.x > this.moveTriggers.r)
      {
	dx -= this.moveTriggers.r;
      }
      else if (dest.x - off.x < this.moveTriggers.l)
      {
	dx -= this.moveTriggers.l;
      }
      dx = Math.sign(dx);
      off.x += dx;
      this.path.enqueue(new Coord(dx, 0));
    }
    while (dest.y - off.y > this.moveTriggers.b || dest.y - off.y < this.moveTriggers.t)
    {
      let dy = dest.y - off.y;
      if (dest.y - off.y > this.moveTriggers.b)
      {
	dy -= this.moveTriggers.b;
      }
      else if (dest.y - off.y < this.moveTriggers.t)
      {
	dy -= this.moveTriggers.t;
      }
      dy = Math.sign(dy);
      off.y += dy;
      this.path.enqueue(new Coord(0, dy));
    }

    if (this.path.nonempty())
    {
      this.path.onDone = onDone;
      this.path.counter = this.shiftSpeed;
      this.shift = true;
    }
    else
    {
      onDone();
    }

  }

  setTarget(t)
  {
    this.target = t;
  }

  adjustedPos(a)
  {
    return new Coord(a.x - this.offset.x, a.y - this.offset.y);
  }
  update(g)
  {
    let velx = 0;
    let vely = 0;
    if (this.shift == true)
    {
      if (this.path.counter > 0)
      {
	let v = this.path.front();
	-- this.path.counter;
	this.offset.x = inBound( this.offset.x + v.x/this.shiftSpeed, 0, this.max.x);
	this.offset.y = inBound( this.offset.y + v.y/this.shiftSpeed, 0, this.max.y);
      }
      else
      {
	let v = this.path.dequeue();
	this.path.counter = this.shiftSpeed;
	this.offset.x = inBound( Math.round(this.offset.x + v.x/this.shiftSpeed), 0, this.max.x);
	this.offset.y = inBound( Math.round(this.offset.y + v.y/this.shiftSpeed), 0, this.max.y);
      }

      if (this.path.empty())
      {
	this.path.onDone();
	delete this.path.onDone;
	this.shift = false;
      }

    }
    else
    {
      let adj = this.adjustedPos(this.target);

      if (adj.x > this.moveTriggers.r)
      {
	velx = adj.x - this.moveTriggers.r;
      }
      else if (adj.x < this.moveTriggers.l)
      {
	velx = adj.x - this.moveTriggers.l;
      }
      
      if (adj.y > this.moveTriggers.b)
      {
	vely = adj.y - this.moveTriggers.b;
      }
      else if (adj.y < this.moveTriggers.t)
      {
	vely = adj.y - this.moveTriggers.t;
      }
      this.offset.x = inBound( this.offset.x + velx, 0, this.max.x);
      this.offset.y = inBound( this.offset.y + vely, 0, this.max.y);
    }
  }

}

function inBound(x, lb, ub)
{
  return Math.min(Math.max(x, lb), ub);
}

function doNothing()
{}


export {Camera};
