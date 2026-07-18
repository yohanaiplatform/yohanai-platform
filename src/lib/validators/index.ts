export type ValidatorSchema<T> = {
parse: (data: unknown) => T;
};
export const validate = <T>(schema: ValidatorSchema<T>, data: unknown): T => {
try {
return schema.parse(data);
} catch (error) {
const message = error instanceof Error ? error.message : 'Validation failed';
throw new Error(message);
}
};