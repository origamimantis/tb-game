'use strict';

class Camera
{
    constructor( mDim, wsizeX, wsizeY, x = 0, y = 0, framesToMove = 6)
    {
	this.sizeX = wsizeX;
	this.sizeY = wsizeY;
	this.xMax = mDim.x-wsizeX;
	this.yMax = mDim.y-wsizeY;
	this.xMin = 0;
	this.yMin = 0;
	this.x = x;
	this.y = y;
    }
    update(g)
    {
	if (!g.cursor.moving) {return;}
	let radx = Math.max(this.xMin, Math.min(this.xMax, g.cursor.drawx - Math.floor(this.sizeX/2)));
	if (this.xMin <= radx && radx <= this.xMax)
	{
	    this.oldx = this.x;
	    this.x = radx;
	}
	let rady = Math.max(this.xMin, Math.min(this.yMax, g.cursor.drawy - Math.floor(this.sizeY/2)));
	if (this.yMin <= rady && rady <= this.yMax)
	{
	    this.oldy = this.y;
	    this.y = rady;
	}
    }
}



export {Camera};
