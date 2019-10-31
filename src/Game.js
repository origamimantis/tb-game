'use strict';


import {ImageLoader} from "./ImageLoader.js";
import {KeyTracker} from "./KeyTracker.js";
import {TileMap} from "./TileMap.js";
import {Unit} from "./Unit.js";
import {Path} from "./Path.js";
import {PathFinder} from "./PathFinder.js";
import {MapObject} from "./MapObject.js";
import {Camera} from "./Camera.js";
import {Animation} from "./Animation.js";
import {AnimFrame} from "./AnimFrame.js";
import {Cursor} from "./Cursor.js";
import {MusicPlayer} from "./MusicPlayer.js";
import {Inputter} from "./Inputter.js";
import {Battle} from "./Battle.js";
import {SpriteFont} from "./SpriteFont.js";
import {Tester} from "./Tester.js";
import {LoopSelector} from "./LoopSelector.js";
import {RNG} from "./RNG.js";
import {getTile, recolor, tVC, inRange,count} from "./UsefulFunctions.js";

const LOAD_BUFFER = 50;

const C_WIDTH = 1024;
const C_HEIGHT = 768;

const SCALE = 2;

const WINDOWGRID_X = 16;
const WINDOWGRID_Y = 12;

const GRIDSIZE_X = C_WIDTH/WINDOWGRID_X;
const GRIDSIZE_Y = C_HEIGHT/WINDOWGRID_Y;
const gx = GRIDSIZE_X;
const gy = GRIDSIZE_Y;

const FPS = 60;

const FONTSIZE = "48";
const FONT = "Times New Roman";

const TICK_RATE = 1000/FPS;

const TEST_ENABLED = false;


class Game
{
    constructor( mapPath )
    {
	Waud.init();
	Waud.autoMute();

	this.test = TEST_ENABLED;
	
	//create canvas layers
	this.can = [];
	this.ctx = [];
	
	let g = document.getElementById("canvases");
	
	for (let i = 0; i <= 4; i++)
	{
	    let ncan = g.appendChild(document.createElement("canvas"));
	    ncan.id = "canvas" + i.toString();
	    ncan.width = C_WIDTH;
	    ncan.height = C_HEIGHT;
	    ncan.style.position = "absolute";
	    ncan.style.left = "0";
	    ncan.style.top = "0";
	    this.can.push(ncan);
	    this.ctx.push(ncan.getContext('2d'));
	    this.ctx[i].imageSmoothingEnabled = false;
	}
	this.ctx[3].font = FONTSIZE + "px " + FONT;
	this.sf = null;
	this.loadArt();
	this.maptheme = "btl1";
	this.btltheme = "fght2";
	this.music = new MusicPlayer();
	setTimeout( ()=>{ this.music.play(this.maptheme);},500);
	
	this.inputter = new Inputter(this);

	this.battle = new Battle(this);
	

	this.loadKeyTracker()
	this.tester = new Tester(this);

	this.testpath = new Path();

	this.loadTileMap(mapPath);
	this.units = {};
	this.inBattle = false;
	this.profileShown = false;
	this.framesPassed = 0;
	this.drawBG = true;
	
	this.curUnit = null;

	this.RNG = new RNG();

	this.loadCamera();
	this.cursor = new Cursor(this, 8,6, 6);

	this.mode = "idle";
	// "idle": no actions
	// "selecting": unit selected, movement squares shown, selecting path
	// "turnopt": unit moved, selecting actions (attack, wait)
	this.turnopt = new LoopSelector();
	this.mapopt  = new LoopSelector(["end turn"]);
	this.atklist = new LoopSelector();
	this.tmpPath = new Path();
	
	this.tmpmovcost = 0;

	this.takingInput = true;
	this.takingArrowInput = true;
	this.selectedUnit = null;

    }
    loadArt()
    {
	this.artbook = new ImageLoader();
	this.artbook.loadImgs().then(() => {this.sf = new SpriteFont(this, "F_0");} );
    }

    loadKeyTracker()
    {
	this.keyTrack = new KeyTracker();
	document.addEventListener( "keydown", ( e ) => {this.keyTrack.onKeyDown( e )} );
	document.addEventListener( "keyup", ( e ) => {this.keyTrack.onKeyUp( e )} );
	document.addEventListener( "click", ( e ) => {console.log(getTile(this, e.clientX, e.clientY, GRIDSIZE_X, GRIDSIZE_Y).unit);});
    }
    selectUnit(tile)
    {
	//hardcoded
	//this.cursor.posx = tile.x;
	//this.cursor.posy = y;
	this.drawBG = true;
	this.draw();
	if (tile.unit != null && tile.unit.canMove)
	{
	    this.selectedUnit = tile.unit;
	    this.drawBG = true;
	}
    }
    loadTileMap(mapPath)
    {
	this.pftiles;
	this.map = new TileMap( this, mapPath );
	this.pf = new PathFinder(this, this.pftiles);
	//delete this.pftiles;
    }

    loadCamera() { this.camera = new Camera(this.map.dimension, WINDOWGRID_X, WINDOWGRID_Y); }
    
    addUnit( unit )
    {
	let curTile = this.map.getTile(unit.x, unit.y);
	if ( curTile.unit == null )
	{
	    curTile.unit = unit;
	    this.units[unit.id] = unit;
	}
	else
	{
	    console.log("ERROR - attempted to add unit in position (", unit.x, ", ",unit.y,")!");
	}
    }
    drawtile( ctx, tile, art)
    {
	this.ctx[ctx].drawImage(this.artbook.getImg(art), ...tVC(this, ...tile, SCALE));

    }
    drawtiles( ctx, tiles, art)
    {
	for (let i of tiles)
	{
	    this.drawtile(ctx,i,art);
	}
    }
    drawMenu( x, y, w, h)
    {
	let e = 10*SCALE;
	this.ctx[3].drawImage(this.artbook.getImg("C_menutl"), x    , y    , e    , e    );
	this.ctx[3].drawImage(this.artbook.getImg("C_menutr"), x+w-e, y    , e    , e    );
	this.ctx[3].drawImage(this.artbook.getImg("C_menubl"), x    , y+h-e, e    , e    );
	this.ctx[3].drawImage(this.artbook.getImg("C_menubr"), x+w-e, y+h-e, e    , e    );
	
	this.ctx[3].drawImage(this.artbook.getImg("C_menuel"), x    , y+e  , e    , h-2*e);
	this.ctx[3].drawImage(this.artbook.getImg("C_menuer"), x+w-e, y+e  , e    , h-2*e);
	this.ctx[3].drawImage(this.artbook.getImg("C_menuet"), x+e  , y    , w-2*e, e    );
	this.ctx[3].drawImage(this.artbook.getImg("C_menueb"), x+e  , y+h-e, w-2*e, e    );
	
	this.ctx[3].drawImage(this.artbook.getImg("C_menucn"), x+e  , y+e  , w-2*e, h-2*e);
    }
    drawmovtag(u, x,y)
    {
	let full = u.stats.mov - this.tmpmovcost;
	this.drawMenu(x,y,gx*6, gy*3);
	this.ctx[3].drawImage(this.artbook.getImg(u.pArt),x+12*2, y+16*2, gx*2,gy*2);
	this.sf.drawText(3, u.name, x+ 86*2, y+24*2, 2);
	this.sf.drawText(3, "Mov left",     x+ 86*2, y+42*2, 2);
	this.sf.drawText(3, full,     x+ 86*2, y+60*2, 4);
    }

    drawunittag(u, x,y)
    {
	let full = u.stats.maxhp;
	let hcur = u.stats.hp;
	let sf = full.toString();
	let sc = hcur.toString();
	let dif = sf.length-sc.length
	if (dif>0) {sc = " ".repeat(dif) + sc;}
	this.drawMenu(x,y,gx*6, gy*3);
	this.ctx[3].drawImage(this.artbook.getImg(u.pArt),x+12*2, y+16*2, gx*2,gy*2);
	this.sf.drawText(3, u.name, x+ 86*2, y+24*2, 2);
	this.sf.drawText(3, "/",    x+122*2, y+42*2, 4);
	this.sf.drawText(3, sf,     x+138*2, y+42*2, 4);
	this.sf.drawText(3, sc,     x+ 86*2, y+42*2, 4);
	this.drawhealthbar(u, x+86*2, y+64*2, 86*2, 12*2);
	this.sf.drawText(3, u.weapons[0].name, x+ 86*2, y+78*2, 2);
    }
    drawhealthbar(u, x,y, w,h)
    {
	let f = u.stats.maxhp;
	let c = u.stats.hp;
	let fs = f.toString();
	let cs = c.toString();
	let d = fs.length-cs.length;
	if (d>0) {cs = " ".repeat(d) + cs;}

	this.ctx[3].drawImage(this.artbook.getImg("C_h0"), x, y, w,h);
	this.ctx[3].drawImage(this.artbook.getImg("C_h1"), x+3*2, y+3*2, (w-6*2)*(c/f), h-6*2);
    }
    drawUnitinPos(ctx,u,x,y,s)
    {
	if (1)//u.stats.hp > 0)
	{
	    u.draw(3, s, [x,y], false );
	}
    }
    drawBattleScene()
    {
	this.ctx[3].fillRect(0,0,C_WIDTH,C_HEIGHT);
	let a = this.battle.units.a;
	let d = this.battle.units.d;

	let drawdist = 2*(Math.max(1, Math.min(2, this.battle.dist)) - 1);

	a.draw(3, 4, [ gx*5 +(3-Math.abs(a.bfm - 3))*gx - drawdist*gx, gy*4] , false);
	d.draw(3, 4, [ gx*9 -(3-Math.abs(d.bfm - 3))*gx + drawdist*gx, gy*4] , false);

	let ac = a.stats.hp.toString();
	let dc = d.stats.hp.toString();

	this.drawMenu(gx*0,gy*10,gx*8, gy*2);
	this.drawMenu(gx*8,gy*10,gx*8, gy*2);

	this.sf.drawText(3, ac, 0+32*2- ac.length*8*2,gy*10+28*2, 2);
	this.sf.drawText(3, dc, gx*8+32*2 - dc.length*8*2,gy*10+28*2, 2);
	
	this.drawhealthbar(a, gx*0+40*2, gy*10+25*2, 200*2,12*2);
	this.drawhealthbar(d, gx*8+40*2, gy*10+25*2, 200*2,12*2);
	
	
	this.drawMenu(gx*0,gy*7,gx*4, gy*3);
	this.drawMenu(gx*12,gy*7,gx*4, gy*3);
	
	this.sf.drawText(3, this.battle.units.a.name,                    0    +16*2, gy*7+16*2, 2);
	this.sf.drawText(3, this.battle.units.d.name,                    gx*12+16*2, gy*7+16*2, 2);
	
	this.sf.drawText(3, "Hit  " + this.crnd(this.battle.stats.a.hit), 0    +16*2, gy*7+32*2, 2);
	this.sf.drawText(3, "Hit  " + this.crnd(this.battle.stats.d.hit), gx*12+16*2, gy*7+32*2, 2);

	this.sf.drawText(3, "Crt  " + this.crnd(this.battle.stats.a.crt), 0    +16*2, gy*7+48*2, 2);
	this.sf.drawText(3, "Crt  " + this.crnd(this.battle.stats.d.crt), gx*12+16*2, gy*7+48*2, 2);

	this.sf.drawText(3, this.battle.units.a.curWeap().name, 0    +16*2, gy*7+64*2, 2);
	this.sf.drawText(3, this.battle.units.d.curWeap().name, gx*12+16*2, gy*7+64*2, 2);

	//this.sf.drawText(3, "Atks " + count(this.battle.order, "a"), 0    +16*2, gy*7+64*2, 2);
	//this.sf.drawText(3, "Atks " + count(this.battle.order, "d"), gx*12+16*2, gy*7+64*2, 2);

	this.drawMenu(gx*4,gy*7,gx*8, gy*3);
	this.sf.drawText(3, this.battle.log, gx*4+16*2, gy*7+16*2, 2,27);

    }
    crnd(n)
    {
	let f;
	if (n > 50){f = Math.floor(n);}else{f = Math.ceil(n);}
	return f;
    }


    draw()
    {
	if (this.mode == "battling")
	{
	    this.drawBattleScene();
	    this.ctx[4].drawImage( this.can[3], 0,0,C_WIDTH,C_HEIGHT);
	}
	else
	{
	    // LAYER 0 - tilemap
	    
	    if (this.cursor.moving || this.drawBG)
	    {
		console.log("drew BG");
		this.map.draw(this, 0, SCALE);
		this.drawBG = false;
	    }

	    // LAYER 1 - movement squares
	    this.ctx[1].drawImage(this.can[0],0,0, C_WIDTH,C_HEIGHT);


	    if (["selecting", "to turnopt"].includes(this.mode))
	    {
		console.log("drew movable");
		// movable tiles
		this.drawtiles(1, this.selectedUnit.movlist, "C_move");
		
		// path gets additional highlight
		this.drawtiles(1, this.tmpPath, "C_walk");
		// unit's tile as part of path
		this.drawtile(1, this.selectedUnit.xy(), "C_walk");
		
		this.drawtiles(1, this.testpath, "C_move");
	    }
	    else if(  (this.mode=="turnopt"&&this.turnopt.get()=="attack") || this.mode == "atktarget")
	    {
		console.log("drew attackable");
		this.drawtiles(1, inRange(this.selectedUnit.destx, this.selectedUnit.desty, this.selectedUnit.curWeap().range,"tiles"), "C_atk");
	    }
	    
	    // LAYER 2 - units and cursor
	    this.ctx[2].drawImage(this.can[1],0,0, C_WIDTH,C_HEIGHT);
	    
	    for (let uid in this.units)
	    {
		console.log("drew units");
		if (this.units[uid].x != null && this.units[uid].y != null)
		{
		    this.units[uid].draw(2, SCALE);
		}
	    }
	    if (this.cursor.visible)
	    {
		console.log("drew cursor");
		this.cursor.draw(2, SCALE);
	    }
	    // LAYER 3 - info panels
	    let hoverunit = this.map.getTile(this.cursor.x, this.cursor.y).unit;
	    //console.log(this.profileShown);
	    if (this.profileShown == false)
	    {
		if (this.mode == "atktarget")
		{
		    hoverunit = this.map.getTile(...this.atklist.get()).unit;
		}
		else if (this.mode == "selecting")
		{
		    hoverunit = this.selectedUnit;
		}
		this.profileShown = true;
		this.ctx[3].clearRect(0, 0, C_WIDTH, C_HEIGHT);
		if (hoverunit != null)
		{
		    if (this.mode == "atktarget")
		    {
			this.drawunittag(this.selectedUnit, 0,0);
			this.drawunittag(hoverunit, gx*7,0);
		    }
		    else if (this.mode == "selecting")
		    {
			this.drawmovtag(hoverunit, 0,0);
		    }
		    else
		    {
			this.drawunittag(hoverunit, 0,0);
		    }
		}
	    }

	    /*if (this.inBattle)
	    {
		this.drawunittag(this.battle.units.a, 0   ,0);
		this.drawunittag(this.battle.units.d, gx*7,0);
	    }*/
	    if (this.mode == "turnopt")
	    {
		let x = gx*10;
		let y = gy*3
		this.drawMenu(x,y,gx*3, gy*this.turnopt.len*.5 +30 );
		x+= 20;
		y+= 20;
		
		for (let i = 0; i < this.turnopt.len; i++)
		{
		    this.sf.drawText(3, this.turnopt.list[i], x, y+i*gy*.5, 2);
		}
		//highlight selected option
		this.sf.drawText(3, this.turnopt.get(), x+2, y+this.turnopt.idx*gy*.5, 2);
		this.sf.drawText(3, this.turnopt.get(), x-2, y+this.turnopt.idx*gy*.5, 2);
	    }
	    else if (this.mode == "mapopt")
	    {
		let x = gx*10;
		let y = gy*3
		this.drawMenu(x,y,gx*3, gy*this.mapopt.len*.5 +30 );
		x+= 20;
		y+= 20;
		
		for (let i = 0; i < this.mapopt.len; i++)
		{
		    this.sf.drawText(3, this.mapopt.list[i], x, y+i*gy*.5, 2);
		}
		//highlight selected option
		this.sf.drawText(3, this.mapopt.get(), x+2, y+this.mapopt.idx*gy*.5, 2);
		this.sf.drawText(3, this.mapopt.get(), x-2, y+this.mapopt.idx*gy*.5, 2);
	    }

	    // LAYER FINAL
	    this.ctx[4].drawImage( this.can[2], 0,0,C_WIDTH,C_HEIGHT);
	    this.ctx[4].drawImage( this.can[3], 0,0,C_WIDTH,C_HEIGHT);
	}
    }
    
    fight( attacker, defender)
    {
	if (attacker == undefined || defender == undefined) { return; }
	this.battle.fight(attacker, defender);
    }

    movCursor()
    {
	this.pf.movCursor();
    }






    update()
    {
	this.inputter.handleInput();
	//this.drawBG = (this.cursor.update( this ) || this.cursor.moving || this.framesPassed == 0);
	this.cursor.update( this );
	this.cursor.tickAnim();
	this.movCursor();
	this.camera.update(this);
	if (this.selectedUnit != null && this.selectedUnit.moving)
	{
	    this.selectedUnit.update();
	}
	for (let u of Object.values(this.units))
	{
	    u.tickAnim();
	    if (u.moving || u.isboop) {u.update();}
	}
	this.framesPassed ++;
    }
    loadloop()
    {
	if (this.artbook.loaded < this.artbook.toload || this.sf == null)
	{
	    setTimeout( () => {requestAnimationFrame(() => {this.loadloop()});}, 50);
	}
	else
	{
	    setTimeout( () => {requestAnimationFrame(() => {this.loop()});}, TICK_RATE);
	}
    }

    loop()
    {
	//setTimeout( () => {requestAnimationFrame(() => {this.loop()});}, TICK_RATE);
	requestAnimationFrame(() => {this.loop()});
	this.update();
	this.draw();
    }
    mainloop()
    {
	// add timer to load
	setTimeout( () => { this.loadloop();}, LOAD_BUFFER);
    }
    //-1 <= xThres && xThres <= PLAY_GRID_X_NUM && -1 <= yThres && yThres <= PLAY_GRID_Y_NUM

}

export {Game, FPS};
