'use strict';

import {triggerEvent, waitTime} from "./Utils.js";
import {MusicPlayer} from "./MusicPlayer.js";

// [ musicname, filename, [ total_duration, intro_duration ] ]
// round duration up, in milliseconds

const music_to_load = [
    [ "ch1 map",           "btl1",          [ 33334, 0]   ],
    [ "ch1 enemy",         "btl_en",        [ 15000, 0]   ],
    [ "ch2 map",           "thing3",        [ 51297, 0]   ],
    [ "ch2 enemy",         "btl_en_night",  [ 20000, 0]   ],
    [ "player battle",     "fght2",         [ 18667, 0]   ],
    [ "enemy battle",      "fght",          [  6112, 0]   ],
    [ "village",           "village",       [ 20000, 0]   ],
    [ "archers",           "archers",       [ 70820, 0]   ],
    [ "recruit",           "recruit",       [ 20000, 455] ],
    [ "feels",             "feels",         [ 40000, 0]   ],
    [ "drabby song",       "drabby",        [ 40000, 0]   ],
    [ "old sounding song", "oss",           [ 76000, 12000] ],
    [ "rfgh",              "rfgh",          [ 45715, 3809.5] ],
    [ "weee3",             "weee3",         [ 63636, 1818] ],
    [ "newnew",            "newnew",        [ 81905, 0]   ],
    [ "oipmp2",            "oipmp2",        [ 53455, 0]   ],
    [ "thsda",             "thsda",         [ 55385, 0]   ],
    [ "sad",               "sad",           [  9600, 0]   ],
    
];

// [ filename, duration ]
const FX_to_load = [
    [ "errbeep", 1000 ],
    [ "beep", 1000 ],
    [ "cbeep", 1000 ],
    [ "whack", 1000 ],
    [ "FX_slash", 1000 ],
    [ "FX_miss", 1000 ],
    [ "FX_crit", 1000 ],
    [ "FX_mageboop", 1000 ],
    [ "FX_unitdeath", 1000 ],
    [ "FX_healblip", 1000 ],
    [ "FX_bonk", 1000 ],
    [ "FX_clink", 1000 ],
    [ "FX_join", 1667 ],
    [ "FX_leave", 1667 ],

];


const EXT = "ogg";

export class MusicLoader
{
  static async load()
  {
    let loads = []
    for (let o of music_to_load)
      loads.push(this.loadMusic(...o));

    for (let o of FX_to_load)
      loads.push(this.loadFX(...o));

    await Promise.all(loads);
  }

  static async loadMusic( name, filename, keypoints)
  {
    let [ length, intro ] = keypoints;
    let s = await new Promise ( (resolve) =>
      {
        let fullname = "assets/music/" + EXT + "/" + filename + "." + EXT;
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
            volume: MusicPlayer.baseVolume,
            sprite: sprite,
            onload : () => {resolve(s);}
          });
      });
    s.playing = false;
    s.intro = (intro > 0);
    MusicPlayer.album[name] = s;
    MusicPlayer.album[name].isFX = false;
    triggerEvent("load_progress", `Loaded music ${filename}.${EXT}`);
  }

  static async loadFX( name, length)
  {
    MusicPlayer.album[name] = await new Promise ( (resolve) => {
        let fullname = "assets/music/" + EXT + "/FX/" + name + "." + EXT;
        let s = new Howl(
          {
            src: [fullname],
            volume: MusicPlayer.baseVolume,
            sprite: {start: [0, length]},
            onload : () => {resolve(s);}
          }
        );
      });
    MusicPlayer.album[name].isFX = true;
    triggerEvent("load_progress", `Loaded sound effect ${name}.${EXT}`);
  }
}
