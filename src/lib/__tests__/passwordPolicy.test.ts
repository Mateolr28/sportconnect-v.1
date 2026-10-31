import { describe, expect, it } from 'vitest';
import { evaluatePassword } from '../passwordPolicy';

const failed = (password: string, context = {}) =>
  evaluatePassword(password, context).checks.filter((c) => !c.ok).map((c) => c.id);

describe('evaluatePassword', () => {
  it('acepta una contraseña fuerte', () => {
    const result = evaluatePassword('Xk9#vTq2!mLw');
    expect(result.valid).toBe(true);
    expect(result.score).toBe(4);
  });

  it('rechaza contraseñas cortas o sin variedad', () => {
    expect(failed('Ab1!')).toContain('length');
    expect(failed('abcdefgh1!')).toContain('upper');
    expect(failed('ABCDEFGH1!')).toContain('lower');
    expect(failed('Abcdefgh!!')).toContain('number');
    expect(failed('Abcdefgh12')).toContain('symbol');
  });

  it('rechaza contraseñas comunes aunque cumplan el formato', () => {
    expect(evaluatePassword('Password1!').valid).toBe(false);
    expect(failed('Password1!')).toContain('common');
    expect(failed('P@ssw0rd')).toContain('common');
  });

  it('rechaza contraseñas con el nombre o el correo del usuario', () => {
    const context = { email: 'mateo.rios@correo.com', names: ['Mateo', 'Ríos'] };
    expect(failed('Mateo2024!x', context)).toContain('personal');
    expect(failed('Zq7!Mateo#9', context)).toContain('personal');
    expect(failed('Zq7!Lmnop#9', context)).not.toContain('personal');
  });

  it('rechaza contraseñas de más de 72 caracteres (límite de bcrypt)', () => {
    expect(failed('Aa1!' + 'x'.repeat(70))).toContain('length');
  });

  it('una contraseña vacía tiene puntaje 0', () => {
    expect(evaluatePassword('').score).toBe(0);
  });
});
