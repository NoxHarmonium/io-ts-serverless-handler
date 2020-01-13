// Remove all keys with null values
// Thanks: https://stackoverflow.com/a/57625661/1153203
export const removeEmpty = (obj: {}): {} =>
  Object.entries(obj).reduce(
    (a, [k, v]) => (v == null ? a : { ...a, [k]: v }),
    {}
  );
