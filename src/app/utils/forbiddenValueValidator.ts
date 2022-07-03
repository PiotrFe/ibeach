import { ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';

export function forbiddenValueValidator(valRegex: RegExp): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const forbidden = valRegex.test(control.value);
    return forbidden ? { forbiddenName: { value: control.value } } : null;
  };
}
