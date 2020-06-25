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
    respondToEvent("sfx_play_beep_effect", () => {this.play("beep");});
    respondToEvent("sfx_play_cursormove_effect", () => {this.play("cbeep2");});
    respondToEvent("sfx_play_err_effect", () => {this.play("errbeep");});
  }
  async loadMusic()
  {
    // load(name, length, introLength
    // round length up
    await this.load("btl1", 33334);
    await this.load("btl_en", 15000);
    await this.load("fght", 6112)
    await this.load("fght2", 18667)
    await this.load("rfgh", 45715, 3809.5);
    //await this.load("oss");
    //await this.loadFX("bad");
    await this.loadFX("errbeep", 1000);
    await this.loadFX("beep", 1000);
    await this.loadFX("cbeep2", 1000);
    //await this.loadFX("bad2");
    await this.loadFX("whack", 1000);
    await this.loadFX("FX_slash", 1000);
    await this.loadFX("FX_miss", 1000);
    await this.loadFX("FX_crit", 1000);
    await this.loadFX("FX_unitdeath", 1000);
  }
  
  async load( name, length, intro = 0)
  {
    let s = await new Promise ( (resolve) => 
      {
	let fullname = "assets/music/" + name + EXT;
	let sprite = {};
	if (intro > 0)
	{
	  sprite.start = [0, intro];
	  sprite.loop = [intro, length, true];
	}
	else
	{
	  sprite.start = [0, length, true];
	}
	let s = new Howl(
	  {
	    src: [fullname],
	    volume: 0.5,
	    sprite: sprite,
	    onload : () => {resolve(s);}
	  });
      });
    s.playing = false;
    s.intro = (intro > 0);
    this.album[name] = s;
    console.log(name + " loaded");
  }
  async loadFX( name, length)
  {
    this.album[name] = await new Promise ( (resolve) => {
	let fullname = "assets/music/" + name + EXT;
	let s = new Howl(
	  {
	    src: [fullname],
	    volume: 0.5,
	    sprite: {start: [0, length]},
	    onload : () => {resolve(s);}
	  }
	);
      });
    console.log(name + " loaded");
  }
  play( name )
  {
    let s = this.album[name];
    s.playing = true;
    s.volume(0.5);
    let id = s.play("start");
    if (s.intro)
    {
      s.once("end", ()=>{s.off("stop");if (s.playing) s.play("loop");});
      s.once("stop", ()=>{s.off("end");});
    }
  }
  unmute( name )
  {
    this.album[name].mute(false);
  }
  mute( name )
  {
    this.album[name].mute(true);
  }
  setVol(name, vol)
  {
    this.album[name].volume(vol);
  }
  fadeout( name , time = 500)
  {
    return new Promise( (resolve)=>
      {
	let s = this.album[name];
	if (s.playing)
	{
	  s.fade(0.5, 0, time);
	  s.once("fade", resolve);
	}
	else
	  resolve();
      });
  }
  async fadestop( name, time = 500)
  {
    await this.fadeout(name, time);
    this.stop(name);
  }
  async playin( name, time = 500)
  {
    this.play(name);
    await this.fadein(name, time);
  }
  fadein( name, time = 500)
  {
      return new Promise( (resolve)=>
      {
	let s = this.album[name];
	if (s.playing)
	{
	  s.fade(0, 0.5, time);
	  s.once("fade", resolve);
	}
	else
	  resolve();
      });
  }
  stop( name )
  {
    let s = this.album[name];
    s.stop();
    s.playing = false;
  }
  stopAll()
  {
    Waud.stop();
  }
}

export {MusicPlayer};
