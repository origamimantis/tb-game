'use strict';
import {Path} from "./Path.js";


function recolor(u,img)
{
    if (!img.complete) {return null;}
    let c = document.createElement("canvas");
    let ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    //let w = bw;
    let w = img.width;
    let h = img.height;

    c.width = w;
    c.height = h;
    
    ctx.drawImage(img, 0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    
    let imageData = ctx.getImageData(0, 0, w, h);

    // examine every pixel, 
    // change any old rgb to the new-rgbc
    
    for (var i=0;i<imageData.data.length;i+=4)
    {
	// is this pixel the old rgb?
	if(imageData.data[i]==1 && imageData.data[i+1]==253 && imageData.data[i+2]==40)
	{
	    imageData.data[i]=u.color[0];imageData.data[i+1]=u.color[1];imageData.data[i+2]=u.color[2];
	}
    }
    // put the altered data back on the canvas  
    ctx.putImageData(imageData,0,0);
    
    // put the re-colored image back on the image
    let nImg = new Image();
    nImg.src = c.toDataURL('image/png');
    return nImg;

}

function getTile(g, xPx, yPx, gx, gy)
{
    console.log(Math.floor(xPx/gx+ g.camera.x), Math.floor(yPx/gy+g.camera.y) );
    return g.map.getTile(Math.floor(xPx/gx+ g.camera.x), Math.floor(yPx/gy+g.camera.y) );
}

function tVC(g,x,y,s)
{
    return [(x-g.camera.x)*32*s, (y-g.camera.y)*32*s, 32*s,32*s]
}

function ASubGrid(map, movlist, orig)
{
    let xmax = null;
    let xmin = null;
    let ymax = null;
    let ymin = null;
    for (let i = 0; i < movlist.length; i++)
    {
	let x = movlist[i][0];
	let y = movlist[i][1];
	if (xmax == null || x > xmax) { xmax = x; }
	if (xmin == null || x < xmin) { xmin = x; }
	if (ymax == null || y > ymax) { ymax = y; }
	if (ymin == null || y < ymin) { ymin = y; }
    }
    let grid = []
    for (let i = 0; i < xmax-xmin+1; i++)
    {
	let row = [];
	for (let j = 0; j < ymax-ymin+1; j++)
	{
	    if (movlist.contains([xmin + i, ymin + j]))
	    {
		row.push(map.getTile(xmin+i,ymin+j).tile);
	    }
	    else
	    {
		row.push(1000);
	    }
	}
	grid.push(row);
    }
    return [grid, xmin, ymin];
}

function inRange(x,y,range,type, map, conditions = [(x)=>{return true}])
{
    let adder;
    if (type == "units")
    {
	adder = _uir;
    }
    else if (type == "tiles")
    {
	adder = _ir;
    }
    let t = new Path();
    if (range.length > 1)
    {
	let max = range[1];
    }
    if (range.max < range.min)
    {
	throw new Error("UnitAttackRangeError");
    }
    for (let r = range.min; r < range.max + 1; r++)
    {
	for (let i = 0; i < r; i++)
	{
	    adder(x+r-i, y-i  , t,map, conditions);
	    adder(x-r+i, y+i  , t,map, conditions);
	    adder(x+i  , y+r-i, t,map, conditions);
	    adder(x-i  , y-r+i, t,map, conditions);
	}
    }
    return t;
}
function _ir(x,y,t)
{
    t.push([x,y]);
}
function _uir(x,y, t,map, conditions)
{
    let tl = map.getTile(x, y);
    if (tl != null && tl.unit != null && all( conditions, tl.unit))
    {
	t.push([x,y]);
    }
}

function all(conditions, param)
{for (let f of conditions){if (!f(param)){return false;}}return true;}


function count( arr, elem , start = 0)
{
    let cnt = 0;
    for (let i = start; i < arr.length; ++i)
    {
	if (arr[i] == elem)
	{
	    cnt ++;
	}
    }
    return cnt;
}

export {getTile, recolor, tVC, inRange, count};
