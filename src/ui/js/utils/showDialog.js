export default (type, title, message) => {
  return window.api.alert({
    type,
    buttons: ["Close"],
    title,
    message,
  });
}