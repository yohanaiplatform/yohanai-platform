Repositories Layer
The repositories layer is responsible for all data access and persistence logic.
Responsibilities
Abstracting database operations (CRUD) from the rest of the application.
Mapping database records to domain models.
Handling Supabase-specific query building and error translation.
Guidelines
Each domain entity should have its own repository extending BaseRepository.
Repositories should NOT contain business logic.
All database errors should be caught and re-thrown as DatabaseError.