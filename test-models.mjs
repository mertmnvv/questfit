async function run() {
  const url = "https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyDt0scQdyzFN7aF4vn1ITyp8iQLXP-apgY";
  const res = await fetch(url);
  const json = await res.json();
  if (json.models) {
    console.log(json.models.map(m => m.name).join("\n"));
  } else {
    console.log(json);
  }
}
run();
