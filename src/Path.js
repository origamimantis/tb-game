'use strict';


class Path extends Array
{
    // expect array of 2-array
    constructor(path = [])
    {
	super();
	for (let i = 0; i < path.length; i++)
	{
	    this.push(path[i]);
	}
    }

    //element will be 2-array
    contains(elem)
    {
	for (let i = 0; i < this.length; i++)
	{
	    if (this[i][0] == elem[0] && this[i][1] == elem[1])
	    {
		return true;
	    }
	}
	return false;
    }
    indexOf(elem)
    {
	for (let i = 0; i < this.length; i++)
	{
	    if (this[i][0] == elem[0] && this[i][1] == elem[1])
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
}




export {Path};
