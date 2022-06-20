'use strict';

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
  static init()
  {
    this.album = {};
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
