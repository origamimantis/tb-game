'use strict';

import {AnimatedObject} from "./AnimatedObject.js";
import {Animation} from "./Animation.js";

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
    if (this.moving == false)
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
      this.triggerMove = false;
      this.moving = true;
      this.moveChain(this.speed);
    }
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

      requestAnimationFrame(() => {this.moving = false;});
    }
    else
    {
      this.vis.x += this.buf.x/this.speed;
      this.vis.y += this.buf.y/this.speed;
      requestAnimationFrame(() => {this.moveChain(framesLeft - 1)});
    }

  }


  
  draw(g, ctx, s)
  {
    super.draw(g, ctx, s, this.vis.x, this.vis.y);
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

	
