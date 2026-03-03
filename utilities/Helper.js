export function UcFirst(arr, id) {
  return string ? string.charAt(0).toUpperCase() + string.slice(1) : "";
}
export function removeObjectWithId(arr, id) {
  const objWithIdIndex = arr.findIndex((obj) => obj.id === id);
  arr.splice(objWithIdIndex, 1);
  return arr;
}
export async function wait(time) {
  await new Promise((resolve) => setTimeout(resolve, time || 3000));
}
