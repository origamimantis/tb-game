'use strict';
const LOGKEYS = false;

class KeyTracker
{
    constructor()
    {
	this.pressed = {}
	this.pressOnce = {};
    }

    isDown( keyCode )
    {
	return this.pressed[keyCode];
    }
    onKeyDown( e )
    {
	if (LOGKEYS)
	{
	    console.log("dn: ",e.code);
	}
	if (!(this.pressOnce[e.code]))
	{
	    this.pressed[e.code] = true;
	}
    }
    onKeyUp( e )
    {
	if (LOGKEYS)
	{
	    console.log("up: ",e.code);
	}
	delete this.pressed[e.code];
	delete this.pressOnce[e.code];
    }
    disableUntilUp( e )
    {
	delete this.pressed[e];
	this.pressOnce[e] = true;
    }
}


export {KeyTracker};
