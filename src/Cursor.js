'use strict';

import {AnimatedObject} from "./AnimatedObject.js";
import {Animation} from "./Animation.js";
import {triggerEvent} from "./Utils.js";

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
  }
  
  move( dx, dy )
  {
    if (this.moving == false && (dx != 0 || dy != 0))
    {
      this.buf.x += dx;
      this.buf.y += dy;
      this.triggerMove = true;
    }
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
	triggerEvent("game_cursorMoveStart", {cur: {x: this.x, y: this.y},
					      dest: {x: this.x + this.buf.x, y: this.y + this.buf.y}});
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
    if (framesLeft <= 0)
    {
      this.x += this.buf.x;
      this.y += this.buf.y;
      this.vis.x = this.x;
      this.vis.y = this.y;
      this.clearMoveBuffer();
      this.moving = false;

      triggerEvent("game_cursorChange", {x:this.x, y:this.y});
    }
    else
    {
      let dx = this.buf.x/this.speed;
      let dy = this.buf.y/this.speed;
      this.vis.x += dx;
      this.vis.y += dy;
      triggerEvent("game_cursorMovement", {x: dx, y: dy});
      requestAnimationFrame(() => {this.moveChain(framesLeft - 1)});
    }

  }


  
  draw(g)
  {
    let off = g.camera.offset;
    super.draw(g, 1, {x:off.x + 0.125, y:off.y + 0.125}, 1.25, this.vis.x, this.vis.y);
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

	
