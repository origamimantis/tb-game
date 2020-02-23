'use strict';

import {AnimatedObject} from "./AnimatedObject.js";
import {Animation} from "./Animation.js";
import {triggerEvent, nextFrameDo, waitTick} from "./Utils.js";
import {Path, Coord} from "./Path.js";
import {Queue} from "./Queue.js";

const LOGGING = false;

class Cursor extends AnimatedObject
{
  constructor(g, x, y, framesToMove) // x,y determines basicaly the default camera location
  {
    super(g,x,y);

    //visuals
    this.addAnim( 0, new Animation( "C_c0", [48,4,4,4], true, [4,4] ));

    this.max = {x: g.Map.dimension.x - 1,
		y: g.Map.dimension.y - 1};

    this.min = {x: 0,
		y: 0};

    this.buf = {x: 0,
		y: 0};

    this.vis ={x: 0,
		y: 0};

    this.moving = false;
    this.triggerMove = false;
    this.baseSpeed = framesToMove;
    this.speed = framesToMove;
    this.path = new Queue();
  }
  
  move( c, onDone )
  {
    if (this.moving == false && (c.x != 0 || c.y != 0))
    {
      this.buf.x += c.x;
      this.buf.y += c.y;
      this.triggerMove = true;
      this.path.onDone = onDone;
      this.speed = this.baseSpeed;
    }
  }
  moveTo( c, onDone )
  {
    if (this.path.nonempty())
    {
      throw "Cannot assign cursor movement while cursor is moving";
    }
    //triggerEvent("game_cursorChange", c);
    let x = this.x;
    let y = this.y;
    
    while (x != c.x || y != c.y)
    {
      let dx = c.x - x;
      let dy = c.y - y;
      if (dx != 0)
      {
	dx = Math.sign(dx);
	x += dx;
      }
      if (dy != 0)
      {
	dy = Math.sign(dy);
	y += dy;
      }
      this.path.enqueue(new Coord(dx, dy));
    }
    // do nothign if no path
    if (this.path.nonempty())
    {
      this.path.onDone = onDone;
      triggerEvent("game_cursorMoveStart", this);
      this.x += this.buf.x;
      this.y += this.buf.y;
      this.clearMoveBuffer();
      this.speed = 2;
    }
    else
    {
      onDone();
    }
  }

  // moveTo except disallow diagonal movement. Used for unit
  // move cancel where the diagonal is a bit jarring
  moveToOrthog( c, onDone )
  {
    if (this.path.nonempty())
    {
      throw "Cannot assign cursor movement while cursor is moving";
    }
    //triggerEvent("game_cursorChange", c);
    let x = this.x;
    let y = this.y;
    
    while (x != c.x)
    {
      let dx = Math.sign(c.x - x);
      x += dx;
      this.path.enqueue(new Coord(dx, 0));
    }
    while (y != c.y)
    {
      let dy = Math.sign(c.y - y);
      y += dy;
      this.path.enqueue(new Coord(0, dy));
    }

    if (this.path.nonempty())
    {
      this.path.onDone = onDone;
      triggerEvent("game_cursorMoveStart", this);
      this.x += this.buf.x;
      this.y += this.buf.y;
      this.clearMoveBuffer();
      this.speed = 2;
    }
    else
    {
      onDone();
    }
  }
  
  resultOf( c )
  {
    return new Coord( this.x + c.x, this.y + c.y );
  }

  async update()
  {
    // only let update if cursor is not moving
    if (this.moving == true)
    {
      return;
    }
    
    if (this.triggerMove)
    {
      let inx = this.inBounds("x");
      let iny = this.inBounds("y");
      if (inx || iny)
      {
	if (!inx)
	{
	  this.buf.x = 0;
	}
	if (!iny)
	{
	  this.buf.y = 0;
	}
	// trigger an event containing the cursor's position after moving
	triggerEvent("game_cursorMoveStart", { x: this.x + this.buf.x, y: this.y + this.buf.y });
	this.triggerMove = false;
	this.moving = true;
	await this.moveChain(this.speed);

	this.clearMoveBuffer();
	this.moving = false;

	// trigger an event containing the cursor's current position
	triggerEvent("game_cursorChange", {x:this.x, y:this.y});
	if (this.path.onDone)
	{
	  this.path.onDone();
	  delete this.path.onDone;
	}
      }
      else
      {
	this.clearMoveBuffer();
      }
    }
    else if (this.path.nonempty())
    {
      let i = this.path.dequeue();
      this.buf.x = i.x;
      this.buf.y = i.y;
      triggerEvent("game_cursorMoveStart", { x: this.x + this.buf.x, y: this.y + this.buf.y });
      this.moving = true;
      await this.moveChain(this.speed);

      this.clearMoveBuffer();
      this.moving = false;

      // trigger an event containing the cursor's current position
      triggerEvent("game_cursorChange", {x:this.x, y:this.y});
      if (this.path.empty())
      {
	this.path.onDone();
	delete this.path.onDone;
      }
    }
  }

  coordInBounds(c)
  {
    return this.xInBounds(c.x) && this.yInBounds(c.y);
  }
  xInBounds(x)
  {
      return ( x <= this.max.x && x >= this.min.x);
  }
  yInBounds(y)
  {
      return ( y <= this.max.y && y >= this.min.y);
  }
  inBounds(c)
  {
      return ( this[c] + this.buf[c] <= this.max[c]
	    && this[c] + this.buf[c] >= this.min[c]);
  }
  clearMoveBuffer()
  {
    this.buf = {x: 0,
		y: 0};
  }
  
  moveChain(framesLeft)
  {
    return new Promise
    (
      async (resolve) =>
      {
	while (framesLeft > 0)
	{
	  let dx = this.buf.x/this.speed;
	  let dy = this.buf.y/this.speed;
	  this.vis.x += dx;
	  this.vis.y += dy;
	  
	  // trigger an event containing the cursor's change in position
	  triggerEvent("game_cursorMovement", {x: dx, y: dy});
	  await waitTick();
	  -- framesLeft;
	}
	this.x += this.buf.x;
	this.y += this.buf.y;
	this.vis.x = this.x;
	this.vis.y = this.y;
	resolve();
      }
    );
  }


  
  draw(g)
  {
    let off = g.camera.offset;
    super.draw(g, 3, this.vis.x - off.x, this.vis.y - off.y);
  }



  setMotion(x,y, speed)
  {
    if (!this.moving)
    {
      this.usrmov = false;
      this.dx = x-this.x;
      this.dy = y-this.y;
      if (this.dx != 0 || this.dy != 0)
      {
	this.visible = false;
	this.modftm = Math.round(3*Math.sqrt(Math.pow(this.dx,2) + Math.pow(this.dy,2)));
      }
      this.setVel();
    }
  }
 
}


export {Cursor};

	
