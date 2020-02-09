'use strict';

import {AnimatedObject} from "./AnimatedObject.js";
import {Path} from "./Path.js";
import {recolor} from "./UsefulFunctions.js";
import {Weapons} from "./Weapon.js";

// for movement speed in terms of animation
const ftm = 6;
const vel = 1/ftm;

class Unit extends AnimatedObject
{
    constructor(id, x, y, caps, stats, name = ("Unit "+id), classname = "Unit", pArt = "gen", color = [255,0,0],)
    {
	super( x, y );
	this.x = x;
	this.y = y;
	this.id = id;
	this.name = name;
	this.classname = classname;
	this.pArt = pArt;
	
	this.caps = caps;
	this.stats = stats;
    }
    setColor(color)
    {
	this.color = color;
        for (let a in this.animations)
        {
            this.recolorAnim(a);
        }
    }
    
    draw( g )
    {
      let img = g.Album.get(this.curImg());

      let w = img.width/this.curAnim().numFrame;
      let h = img.height;

      let x = this.x*g.grid.x;
      let y = this.y*g.grid.y;

      g.ctx[1].drawImage(img, w*this.curFrame(), 0, w, h, x, y, g.grid.x, g.grid.y);
    }
    xy()
    {
	return [this.x, this.y];
    }
    recolorAnim(a)
    {
	let t = recolor(this, this.animations[a].image);
	if (t == null)
	{
	    setTimeout( () => {this.recolorAnim( a )}, 50);
	}
	else
	{
	    this.animations[a].image = t;
	}
    }
    

	

}

export {Unit};
