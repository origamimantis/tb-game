'use strict';

class Range
{
  constructor (min, max = null)
  {
    this.min = min;
    if (max == null)
    {
      this.max = min;
    }
    else if (max >= min)
    {
      this.max = max;
    }
    else
    {
      throw new Error("Range max (" + max + ") less than min (" + min + ").");
    }
  }
  *[Symbol.iterator]()
  {
    for (let i =  this.min; i <= this.max; ++i)
    {
      yield i;
    }
  }

}

export {Range};
