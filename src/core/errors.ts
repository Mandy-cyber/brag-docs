/**
 * Base class for all errors raised by the core engine; lets the CLI
 * distinguish "your data" from "our bug".
 */
export abstract class BragError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/**
 * brag.md (or its config) could not be parsed into structured data —
 * malformed shape, not a validation failure.
 */
export class ParseError extends BragError {}

/**
 * Parsed data failed schema validation (zod) — e.g. a bad field type
 * or a cross-entry invariant like duplicate ids.
 */
export class ValidationError extends BragError {}

/** brag.config.json is missing, unreadable, or fails its schema. */
export class ConfigError extends BragError {}

/**
 * A requested feature (e.g. DOCX rendering) is deliberately
 * unimplemented; distinct from a bug.
 */
export class NotImplementedError extends BragError {}

/** An AI provider's response failed schema validation even after one retry. */
export class AiValidationError extends BragError {}
