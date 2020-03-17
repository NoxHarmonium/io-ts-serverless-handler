// Remove all keys with null values
// Thanks: https://stackoverflow.com/a/57625661/1153203
export const removeEmpty = (obj: {}): {} =>
  Object.entries(obj).reduce(
    (a, [k, v]) => (v == null ? a : { ...a, [k]: v }),
    {}
  );

/**
 * Like Object.keys but actually returns the types of the keys
 *
 * Thanks: https://github.com/microsoft/TypeScript/pull/12253#issuecomment-393954723
 */
export const typedKeys = Object.keys as <T>(
  o: T
) => ReadonlyArray<Extract<keyof T, string>>;
