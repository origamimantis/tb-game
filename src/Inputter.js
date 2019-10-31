'use strict';

const SELECT = "Period";
const CANCEL = "Comma";


import {getTile, inRange} from "./UsefulFunctions.js";
import {LoopSelector} from "./LoopSelector.js";

class Inputter
{
    constructor(g)
    {
	this.g = g;
	this.inputted = false;
	this.bufx = 0;
	this.bufy = 0;
    }

    handleInput()
    {
	this.inputted = false;
        if (this.g.takingInput)
        {
	    this.selection();
	    this.cancel();
	    if (this.g.takingArrowInput)
	    {
		this.arrows();
		this.g.cursor.setVel();
	    }
        }
        if (this.g.keyTrack.isDown("KeyL"))
	{
	    this.g.tester.action();
	}
        if (this.g.keyTrack.isDown("KeyR"))
	{ 
	    for (let i of Object.values(this.g.units))
	    {
		i.turnInit();
	    }
	}
    }

    arrows()
    {
	if(this.g.keyTrack.isDown("ArrowUp"   )||this.g.keyTrack.isDown("KeyW"))
	{
	    this._arrow(0,-1);
	}
	if(this.g.keyTrack.isDown("ArrowDown" )||this.g.keyTrack.isDown("KeyS"))
	{
	    this._arrow(0, 1);
	}
	if(this.g.keyTrack.isDown("ArrowLeft" )||this.g.keyTrack.isDown("KeyA"))
	{
	    this._arrow(-1,0);
	}
	if(this.g.keyTrack.isDown("ArrowRight")||this.g.keyTrack.isDown("KeyD"))
	{
	    this._arrow(1,0);
	}
	this.bufx = Math.min(1, Math.max(-1, this.bufx));
	this.bufy = Math.min(1, Math.max(-1, this.bufy));
	this.g.cursor.move(this.bufx, this.bufy);
	this.bufx = 0;
	this.bufy = 0;
    }
    selection()
    {
	if (this.g.keyTrack.isDown(SELECT))
	{
	    console.log(this.g.mode);
	    this.inputted = true;
	    this.g.keyTrack.disableUntilUp(SELECT);
	    let coords = this.g.cursor.coords();
	    let unit = this.g.selectedUnit;
    /*@ IDLE*/
	    if      (this.g.mode == "idle")
	    {
		this.g.selectUnit(this.g.map.getTile( ...coords));
		if (this.g.selectedUnit != null)
		{
		    this.g.mode ="selecting";
		}
		else
		{
		    this.g.mode = "mapopt";
		}
	    }
    /*@ MAPOPT*/
	    else if (this.g.mode == "mapopt")
	    {
		let option = this.g.mapopt.get();
		if (option == "end turn")
		{
		    for (let unit of Object.values(this.g.units))
		    {
			unit.turnInit();
		    }
		}
		this.g.mode = "idle";
		this.g.profileShown = false;
	    }
    /*@ SELECTING*/
	    else if (this.g.mode == "selecting")
	    {
		let u = this.g.map.getTile(...coords).unit;
		if (unit.movlist.contains(coords) && (u == null || u.id == unit.id ) )
		{
		    //this.g.cursor.stop();
		    //feeds move a copy of the path
		    this.g.selectedUnit.move( ...coords, this.g.tmpPath);
		    this.g.mode = "to turnopt";
		    this.g.tmpmovcost = 0;
		    //set after unit.move
		    let newspot;
		    if (this.g.tmpPath.length == 0)
		    {   newspot = this.g.selectedUnit.xy();}
		    else
		    {   newspot = this.g.tmpPath[this.g.tmpPath.length - 1];}
		    
		    //later add 'attack' after confirming attackable units
		    //this.g.test = inRange(this.g.selectedUnit.x, this.g.selectedUnit.y, 2, this.g.map);
		    
		    this.g.atklist = new LoopSelector(
			inRange(...newspot, this.g.selectedUnit.curWeap().range, "units",this.g.map,
			[(u)=>{return this.g.selectedUnit.id != u.id;}]));
		    let l = ["wait"];
		    if (this.g.atklist.len > 0){ l.unshift("attack");}
		    this.g.turnopt = new LoopSelector(l);
		    this.g.profileShown = false;
		    console.log(this.g.selectedUnit.name + " awaiting orders.");
		}
	    }
    /*@ TURNOPT*/
	    else if (this.g.mode == "turnopt")
	    {
		let option = this.g.turnopt.get();
		if (option == "wait")
		{
		    //now clear temps
		    this.g.tmpPath.splice(0);
		    
		    //this.g.selectedUnit.endmove();
		    this.g.mode = "idle";
		    
		    this.g.selectedUnit.confirmMove();
		    this.g.selectedUnit.wait();
		    this.g.selectedUnit = null;

		    this.g.profileShown = false;
		}
		else if (option == "attack")
		{
		    //this.g.tmpPath.splice(0);
		    //selecttarget()
		    this.g.mode = "atktarget";
		    
		    //console.log(this.g.atklist.list);
		    //this.g.selectedUnit.confirmMove();
		    //this.g.selectedUnit = null;

		    this.g.profileShown = false;
		}

	    }
    /*@ ATKTARGET*/
	    else if (this.g.mode == "atktarget")
	    {
		
		// initialize battle
		let targ = this.g.map.getTile(...this.g.atklist.get()).unit;
		//now clear temps
		this.g.mode = "battling";
		//update x,y
		this.g.selectedUnit.confirmMove();

		this.g.fight( this.g.selectedUnit, targ);
		this.g.tmpPath.splice(0);
		
		this.g.music.fadeout(this.g.maptheme,250);
		this.g.music.playin(this.g.btltheme,0);
		//this.g.selectedUnit.wait();
		this.g.selectedUnit = null;
		this.g.turnopt = new LoopSelector()
		this.g.atklist = new LoopSelector()
		
		this.g.profileShown = false;
		
	    }





	}
    }
    cancel()
    {
        if (this.g.keyTrack.isDown(CANCEL))
	{
	    console.log("cancel!");
	    this.inputted = true;
	    this.g.keyTrack.disableUntilUp(CANCEL);
	    if (this.g.mode == "mapopt")
	    {
		this.g.mode = "idle"
		this.g.profileShown = false;
	    }
	    else if (this.g.mode == "selecting")
	    {
		this.g.selectedUnit.resetDest();
		this.g.mode = "idle"
		this.g.profileShown = false;
		this.g.cursor.stop();
		this.g.cursor.setMotion(this.g.selectedUnit.x, this.g.selectedUnit.y,40);
		this.g.selectedUnit = null;
		this.g.tmpPath.splice(0);
		this.g.tmpmovcost = 0;
	    }
	    else if (this.g.mode == "turnopt")
	    {
		this.g.selectedUnit.resetDest();
		this.g.mode = "selecting"
		this.g.profileShown = false;
		this.g.turnopt.reset();
	    }
	    else if (this.g.mode == "atktarget")
	    {
		this.g.mode = "turnopt"
		this.g.profileShown = false;
		this.g.atklist.reset();
	    }
	}


    }
    _arrow(dx,dy)
    {
	if      (this.g.mode == "idle"     )
	{
	    this.bufx += dx;
	    this.bufy += dy;
	    this.inputted = true;
	    this.g.profileShown = false;
	}
	else if (this.g.mode == "selecting")
	{
	    this.bufx += dx;
	    this.bufy += dy;
	    this.inputted = true;
	    this.g.profileShown = false;
	}
	else if (this.g.mode == "mapopt"  )
	{
	    if      (dy == -1)
	    {
		this.g.keyTrack.disableUntilUp("ArrowDown");this.g.keyTrack.disableUntilUp("KeyS");
		this.g.mapopt.next();
		this.inputted = true;
	    }
	    else if (dy ==  1)
	    {
		this.g.keyTrack.disableUntilUp("ArrowUp"  );this.g.keyTrack.disableUntilUp("KeyW");
		this.g.mapopt.prev();
		this.inputted = true;
	    }

	}

	else if (this.g.mode == "turnopt"  )
	{
	    if      (dy == -1)
	    {
		this.g.keyTrack.disableUntilUp("ArrowDown");this.g.keyTrack.disableUntilUp("KeyS");
		this.g.turnopt.next();
		this.inputted = true;
	    }
	    else if (dy ==  1)
	    {
		this.g.keyTrack.disableUntilUp("ArrowUp"  );this.g.keyTrack.disableUntilUp("KeyW");
		this.g.turnopt.prev();
		this.inputted = true;
	    }

	}
	else if (this.g.mode == "atktarget"  )
	{
	    if (dy == -1)
	    {
		this.g.keyTrack.disableUntilUp("ArrowDown");this.g.keyTrack.disableUntilUp("KeyS");
		this.g.atklist.next();
		this.g.profileShown = false;
		this.inputted = true;
	    }
	    if (dy ==  1)
	    {
		this.g.keyTrack.disableUntilUp("ArrowUp"  );this.g.keyTrack.disableUntilUp("KeyW");
		this.g.atklist.prev();
		this.g.profileShown = false;
		this.inputted = true;
	    }
	    if (dx ==  1)
	    {
		this.g.keyTrack.disableUntilUp("ArrowRight");this.g.keyTrack.disableUntilUp("KeyD");
		this.g.atklist.next();
		this.g.profileShown = false;
		this.inputted = true;
	    }
	    if (dx == -1)
	    {
		this.g.keyTrack.disableUntilUp("ArrowLeft"  );this.g.keyTrack.disableUntilUp("KeyA");
		this.g.atklist.prev();
		this.g.profileShown = false;
		this.inputted = true;
	    }
	}

    }



}


export {Inputter};
