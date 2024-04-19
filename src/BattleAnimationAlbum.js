'use strict';

import {requestFile} from "./Utils.js";

const commentChar = "#";

export class BattleAnimationAlbum
{
  static init()
  {
    this.scripts = {}
  }
  static load(name, scriptName)
  {
    if (scriptName in this.scripts)
      return this.scripts[scriptName];

    return new Promise( async (resolve) =>
      {
	let script = await requestFile("assets/scripts/" + scriptName + ".txt");
	script = script.responseText;

	let lines = script.split("\n");

	let options = {};
	let program = {};
	while (lines[0] != "begin")
	{
	  let opt = lines.shift().split(" ");
	  options[opt[0]] = opt[1];
	}

	lines.shift();

	for (let line of lines)
	{
	  if (line.length == 0 || line[0] == commentChar)
	  {
	    continue;
	  }
	  let args = line.split(" ");
	  let time = args.shift();
	  if (program[time] == undefined)
	  {
	    program[time] = [];
	  }
	  program[time].push(args);
	}
	this.scripts[scriptName] = {options: options, program: program};
	resolve(this.scripts[scriptName]);

      }
    );
  }
}

