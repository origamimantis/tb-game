'use strict';

import {AnimatedObject} from "./AnimatedObject.js";
import {Animation} from "./Animation.js";
import {triggerEvent, nextFrameDo, waitTick} from "./Utils.js";
import {Path, Coord} from "./Path.js";
import {Queue} from "./Queue.js";
import {MusicPlayer} from "./MusicPlayer.js";

const LOGGING = false;

class Cursor extends AnimatedObject
{
  constructor(g, x, y, framesToMove) // x,y determines basicaly the default camera location
  {
    super(g,x,y);

    //visuals
    this.addAnim( 0, new Animation( {image: "C_c0", weights: [48,4,4,4], loops: true} ));

    this.map = g.Map;
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
  
  move( c )
  {
    return new Promise( (resolve) => {this._move(c, resolve);});
  }
  _move( c, onDone )
  {
    if (this.moving == false && (c.x != 0 || c.y != 0))
    {
      MusicPlayer.play("cbeep");
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
      this.clearMoveBuffer();
      this.speed = 2;
    }
    else
    {
      onDone();
    }
  }

  // moveTo except move there directly and in a set number of frames
  moveInstant( c )
  {
    if (this.path.nonempty())
    {
      throw "Cannot assign cursor movement while cursor is moving";
    }

    this.x = c.x;
    this.vis.x = c.x;
    this.y = c.y;
    this.vis.y = c.y;
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
	
	this.triggerMove = false;
	this.moving = true;
	await this.moveChain(this.speed);

	this.clearMoveBuffer();
	this.moving = false;

	if (this.path.onDone)
	{
	  this.path.onDone();
	  delete this.path.onDone;
	  this.triggerMoveEvent();
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
      
      this.moving = true;
      await this.moveChain(this.speed);

      this.clearMoveBuffer();
      this.moving = false;

      if (this.path.empty())
      {
	this.path.onDone();
	delete this.path.onDone;
	this.triggerMoveEvent();
      }
    }
  }

  coordInBounds(c)
  {
    return this.xInBounds(c.x) && this.yInBounds(c.y);
  }
  xInBounds(x)
  {
      return ( x <= this.map.max("x") && x >= this.map.min("x"));
  }
  yInBounds(y)
  {
      return ( y <= this.map.max("y") && y >= this.map.min("y"));
  }
  inBounds(c)
  {
      return ( this[c] + this.buf[c] <= this.map.max(c)
	    && this[c] + this.buf[c] >= this.map.min(c));
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
  triggerMoveEvent()
  {
    triggerEvent("cursor_move", {x:this.x, y:this.y});
  }

  
  draw(g)
  {
    g.ctx[3].globalAlpha = 1;
    let off = g.camera.getOffset();
    super.draw(g, 3, g.xg(this.vis.x - off.x + 0.5), g.yg(this.vis.y - off.y + 0.5));
    super.tickAnim();
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

	
