// This script is triggered when a Google form is submitted. It creates an issue on the GitHub repository with the feedback from the form.

let props = PropertiesService.getScriptProperties().getProperties();
let ghToken = props["github-token"];
let ghlink = "https://api.github.com/repos/MartinBraquet/youtube-adblock/issues"

function onFormSubmit(e) {
  Logger.log(JSON.stringify(e, null, 4));
  let itemResponses = e.namedValues;

  let title = itemResponses.Title[0];
  let body = "This is an automated issue resulting from a submission of the feedback Google form for this add-on.";
  for (const [key, v] of Object.entries(itemResponses)) {
    if (key === "Email address" || key === "Timestamp" || key === "Title") {continue;}
    let value = v[0];
    body += "\n## " + key + "\n" + value[0];
    console.log(key, value);
  }

  let payload = {
    "title": title,
    "body": body
  };

  Logger.log("Payload: %s", payload)

  let options = {
    "method": "POST",
    "headers": {
      "authorization": "token " + ghToken,
      "Accept": "application/vnd.github.v3+json",
    },
    "contentType": "application/json",
    "payload": JSON.stringify(payload)
  };

  var response = UrlFetchApp.fetch(ghlink, options);

  Logger.log("Response: %s", response)
}