export const $ = (e) => document.getElementById(e);
export const $$ = (c) => document.querySelectorAll(`.${c}`);

export function hideElem() {
  $("modDetails").classList.remove("show");
  $("moduleMsgBtn").classList.remove("show");
}

export function showElem() {
  $("modDetails").classList.add("show");
  $("moduleMsgBtn").classList.add("show");
}