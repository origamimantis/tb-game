'use strict';

import {triggerEvent, waitTime} from "./Utils.js";

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




export class MusicPlayer
{
  static async loadMusic()
  {
    this.album = {};
    // load(name, (total) length, introLength
    // round length up, length in milliseconds
    await this.load("btl1", 33334);
    await this.load("btl_en", 15000);
    await this.load("ch2", 51297);
    await this.load("bbghrnj", 20000);
    await this.load("fght", 6112)
    await this.load("fght2", 18667)
    await this.load("village", 20000);
    await this.load("archers", 70820);
    await this.load("recruit", 20000, 455);
    await this.load("feels", 40000);
    await this.load("drabby", 40000);
    await this.load("old sounding song", 76000, 12000);
    await this.load("rfgh", 45715, 3809.5);
    await this.load("weee3", 63636, 1818);
    await this.load("newnew", 121905);
    
    await this.loadFX("errbeep", 1000);
    await this.loadFX("beep", 1000);
    await this.loadFX("cbeep2", 1000);
    await this.loadFX("whack", 1000);
    await this.loadFX("FX_slash", 1000);
    await this.loadFX("FX_miss", 1000);
    await this.loadFX("FX_crit", 1000);
    await this.loadFX("FX_mageboop", 1000);
    await this.loadFX("FX_unitdeath", 1000);
    await this.loadFX("FX_healblip", 1000);
    await this.loadFX("FX_bonk", 1000);
    await this.loadFX("FX_clink", 1000);
    await this.loadFX("FX_join", 1667);
    await this.loadFX("FX_leave", 1667);
  }
  
  static async load( name, length, intro = 0)
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
    this.album[name].isFX = false;
    triggerEvent("load_progress", `Loaded music ${name}${EXT}`);
  }
  static async loadFX( name, length)
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
    this.album[name].isFX = true;
    triggerEvent("load_progress", `Loaded sound effect ${name}${EXT}`);
  }
  static play( name )
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
  static unmute( name )
  {
    this.album[name].mute(false);
  }
  static mute( name )
  {
    this.album[name].mute(true);
  }
  static setVol(name, vol)
  {
    this.album[name].volume(vol);
  }
  static fadeout( name , time = 500)
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
  static async fadestop( name, time = 500)
  {
    await this.fadeout(name, time);
    this.stop(name);
  }
  static async playin( name, time = 500)
  {
    this.play(name);
    await this.fadein(name, time);
  }
  static fadein( name, time = 500)
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
  static stop( name )
  {
    let s = this.album[name];
    s.stop();
    s.playing = false;
  }
  static stopAll()
  {
    Howler.stop();
  }
}
