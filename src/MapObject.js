'use strict';

let MapObject = class
{
    constructor( g, x = null, y = null )
    {
	this.x = x;
	this.y = y;
	this.drawx = x;
	this.drawy = y;
	this.g = g;
	this.animations = {};
	this.curAnimName = 0;
	this.pauseAnim = false;
    }
    curAnim()
    {
	return this.animations[this.curAnimName];
    }
    curFrame()
    {
	return this.curAnim().curFrame;
    }
    curImg()
    {
	return this.curAnim().image;
    }
    draw( ctx, s )
    {
        let img = this.curImg();
        let w = img.width/this.curAnim().numFrame;
	let h = img.height;
	let x = (this.drawx - this.g.camera.x)*s*32 - s*this.curAnim().offx;
        let y = (this.drawy - this.g.camera.y)*s*32 - s*this.curAnim().offy;
        this.g.ctx[ctx].drawImage(img, w*this.curFrame(), 0, w, h, x, y, s*w, s*h);

    }
    addAnim( name, anim )
    {
	this.animations[name] = anim;
    }
    tickAnim()
    {
	if (!this.pauseAnim)
	{
	    this.curAnim().tick();
	}
    }

}

export {MapObject};
