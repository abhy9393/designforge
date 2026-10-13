import { describe, expect, it } from 'vitest';
import { validateMongoTestUri } from '../config/mongoTestSafety.js';

describe('MongoDB integration test target safety', () => {
  it('rejects a missing dedicated test URI', () => {
    expect(() => validateMongoTestUri(undefined, 'mongodb://localhost:27017/designforge'))
      .toThrow('DESIGNFORGE_TEST_MONGO_URI must be set');
  });

  it('rejects database names without the explicit test designation', () => {
    expect(() => validateMongoTestUri(
      'mongodb://localhost:27017/designforge',
      'mongodb://localhost:27017/designforge_app',
    )).toThrow('require a database named designforge_test_');
  });

  it('rejects a test URI that targets the configured application database', () => {
    expect(() => validateMongoTestUri(
      'mongodb://test-user:test-password@localhost:27017/designforge_test_main',
      'mongodb://app-user:app-password@LOCALHOST:27017/designforge_test_main',
    )).toThrow('must differ from the configured application database');
  });

  it('accepts a dedicated test database distinct from the application target', () => {
    const uri = 'mongodb://test-user:test-password@localhost:27018/designforge_test_run_123';
    expect(validateMongoTestUri(
      uri,
      'mongodb://app-user:app-password@localhost:27017/designforge_app',
    )).toBe(uri);
  });
});
