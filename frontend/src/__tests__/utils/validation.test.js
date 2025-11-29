import { 
  validateEmail, 
  validatePassword, 
  validatePhone 
} from '../../utils/validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    test('validates correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.in')).toBe(true);
    });

    test('rejects invalid email', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('validates strong password', () => {
      expect(validatePassword('Password123!')).toBe(true);
      expect(validatePassword('StrongP@ss1')).toBe(true);
    });

    test('rejects weak password', () => {
      expect(validatePassword('123')).toBe(false);
      expect(validatePassword('password')).toBe(false);
      expect(validatePassword('12345678')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    test('validates correct phone number', () => {
      expect(validatePhone('1234567890')).toBe(true);
      expect(validatePhone('+911234567890')).toBe(true);
    });

    test('rejects invalid phone number', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('abcdefghij')).toBe(false);
    });
  });
});
