'use strict';

import {MapObject} from "./MapObject.js";
import {Path} from "./Path.js";
import {recolor} from "./UsefulFunctions.js";
import {Weapons} from "./Weapon.js";

// for movement speed in terms of animation
const ftm = 6;
const vel = 1/ftm;

class Unit extends MapObject
{
    constructor( g, id, x, y, caps, stats, name = ("Unit "+id), classname = "Unit", pArt = "gen", color = [255,0,0],)
    {
	super( g, x, y );
	this.id = id;
	this.name = name;
	this.classname = classname;
	this.pArt = pArt;
	
	this.caps = caps;
	this.stats = stats;
	
	this.weapons = [];
	
	this.movcost = {"0":1,"1":2};
	this.movlist = [];
	
	this.color = color;
	
	this.canMove = true;
	
	this.moving = false;
	this.inCombat = false;
	this.vx = 0;
	this.vy = 0;
	
	this.destx = 0;
	this.desty = 0;
	
	this.bfm = 0;
	this.isboop = false;
	this.boopdir = [0,0];
	
	this.fm = 0;
	this.pausedur = 0;
    }
    curWeap()
    {
	if (this.weapons.length == 0)
	{
	    return new Weapons.NoWeapon();
	}
	else
	{
	    return this.weapons[0];
	}
    }
    setColor(color)
    {
	this.color = color;
        for (let a in this.animations)
        {
            this.recolorAnim(a);
        }
    }
    turnInit()
    {
	this.curAnim().reset();
	this.resetDest();
	this.canMove = true;
	this.pauseAnim = false;
	this.bgmovable();
    }
    draw( ctx, s, drawpos = [], healthbar = false)
    {
	
	let img = this.curImg();
	let w = img.width/this.curAnim().numFrame;
	let h = img.height;
	let x;
	let y;
	if (drawpos.length != 2)
	{
	    x = (this.drawx - this.g.camera.x)*s*w;
	    y = (this.drawy - this.g.camera.y)*s*h;
	}
	else
	{
	    [x,y] = drawpos;
	}

        this.g.ctx[ctx].drawImage(img, w*this.curFrame(), 0, w, h, x, y, s*w, s*h);
	
	if (this.inCombat && drawpos.length != 2)
	{
	    this.g.ctx[ctx].drawImage(this.g.artbook.getImg("C_h0"),
		x+ 0.05*s*w, y+1.1*s*h, 0.9*s*w, 0.2*s*h);
	    this.g.ctx[ctx].drawImage(this.g.artbook.getImg("C_h1"),
		x+ 0.1*s*w, y+1.15*s*h, 0.8*s*w*(this.stats.hp/this.stats.maxhp), 0.1*s*h);
	}
    }
    resetDest()
    {
	this.drawx = this.x;
	this.drawy = this.y;
    }

    confirmMove()
    {
	// remove unit from map...
	this.g.map.getTile(this.x,this.y).unit = null;
	// update its position...
	this.x = this.destx;
	this.y = this.desty;
	// and add it back
	this.g.map.getTile(this.x,this.y).unit = this;
    }
    wait()
    {
	this.pauseAnim = true;
	this.curAnim().curframe = 0;
	this.canMove = false;
	console.log(this.name + " ended turn.");
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
    async bgmovable(range = null, x = this.x, y = this.y)
    {
	return this.movable(range, x,y);
    }
    movable(range = null, x = this.x, y = this.y)
    {
	let rng = range;
	if (range == null) {rng = this.stats.mov;}
        let t = this._movable(x,y,rng, 0,0, {});
        let n = new Path;
	t.push([x, y]);
        for (let i of t)
        {
            if (!n.contains(i))
            {  n.push(i);}
        }
	
	// default will modify movepath
	if (range == null)
	{
	    this.movlist = n;
	}
	// otherwise, functions as a getter function
	else
	{
	    return n;
	}
    }
    
    _movable(cx, cy, mov, dx = 0, dy = 0, movtrack = {})
    {
        let tiles = new Path;
        if (dx != 1)
        {   
            this._movableHelper(tiles, cx, cy,-1, 0,mov,this.g.map, movtrack);
        }
	if (dx != -1)
        {   
            this._movableHelper(tiles, cx, cy, 1, 0,mov,this.g.map, movtrack);
        }
        if (dy != 1)
        {   
            this._movableHelper(tiles, cx, cy, 0,-1,mov,this.g.map, movtrack);
        }
	if (dy != -1)
        {   
            this._movableHelper(tiles, cx, cy, 0, 1,mov,this.g.map, movtrack);
        }
        return tiles;
    }

    _movableHelper(tiles, cx, cy, dx, dy, mov, tilemap, movtrack) 
    {
	let tent = [cx+dx, cy+dy];
        let tile = tilemap.getTile(...tent);
	if (tile == null) { return; }
	let newmov  = mov - this.movcost[ tile.tile ];
        if (newmov >= 0)
	{
	    let ts = tent.toString();
	    if (movtrack[ts] == undefined)
	    {
		tiles.push(tent);
		movtrack[ts] = 0;
	    }
	    if (movtrack[ts] < newmov)
	    {
		movtrack[ts] = newmov;
		tiles.push(...this._movable(...tent, newmov, dx, dy, movtrack));
	    }
	}
    }
    boop(unit)
    {
	this.isboop = true;
	this.bfm = 0;
	this.boopdir = [unit.x,unit.y];
    }
    move( x,y, path = null , ignoremov = false)
    {
	// check if final pos is in move range
	if (!this.movlist.contains([x,y]))
	{
	    // if so, check if ignore move limit is enabled (for cutscenes and stuff)
	    if (ignoremov == false)
	    {
		return -1;
	    }
	}
	
	// remove unit
	this.moving = true;
	this.destx = this.x;
	this.desty = this.y;
	this.movpath = path.slice(0);
    }

    // only used during move.
    update()
    {
        if (this.moving)
        {
            if (this.fm == 0)
	    {

		if (this.pausedur == 0)
		{
		    if (this.movpath.length == 0)
		    {
			// we made it!
			this.moving = false;
			this.g.mode = "turnopt";
			this.g.drawBG = true;
			
			return;
		    }
		    let dest = this.movpath.shift();

		    this.vx = (dest[0] - this.destx)*vel;
		    this.vy = (dest[1] - this.desty)*vel;

		    this.destx  = dest[0];
		    this.desty  = dest[1];
		}
		else
		{
		    this.pausedur -= 1;
		    if (this.pausedur < 0) {this.pausedur = 0; }
		}
	    }

            // move cursor if it should still move.
	    this.drawx += this.vx;
	    this.drawy += this.vy;

            if (++this.fm == ftm)
            {
                // I don't trust floats lmao, don't want to set to this.x to remove dependency
                this.drawx = Math.round(this.drawx);
                this.drawy = Math.round(this.drawy);
                this.vx = 0;
                this.vy = 0;
                this.fm = 0;
            }
        }
	//slight movement
	if (this.isboop)
	{
	    if (this.bfm == 0)
            {
		let vex = (this.boopdir[0] - this.x);
		let vey = (this.boopdir[1] - this.y);
		let d = Math.sqrt( Math.pow( vex,2 ) + Math.pow(vey,2 ) );
		this.vx = vex/d*vel;
		this.vy = vey/d*vel
            }
	    if (this.bfm == 3)
	    {
		this.vx *= -1;
		this.vy *= -1;
	    }

            // move cursor if it should still move.
            this.drawx += this.vx;
            this.drawy += this.vy;

            if (++this.bfm == ftm)
            {
		this.isboop = false;
		this.g.drawBG = true;
                // I don't trust floats lmao, don't want to set to this.x to remove dependency
                this.drawx = Math.round(this.drawx);
                this.drawy = Math.round(this.drawy);
                this.vx = 0;
                this.vy = 0;
                this.bfm = 0;
            }
	}


    }

	

}

export {Unit};
