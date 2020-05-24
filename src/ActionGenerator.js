"use strict";


export class Action
{
  constructor(name, action)
  {
    this.name = name;
    this.action = action;
  }
  async execute()
  {
    await this.action();
  }
}

