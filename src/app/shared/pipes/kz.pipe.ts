import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a numeric value as Angolan Kwanza currency.
 *
 * Uses the 'pt-PT' locale so thousands separators are dots and there are
 * no decimal places (e.g. 150000 → "150.000 Kz").
 *
 * Usage in templates: {{ someNumber | kz }}
 */
@Pipe({ name: 'kz', standalone: true })
export class KzPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '0 Kz';
    return new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 0 }).format(value) + ' Kz';
  }
}
