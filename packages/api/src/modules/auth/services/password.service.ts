import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

/**
 * Handles password hashing and verification using argon2id.
 *
 * argon2id won the Password Hashing Competition (2015) and is the modern
 * recommendation over bcrypt. It's intentionally slow — making brute-force
 * attacks expensive even with GPUs. The argon2id variant resists both
 * GPU-based and side-channel attacks.
 *
 * Think of this like BCrypt.hashpw() / BCrypt.checkpw() in Java.
 */
@Injectable()
export class PasswordService {
  async hash(plaintext: string): Promise<string> {
    return argon2.hash(plaintext);
  }

  async verify(hash: string, plaintext: string): Promise<boolean> {
    return argon2.verify(hash, plaintext);
  }
}
