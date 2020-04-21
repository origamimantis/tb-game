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
    
    // offset is camera's top left coordinate
    this.offset = {x: 0, y: 0};

    this.moveTriggers = { l: MOVE_BORDER.x,
			  r: this.wsize.x - MOVE_BORDER.x - 1,
			  t: MOVE_BORDER.y,
			  b: this.wsize.y - MOVE_BORDER.y - 1}

    this.toMove = {x: false, y: false};
    this.target = g.cursor.vis;

    this.path = new Queue();
    this.shift = false;
    this.shiftSpeed = 3;
  }

  resetBorders()
  {
    this.setBorders(MOVE_BORDER.x, MOVE_BORDER.y);
  }

  setBorders(x, y)
  {
    this.moveTriggers = { l: x,
			  r: this.wsize.x - x,
			  t: y,
			  b: this.wsize.y - y - 1}
  }
  waitShiftTo(c)
  {
    return new Promise( resolve => {this.shiftTo(c, resolve);} );
  }

  shiftTo(c, onDone)
  {
    if (this.path.nonempty())
    {
      throw "Cannot shift camera while moving.";
    }
    let off = new Coord( this.offset.x, this.offset.y );
    let dest = new Coord( inBound(c.x, this.moveTriggers.l, this.max.x + this.moveTriggers.r),
			  inBound(c.y, this.moveTriggers.t, this.max.y + this.moveTriggers.b) );

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
  clearTarget()
  {
    this.target = null;
  }

  adjustedPos(a)
  {
    return new Coord(a.x - this.offset.x, a.y - this.offset.y);
  }
  update(g)
  {
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
	this.path.dequeue();
	this.path.counter = this.shiftSpeed;
	this.offset.x = Math.round(this.offset.x);
	this.offset.y = Math.round(this.offset.y);
	this.x = this.offset.x;
	this.y = this.offset.y;
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

      let velx = 0;
      let vely = 0;

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
  onLeft(c)
  {
    return this.adjustedPos(c).x < this.wsize.x/2
  }
  onRight(c)
  {
    return this.adjustedPos(c).x >= this.wsize.x/2
  }
  onTop(c)
  {
    return this.adjustedPos(c).y < this.wsize.y/2
  }
  onTop(c)
  {
    return this.adjustedPos(c).y >= this.wsize.y/2
  }
  visible(c)
  {
    return (c.x >= this.offset.x - 1) && (c.x < this.offset.x+ this.wsize.x) && 
	    (c.y >= this.offset.y - 1) && (c.y < this.offset.y+ this.wsize.y);
  }
  inBounds(c)
  {
    let a = this.adjustedPos(c);

    return inBound( a.x, 0, this.max.x) && inBound( a.y, 0, this.max.y);
  }
}

function inBound(x, lb, ub)
{
  return Math.min(Math.max(x, lb), ub);
}

function doNothing()
{}


export {Camera};
