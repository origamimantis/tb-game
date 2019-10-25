'use strict';


class PathFinder
{
    constructor( g, tiles )
    {
	this.g = g;
	this.As = new EasyStar.js();
	this.As.setGrid(tiles);
    }
    
    movCursor()
    {
        if (this.g.inputter.inputted && this.g.mode == "selecting")
        {
            //assumes selected unit
            let unit = this.g.selectedUnit;
            let curpos = this.g.cursor.coords();
            let tp = this.g.tmpPath;
            let nomov = (curpos[0] == unit.x && curpos[1] == unit.y);

            if (unit.movlist.contains(curpos))
            {
                // Check if the path loops
                let i = tp.indexOf(curpos);
                // if curpos appears in path OR it is on the original location
                if ( i != -1 || nomov)
                {
                    // if nomov (current coord in unit's original location), set i to clear entire path
                    if (nomov)
		    {
			i = 0;
		    }
                    // remove everything after that index
                    tp.splice(i);
                    // re-sum the movecost
                    this.g.tmpmovcost = 0;
                    for (let t = 0; t < tp.length; t++)
                    {
			this.g.tmpmovcost += unit.movcost[this.g.map.getTile(...tp[t]).tile];
		    }
                }
                // determine if walkable
                let mc = unit.movcost[ this.g.map.getTile(...curpos).tile ];
                
		// last is the furthest point in the unit's path; moving the cursor will
		// attempt to modify this path before resorting to A*
                let last = (tp.length > 0) ? tp[tp.length-1] : unit.xy();
		
		// find distance between cur and prev tile; if > 1 then must've jumped, so use A*
                let dist = Math.sqrt( Math.pow(curpos[0]-last[0], 2) + Math.pow(curpos[1]-last[1], 2) );
                let cursdiag = (this.g.cursor.prevdelta[0] != 0 && this.g.cursor.prevdelta[1] != 0);

                // note - nomov is slightly different than dist == 0; do not change this.g
                if (nomov) {}
		// if movement allows and the cursor did not move diagonally, then no need for A*
                else if (this.g.tmpmovcost + mc <= unit.stats["mov"] && dist == 1 && !cursdiag)
                {
		    // add to move cost and append to path.
		    // note - this will not cause another loop because
		    // tp was sliced to exclude the first occorence of the current position.
                    this.g.tmpmovcost += mc;
                    tp.push(curpos);
                }
                else
                {
		    let movl;
		    let begin;
		    switch(this.g.tmpPath.length != 0)
		    {
			// partial A*
			case true:
			    let leftover = unit.stats["mov"]-this.g.tmpmovcost;
			    let largest = this.largestwalkable(unit, 500);

			    // calculate at most 2 tiles worth of the most expensive
			    // non-wall tile in the unit's movcost
			    // this avoids significant lag with units with higher mov (> 30)
			    let wreg = Math.min(leftover, 2*largest);
			    
			    movl = unit.movable(wreg, ...last);
			    
			    //this.g.testpath = movl;
			    
			    // begin A* search at last position of path
			    begin = last;
			    
			    // if curpos is within the search region,
			    // leave switch and begin A*. Otherwise, flow into next case.
			    if (movl.contains(curpos))
			    {
				break
			    }
			// total A*
			case false:
			    // set entire path for A* as opposed to a section.
			    movl = unit.movlist.slice(0);
			    begin = [unit.x, unit.y];
			    tp.splice(0);
		    }

		    this.As.setAcceptableTiles(Object.keys(unit.movcost));

		    for (let [tile,cost] of Object.entries(unit.movcost))
		    {
			this.As.setTileCost(tile,cost);
		    }
		    this.As.findPath(...begin, ...curpos,  ( path ) => 
		    {
			for (let i = 1; i < path.length; i++)
			{
			    // re-reverse the coords
			    tp.push([path[i].x, path[i].y]);
			}
		
			this.removeloop( tp )
			this.g.tmpmovcost = 0;
			for (let t = 0; t < tp.length; t++)
			{
			    this.g.tmpmovcost += unit.movcost[this.g.map.getTile(...tp[t]).tile];
			}
			this.g.profileShown = false;
		    });
		    this.As.calculate();
                }
            }
        }
    }
    
    largestwalkable(unit, limit)
    {
	let l = 0;
	for (let movreq of Object.values(unit.movcost))
	{
	    if (movreq <500 && movreq > l)
	    {
		l= movreq;
	    }
	}
	return l;
    }
    removeloop( tp )
    {
	for (let i = 0; i < tp.length; ++i)
	{
	    let is = tp.idxs(tp[i], i);
	    if (is.length > 1)
	    {
		let howmany = is[is.length-1] - is[0];
		tp.splice(is[0], howmany);
	    }
	}
    }



}

export {PathFinder};
