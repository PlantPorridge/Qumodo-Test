import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'iterate'
})
export class IteratePipe implements PipeTransform {

  /**
   * Pulled from:
   * https://stackoverflow.com/questions/36535629/repeat-html-element-multiple-times-using-ngfor-based-on-a-number/36535705
   * Used to make a *ngFor repeat n times. Unfortunately Angular does not provide its own way of doing this.
   * @param value 
   */
  transform(value: number): any {
    const iterable = {};
    iterable[Symbol.iterator] = function* () {
      let n = 0;
      while (n < value) {
        yield ++n;
      }
    };
    return iterable;
  }

}
