interface MongoTarget {
  hosts: string[];
  database: string;
}

const testDatabaseName = /^designforge_test_[a-z0-9][a-z0-9_-]*$/i;

export function validateMongoTestUri(testUri?: string, applicationUri?: string): string {
  if (!testUri?.trim()) {
    throw new Error('DESIGNFORGE_TEST_MONGO_URI must be set to run MongoDB integration tests.');
  }

  const testTarget = parseMongoTarget(testUri);
  if (!testDatabaseName.test(testTarget.database)) {
    throw new Error('MongoDB integration tests require a database named designforge_test_<suffix>.');
  }

  if (applicationUri?.trim()) {
    const applicationTarget = parseMongoTarget(applicationUri);
    if (sameTarget(testTarget, applicationTarget)) {
      throw new Error('MongoDB test target must differ from the configured application database.');
    }
  }

  return testUri;
}

function parseMongoTarget(uri: string): MongoTarget {
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error('MongoDB test safety validation could not parse a configured database URI.');
  }

  if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol) || !parsed.host) {
    throw new Error('MongoDB test safety validation requires a valid MongoDB URI.');
  }

  let database: string;
  try {
    database = decodeURIComponent(parsed.pathname.slice(1));
  } catch {
    throw new Error('MongoDB test safety validation requires a valid database name.');
  }

  const hosts = parsed.host
    .split(',')
    .map(normalizeHost)
    .sort();
  if (!database || database.includes('/') || hosts.some((host) => !host)) {
    throw new Error('MongoDB test safety validation requires an explicit database and host.');
  }

  return { hosts, database };
}

function sameTarget(left: MongoTarget, right: MongoTarget): boolean {
  return left.database === right.database
    && left.hosts.length === right.hosts.length
    && left.hosts.every((host, index) => host === right.hosts[index]);
}

function normalizeHost(host: string): string {
  const normalized = host.toLowerCase();
  if (normalized.startsWith('[')) {
    const closingBracket = normalized.indexOf(']');
    const address = normalized.slice(0, closingBracket + 1);
    const port = normalized.slice(closingBracket + 1).replace(/^:/, '') || '27017';
    return `${address}:${port}`;
  }

  const separator = normalized.lastIndexOf(':');
  if (separator < 0) return `${normalized}:27017`;
  const hostname = normalized.slice(0, separator);
  const port = normalized.slice(separator + 1) || '27017';
  return `${hostname}:${port}`;
}
