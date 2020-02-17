'use strict';

import {AnimatedObject} from "./AnimatedObject.js";
import {Animation} from "./Animation.js";
import {triggerEvent, nextFrameDo} from "./Utils.js";
import {Path, Coord} from "./Path.js";

const LOGGING = false;

class Cursor extends AnimatedObject
{
  constructor(g, x, y, framesToMove) // x,y determines basicaly the default camera location
  {
    super(g,x,y);

    //visuals
    this.addAnim( 0, new Animation( "C_c0", [30,10,10,10], true, [4,4] ));

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
    this.speed = framesToMove;
    this.bufQueue = [];
  }
  
  move( c )
  {
    if (this.moving == false && (c.x != 0 || c.y != 0))
    {
      this.buf.x += c.x;
      this.buf.y += c.y;
      this.triggerMove = true;
    }
  }
  moveTo( c )
  {
    //triggerEvent("game_cursorChange", c);
    let p = new Path();
    let x = this.x;
    let y = this.y;
      p.push(new Coord(x, y));
    while (x != c.x || y != c.y)
    {
      let dx = c.x - x;
      let dy = c.y - y;
      if (dx != 0)
      {	x += Math.sign(dx);}
      if (dy != 0)
      {	y += Math.sign(dy);}
      p.push(new Coord(x, y));
    }
    triggerEvent("game_cursorMoveStart", this);
    this.x += this.buf.x;
    this.y += this.buf.y;
    this.clearMoveBuffer();
    this.cutMoveChain(this.speed, 0, p);
  }
  
  resultOf( c )
  {
    return new Coord( this.x + c.x, this.y + c.y );
  }

  update()
  {
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
	this.moveChain(this.speed);
      }
      else
      {
	this.clearMoveBuffer();
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
 /* 
  moveChain(framesLeft)
  {
    if (framesLeft <= 0)
    {
      this.x += this.buf.x;
      this.y += this.buf.y;
      this.vis.x = this.x;
      this.vis.y = this.y;
      this.clearMoveBuffer();
      this.moving = false;

      // trigger an event containing the cursor's current position
      triggerEvent("game_cursorChange", {x:this.x, y:this.y});
    }
    //
    else
    {
      let dx = this.buf.x/this.speed;
      let dy = this.buf.y/this.speed;
      this.vis.x += dx;
      this.vis.y += dy;
      
      // trigger an event containing the cursor's change in position
      triggerEvent("game_cursorMovement", {x: dx, y: dy});
      nextFrameDo(() => {this.moveChain(framesLeft - 1);});
    }

  }
  */
  moveChain(framesLeft)
  {
    return new Promise( async (resolve) =>
      {
	while (framesLeft > 0)
	{
	  let dx = this.buf.x/this.speed;
	  let dy = this.buf.y/this.speed;
	  this.vis.x += dx;
	  this.vis.y += dy;
	  
	  // trigger an event containing the cursor's change in position
	  triggerEvent("game_cursorMovement", {x: dx, y: dy});
	  await this.wait();
	  -- framesLeft;
	}
	this.x += this.buf.x;
	this.y += this.buf.y;
	this.vis.x = this.x;
	this.vis.y = this.y;
	this.clearMoveBuffer();
	this.moving = false;

	// trigger an event containing the cursor's current position
	triggerEvent("game_cursorChange", {x:this.x, y:this.y});
	resolve();
      }
    );
  }

  cutMoveChain(framesLeft, index, path)
  {
    return new Promise( async(resolve) => 
      {
	let start = new Coord( this.x, this.y );
	for (let i of path)
	{
	  this.buf.x = i.x - start.x;
	  this.buf.y = i.y - start.y;
	  start = i;
	  triggerEvent("game_cursorMoveStart", { x: this.x + this.buf.x, y: this.y + this.buf.y });
	  await this.moveChain(this.speed);
	}
	resolve();
      });
  }
	


/*
  cutMoveChain(framesLeft, index, path)
  {
    if (framesLeft <= 0)
    {
      this.x = path[index].x;
      this.y = path[index].y;
      this.vis.x = this.x;
      this.vis.y = this.y;
      this.clearMoveBuffer();
      this.moving = false;
      triggerEvent("game_cursorChange", {x:this.x, y:this.y});
      if (index + 1 < path.length)
      {
        this.buf.x = path[index + 1].x - this.x;
        this.buf.y = path[index + 1].y - this.y;
	triggerEvent("game_cursorMoveStart", this);
        this.cutMoveChain(this.speed, index+1, path);
      }
      else
      {
	triggerEvent("cursor_finishMoveTo");
      }
    }

    //
    else
    {
      let dx = this.buf.x/this.speed;
      let dy = this.buf.y/this.speed;
      this.vis.x += dx;
      this.vis.y += dy;
      
      // trigger an event containing the cursor's change in position
      triggerEvent("game_cursorMovement", {x: dx, y: dy});
      nextFrameDo(() => {this.cutMoveChain(framesLeft - 1, index, path)});
    }

  }
*/

  
  draw(g)
  {
    let off = g.camera.offset;
    super.draw(g, 3, {x:off.x + 0.125, y:off.y + 0.125}, 1.25, this.vis.x, this.vis.y);
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
  
  wait()
  {
    return new Promise(resolve =>
      {
        nextFrameDo(() => {resolve();});
      });
  }

}


export {Cursor};

	
