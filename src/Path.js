'use strict';

class Coord
{
  constructor(x, y)
  {
    this.x = x;
    this.y = y;
  }
  equals(crd)
  {
    return (this.x == crd.x && this.y == crd.y);
  }
  toString()
  {
    return "(" + this.x + ", " + this.y + ")p";
  }
  add(c)
  {
    this.x += c.x;
    this.y += c.y;
  }
  set(x, y)
  {
    this.x = x;
    this.y = y;
  }
}

class Path extends Array
{
    // expect array of 2-array
    constructor(path = [])
    {
	super();
	for (let i = 0; i < path.length; i++)
	{
	    this.push(new Coord(path[i].x, path[i].y));
	}
    }

    containsCoord(c)
    {
	for (let i = 0; i < this.length; i++)
	{
	    if (this[i].x == c.x && this[i].y == c.y)
	    {
		return true;
	    }
	}
	return false;
    }

    indexOf(c)
    {
	for (let i = 0; i < this.length; i++)
	{
	    if (this[i].x == c.x && this[i].y == c.y)
	    {
		return i;
	    }
	}
	return -1;
    }
    idxs( elem , start = 0)
    {
	let cnt = [];
	for (let i = start; i < this.length; ++i)
	{
	    if (this[i][0] == elem[0] && this[i][1] == elem[1] )
	    {
		cnt.push(i);
	    }   
	}   
	return cnt;
    }   


    equals(path2)
    {
	if (this.length != path2.length)
	{
	    return false;
	}
	for (let i = 0; i < this.length; i++)
	{
	    if (this[i][0] != path2[i][0] || this[i][1] != path2[i][1])
	    {
		return false;
	    }
	}
	return true;
    }
  last()
  {
    return this[this.length - 1];
  }
}




export {Path, Coord};
