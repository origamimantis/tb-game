'use strict';

import {MapObject} from "./MapObject.js";
import {Animation} from "./Animation.js";

const LOGGING = false;

class Cursor extends MapObject
{
    constructor(g, x, y, framesToMove) // x,y determines basicaly the default camera location
    {
	super(g,x,y);

	//visuals
	this.addAnim( 0, new Animation( g, "C_c0", [30,10,10,10], true, [4,4] ));

	this.xMax = g.map.dimension.x - 1;
        this.yMax = g.map.dimension.y - 1;
	this.xMin = 0;
        this.yMin = 0;
	
	this.dx = 0;
        this.dy = 0;
        
	this.prevdelta = [0,0];

        this.oldx;
        this.oldy;
	
	this.velX = 0;
        this.velY = 0;

        this.usrftm = framesToMove;
        this.modftm = 0;
        this.ftm = framesToMove;
        this.framesMoved = 0;
	this.usrmov = true;

        this.moving = false;
	this.visible = true;

        this.logged = false;
    }
    stop()
    {
	this.moving = false;
	this.dx = 0;
	this.dy = 0;
	this.velX = 0;
	this.velY = 0;
    }
    
    move( dx, dy )
    {
        if (!this.moving)
	{
	    this.dx = dx;
	    this.dy = dy;
	}
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
    draw(ctx, s)
    {
	if (this.g.mode == "atktarget")
	{
	    let img = this.curImg();
	    let w = img.width/this.curAnim().numFrame;
	    let h = img.height;
	    let hovtile = this.g.atklist.get();
	    let x = (hovtile[0] - this.g.camera.x)*s*32 - s*this.curAnim().offx;
	    let y = (hovtile[1]- this.g.camera.y)*s*32 - s*this.curAnim().offy;
	    this.g.ctx[ctx].drawImage(img, w*this.curFrame(), 0, w, h, x, y, s*w, s*h);
	    
	
	}
	else
	{
	    super.draw(ctx, s);
	}


    }
    setVel()
    {
	if (!this.moving)
	{
	    let ftm;
	    if (this.usrmov)
	    {
		this.ftm = this.usrftm;
	    }
	    else
	    {
		this.ftm = this.modftm;
	    }
	    this.oldx = this.x;
	    this.oldy = this.y;
	    this.x = Math.max(this.xMin,Math.min(this.xMax,this.x + this.dx ) );
	    this.y = Math.max(this.yMin,Math.min(this.yMax,this.y + this.dy ) );

	    this.prevdelta = [this.x-this.oldx, this.y-this.oldy];


	    this.velX = (this.x - this.oldx)/this.ftm;
	    this.velY = (this.y - this.oldy)/this.ftm;
	    
	    if (this.velX != 0 || this.velY != 0)
	    {this.moving = true;}
	    this.dx = 0;
	    this.dy = 0;
	}
    }
    logUnit(g)
    {
	if (LOGGING)
	{
	    let u = g.map.getTile(this.x, this.y).unit;
	    if (u != null)
	    {
		console.log(u);
		this.logged = true;
	    }
	}
    }
    coords()
    {
	return [this.x,this.y];
    }
    delta()
    {
	return this.prevdelta;
    }

    update(g)
    {
	if (!this.logged && !this.moving) {this.logUnit(g);}
        //this.setVel();
        if (this.moving)
	{
	    this.g.takingArrowInput = false;
	    if (this.usrmov == false)
	    {
		this.g.takingInput = false;
	    }
	    // move cursor if it should still move.
	    if (++this.framesMoved < this.ftm)
	    {
		this.drawx += this.velX;
		this.drawy += this.velY;
	    }
	    
	    //                   >= guards frame skipping
	    if (  this.framesMoved >= this.ftm)
	    {
		this.drawx = this.x;
		this.drawy = this.y;
		this.velX = 0;
		this.velY = 0;
		this.logUnit(g);
		this.visible = true;
		if ( this.framesMoved > this.ftm)
		{
		    this.framesMoved = 0;
		    this.moving = false;
		    this.g.takingArrowInput = true;
		    if (this.usrmov == false)
		    {
			this.g.takingInput = true;
			this.usrmov = true;
		    }
		}
	    }
	}
    }
}


export {Cursor};

	
