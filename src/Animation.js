'use strict';

import {AnimFrame} from "./AnimFrame.js";


class Animation
{
    constructor( game, artName, weights = [], loops = true, offset = [0,0] )
    {
	this.weights = weights.slice();
	this.image = game.artbook.getImg(artName);
	this.age = 0;
	this.curFrame = 0;
	this.numFrame = weights.length;
	this.loops = loops;
	this.offx = offset[0];
	this.offy = offset[1];
    }
    pushFrame( frame )
    {
	this.frames.push( frame );
    }
    tick()
    {
	if (++this.age >= this.weights[this.curFrame])
	{
	    this.age = 0;
	    this.curFrame = (this.curFrame + 1) % (this.numFrame);
	}
    }
    reset()
    {
	this.age = 0;
	this.curFrame = 0;
    }



}


export {Animation};
