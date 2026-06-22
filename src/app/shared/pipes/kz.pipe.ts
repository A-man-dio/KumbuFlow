import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'kz', standalone: true })
export class KzPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '0 Kz';
    return new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 0 }).format(value) + ' Kz';
  }
}
