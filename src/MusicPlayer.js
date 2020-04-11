'use strict';

import {respondToEvent, waitTime} from "./Utils.js";

const EXT = ".wav";

/*
play( name )
unmute( name )
mute( name )
setVol(name, vol)
fadeout( name , time = 500)
fadestop( name, time = 500)
playin( name, time = 500)
fadein( name, time = 500)
stop( name )
stopAll()
*/




class MusicPlayer
{
    
  constructor()
  {
    this.album = {};
    respondToEvent("sfx_play_beep_effect", () => {this.play("beep2");});
    respondToEvent("sfx_play_err_effect", () => {this.play("bad2");});
  }
  loadMusic()
  {
    return new Promise( async (resolve, reject) =>
      {
	// load(name, hasIntro = true, loops = false)
	await this.load("btl1", false);
	await this.load("btl_en", false);
	await this.load("fght",false);
	await this.load("fght2",false);
	await this.load("oss");
	await this.load("bad", false, false);
	await this.load("beep", false, false);
	await this.load("bad2", false, false);
	await this.load("beep2", false, false);
	await this.load("whack", false, false);
	resolve();
      }
    );
  }
  
  load( name, intro = true, loops = true)
  {
    return new Promise ( (resolve, reject) => 
      {
	let fullname = "assets/music/" + name + (loops ? "_L" : "") + EXT;
	let s = new WaudSound(fullname,
	  {
	    loop: loops,
	    volume: 0.5,
	    onload : (intro ? () => {} : () => {console.log(name + " loaded"); resolve();})
	  }
	);
	this.album[name] = {l:[], fade:null};

	if (intro)
	{
	  let i = new WaudSound("assets/music/" + name + "_I" + EXT,
	    {
	      loop: false,
	      volume: 0.5,
	      onload : () => {console.log(name + " loaded"); resolve();}
	    }
	  );
	  i.onEnd( ()=> {this.album[name].l[1].play() });
	  this.album[name].l.push(i);
	}
	this.album[name].l.push(s);
      }
    );
  }
  play( name )
  {
    this.setVol(name, 0.5)
    this.album[name].l[0].play();
  }
  unmute( name )
  {
    this.setVol(name,0.5);
  }
  mute( name )
  {
    this.setVol(name,0);
  }
  setVol(name, vol)
  {
    for (let a of this.album[name].l)
    {
      a.setVolume(vol);
    }
  }
  fadeout( name , time = 500)
  {
    return new Promise( async (resolve)=>
      {
	let cvol = this.album[name].l[0]._options.volume;
	if (this.album[name].fade == null && cvol > 0)
	{
	  this.album[name].fade = "out";
	  let num = time/100;
	  for (let i = 0; i < num; i++)
	  {
	    this.setVol(name,cvol*(1-i/num));
	    await waitTime(100);;
	  }
	  this.setVol(name,0);
	  this.album[name].fade = null;
	}
	resolve();
      });
  }
  fadestop( name, time = 500)
  {
    return new Promise( async (resolve)=>
      {
	await this.fadeout(name, time);
	this.stop(name);
	resolve();
      }
    );
  }
  playin( name, time = 500)
  {
    return new Promise( async (resolve)=>
      {
	this.play(name);
	this.mute(name);
	await this.fadein(name, time);
	resolve();
      }
    );
  }
  fadein( name, time = 500)
  {
    return new Promise( async (resolve)=>
      {
	let cvol = this.album[name].l[0]._options.volume;
	if (this.album[name].fade == null && cvol < 0.5)
	{
	  this.album[name].fade = "in";
	  let num = time/100;
	  for (let i = 0; i < num; i++)
	  {
	    this.setVol(name, (0.5-cvol)*i/num );
	    await waitTime(100);;
	  }
	  this.setVol(name,0.5);
	  this.album[name].fade = null;
	}
	resolve();
      });

  }
  stop( name )
  {
    for (let a of this.album[name].l)
    {
      a.stop();
    }
  }
  stopAll()
  {
    Waud.stop();
  }
}

export {MusicPlayer};
