'use strict';

import {Settings} from "./Settings.js"

/*
play( name )
unmute( name )
mute( name )
muffle()
unmuffle()
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
    this.baseVolume = 0.5;
    this.volume = this.baseVolume
    this.muffleAmt = 0.3;
    this.isMuffled = false
    Settings.addCallback("music_volume", "volume_update",
      (newvol) =>
      {
        this.baseVolume = newvol.get()
        this.updateV()
      }
    );
  }

  static play( name )
  {
    this.updateV()

    let s = this.album[name];
    s.playing = true;
    s.volume(this.volume);
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
  static muffle()
  {
    this.isMuffled = true
    this.updateV();
  }
  static unmuffle()
  {
    this.isMuffled = false
    this.updateV();
  }
  static setVol(name, vol)
  {
    this.volume = vol
    this.album[name].volume(vol);
  }
  static fadeout( name , time = 500)
  {
    this.updateV()
    return new Promise( (resolve)=>
      {
	let s = this.album[name];
	if (s.playing)
	{
	  s.fade(this.volume, 0, time);
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
	  s.fade(0, this.volume, time);
	  s.once("fade", () => {MusicPlayer.updateV(); s.volume(MusicPlayer.volume); resolve()});
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
  static updateV()
  {
    this.volume = this.baseVolume
    if (this.isMuffled)
      this.volume *= this.muffleAmt

    for (let song of Object.values(this.album))
    {
      if (song.playing == true)
	song.volume(this.volume);
    }
  }
}
