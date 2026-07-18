Validators Layer
The validators layer handles input validation and sanitization before data reaches the services layer.
Responsibilities
Validating request payloads (e.g., using Zod or similar schema validation libraries).
Sanitizing input data to prevent injection attacks.
Providing clear, typed validation error messages.
Guidelines
Define schemas close to the feature they validate.
Export reusable validation schemas from this directory.
Throw ValidationError if validation fails.
