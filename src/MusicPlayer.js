'use strict';

import {respondToEvent} from "./Utils.js";

const EXT = ".wav";


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
	await this.load("btl1", false);
	await this.load("fght",false);
	await this.load("fght2",false);
	await this.load("oss");
	await this.load("bad", false, false);
	await this.load("beep", false, false);
	await this.load("bad2", false, false);
	await this.load("beep2", false, false);
	resolve();
      }
    );
  }
  
  load( name, intro = true, loops = true)
  {
    return new Promise ( (resolve, reject) => 
      {
	let fullname = "assets/music/" + name + (loops ? "_L" : "") + EXT;
	let s = new WaudSound(fullname, {loop:loops, volume:0.5, onload : (intro ? () => {} : resolve)  });
	this.album[name] = {l:[], fade:null};
	if (intro)
	{
	    let i = new WaudSound("assets/music/" + name + "_I" + EXT, {loop:false, volume:0.5, onload : resolve});
	    i.onEnd( ()=> {this.album[name].l[1].play() });
	    this.album[name].l.push(i);
	}
	this.album[name].l.push(s);
      }
    );
  }
  play( name )
  {
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
      let cvol = this.album[name].l[0]._options.volume;
      if (cvol > 0)
      {
	  this.album[name].fade = "out";
	  let num = time/100;
	  for (let i = 0; i < num; i++)
	  {
	      setTimeout(()=>{
		  if (this.album[name].fade == "out")
		  {
		      this.setVol(name,cvol-i*(cvol/num));
		  }
			     }, i*100);
	  }
	  setTimeout(()=>{
	      if (this.album[name].fade == "out")
	      {
		  this.album[name].fade = null;
		  this.setVol(name,0);
	      }
			 }, time);
      }
  }
  fadestop( name, time = 500)
  {
      this.fadeout(name, time);
      setTimeout(()=> {this.stop(name)}, time);
  }
  playin( name, time = 500)
  {
      this.play(name);
      this.mute(name);
      this.fadein(name, time);
  }
  fadein( name, time = 500)
  {
      if (this.album[name].l[0]._options.volume == 0)
      {
	  this.album[name].fade = "in";
	  let num = time/100;
	  for (let i = 0; i < num; i++)
	  {
	      setTimeout(()=>{
		  if (this.album[name].fade == "in")
		  {
		      this.setVol(name,i*(0.5/num));
		  }
			     }, i*100);
	  }
	  setTimeout(()=>{
	      if (this.album[name].fade == "in")
	      {
		  this.album[name].fade = null;
		  this.setVol(name,0.5);
	      }
			 }, time);
      }
  }
  stop( name )
  {
      for (let a of this.album[name].l)
      {
	  a.stop();
      }
      //this.album[name][0].stop();
  }
  stopAll()
  {
      Waud.stop();
  }
}

export {MusicPlayer};
