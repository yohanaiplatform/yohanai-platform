Services Layer
The services layer contains the business logic of the Yohan.AI Platform.
Responsibilities
Orchestrating operations across multiple repositories.
Implementing complex business rules and validations.
Handling external integrations (e.g., AI providers, WhatsApp API).
Managing transactions and unit of work.
Guidelines
Services should NOT contain direct database queries. Use Repositories instead.
Services should be stateless where possible.
Throw domain-specific errors (e.g., ValidationError, NotFoundError) from src/lib/errors.