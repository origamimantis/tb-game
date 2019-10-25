'use strict';


class AnimFrame
{
    // type is either "tile" or "sprite"
    constructor(name, artbook, duration = 15)
    {
	this.image = artbook.images[name];
	this.duration = duration;
	this.name = name;
	this.age = 0;
    }


}


export {AnimFrame};
