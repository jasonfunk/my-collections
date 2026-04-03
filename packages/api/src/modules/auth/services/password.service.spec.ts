import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  describe('hash', () => {
    it('should return a hash different from the plaintext', async () => {
      const hash = await service.hash('mypassword');
      expect(hash).not.toBe('mypassword');
    });

    it('should return different hashes for the same input (salt uniqueness)', async () => {
      const hash1 = await service.hash('mypassword');
      const hash2 = await service.hash('mypassword');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verify', () => {
    it('should return true for the correct password', async () => {
      const hash = await service.hash('correcthorsebatterystaple');
      expect(await service.verify(hash, 'correcthorsebatterystaple')).toBe(true);
    });

    it('should return false for the wrong password', async () => {
      const hash = await service.hash('correcthorsebatterystaple');
      expect(await service.verify(hash, 'wrong')).toBe(false);
    });
  });
});
