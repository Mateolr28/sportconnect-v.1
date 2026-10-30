// ==============================================================================
// POLÍTICA DE CONTRASEÑAS
// Combina las recomendaciones de OWASP y NIST SP 800-63B: longitud mínima,
// variedad de caracteres, rechazo de contraseñas comunes y de las que contienen
// datos personales. La longitud máxima (72) coincide con el límite de bcrypt
// que usa Supabase Auth para guardar la contraseña con hash.
// ==============================================================================

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

// Contraseñas muy frecuentes en filtraciones públicas (en minúsculas)
const COMMON_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', '11111111', '00000000', '87654321', '12341234',
  'password', 'password1', 'password123', 'passw0rd', 'p@ssw0rd', 'p@ssword', 'contraseña', 'contrasena',
  'contraseña1', 'contrasena1', 'contrasena123', 'qwertyui', 'qwerty123', 'qwertyuiop', 'asdfghjk',
  'asdf1234', 'zxcvbnm1', 'abc12345', 'abcd1234', 'abcdefgh', 'iloveyou', 'iloveyou1', 'admin123',
  'administrador', 'welcome1', 'welcome123', 'letmein1', 'monkey123', 'dragon123', 'football',
  'futbol123', 'futbol2024', 'futbol2025', 'sportconnect', 'sportconnect1', 'sportconnect123',
  'deportista', 'deportista1', 'colombia1', 'colombia123', 'medellin1', 'bogota123', 'barcelona',
  'realmadrid', 'atleticonacional', 'nacional123', 'junior123', 'america123', 'cali12345',
]);

// Palabras débiles que, aunque se les agreguen números o símbolos ("Password1!"), siguen siendo fáciles de adivinar
const WEAK_WORDS = ['password', 'contrasena', 'qwerty', 'asdfgh', 'sportconnect', 'iloveyou', 'letmein', 'welcome', 'administrador', 'abcdefgh'];

// Quita sustituciones típicas (@ por a, 0 por o...) y deja solo letras para detectar palabras débiles
const lettersOnly = (normalized: string) =>
  normalized.replace(/@/g, 'a').replace(/\$/g, 's').replace(/0/g, 'o').replace(/3/g, 'e').replace(/4/g, 'a').replace(/[^a-z]/g, '');

export interface PasswordContext {
  email?: string;
  names?: string[];
}

export interface PasswordCheck {
  id: string;
  label: string;
  ok: boolean;
}

export interface PasswordEvaluation {
  checks: PasswordCheck[];
  valid: boolean;
  /** 0 (vacía) a 4 (fuerte) */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
}

const stripAccents = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '');

// Fragmentos personales (correo y nombres) que no deberían formar parte de la contraseña
const personalTokens = ({ email, names = [] }: PasswordContext) => {
  const tokens = new Set<string>();
  const local = (email || '').split('@')[0];
  [local, ...names].forEach((raw) => {
    stripAccents(raw || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((part) => part.length >= 4)
      .forEach((part) => tokens.add(part));
  });
  return [...tokens];
};

export const evaluatePassword = (password: string, context: PasswordContext = {}): PasswordEvaluation => {
  const normalized = stripAccents(password).toLowerCase();
  const tokens = personalTokens(context);

  const checks: PasswordCheck[] = [
    { id: 'length', label: `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`, ok: password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH },
    { id: 'lower', label: 'Una letra minúscula', ok: /[a-zñ]/.test(password) },
    { id: 'upper', label: 'Una letra mayúscula', ok: /[A-ZÑ]/.test(password) },
    { id: 'number', label: 'Un número', ok: /\d/.test(password) },
    { id: 'symbol', label: 'Un símbolo (por ejemplo ! @ # $ %)', ok: /[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s]/.test(password) },
    { id: 'common', label: 'No es una contraseña común', ok: password.length > 0 && !COMMON_PASSWORDS.has(normalized) && !/^(.)\1+$/.test(password) && !WEAK_WORDS.some((word) => lettersOnly(normalized).includes(word)) },
    { id: 'personal', label: 'No contiene tu nombre ni tu correo', ok: password.length > 0 && !tokens.some((token) => normalized.includes(token)) },
  ];

  const valid = checks.every((check) => check.ok);
  const passed = checks.filter((check) => check.ok).length;

  let score: PasswordEvaluation['score'] = 0;
  if (password.length > 0) {
    if (valid) score = password.length >= 12 ? 4 : 3;
    else score = passed >= 5 ? 2 : 1;
  }

  const label = ['', 'Débil', 'Media', 'Buena', 'Fuerte'][score];
  return { checks, valid, score, label };
};
