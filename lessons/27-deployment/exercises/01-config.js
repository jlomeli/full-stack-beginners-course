// loadConfig(env)
// Reads and validates environment variables, once, when the app starts. env is an object like process.env.
// Return a config object with these keys (use zod to validate and convert):
//   nodeEnv       from NODE_ENV: 'development', 'test', or 'production'. Default 'development'.
//   port          from PORT: a whole number from 1 to 65535. Default 3000. env values are strings, so convert it to a number.
//   databaseUrl   from DATABASE_URL: required. Must start with postgres:// or postgresql://.
//   sessionSecret from SESSION_SECRET: required. At least 32 characters.
//   corsOrigin    from CORS_ORIGIN: optional. When given, it must be a valid URL. When missing, it is undefined.
// When anything is invalid, throw one Error whose message starts with "Invalid environment:" and then lists
// each bad variable by name on its own line, like "- PORT: ...". Report all the bad variables, not only the first.
// Never put the value of SESSION_SECRET or DATABASE_URL in the message: logs are not a safe place for secrets.
import * as z from 'zod';

export function loadConfig(env = process.env) {
	// TODO
}
