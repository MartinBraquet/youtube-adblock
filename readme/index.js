const MUSTACHE_TEMPLATE_PATH = './readme/template.md';
const README_PATH = 'README.md';

const fs = require('fs');
const Mustache = require('mustache');
const jsdom = require("jsdom");
const {JSDOM} = jsdom;

let DATA = {
    addon_metadata: {},
    auto_generation_note: "<!-- Do not modify this readme, it was automatically generated based on the dynamic content in `readme/template.md`. -->"
};


function getMetadataContent(element, html = false) {
    let block = element.getElementsByClassName('MetadataCard-content')[0];
    if (html) {
        return block.innerHTML;
    }
    return block.textContent;
}

function getMetadataTitle(element) {
    return element.getElementsByClassName('MetadataCard-title')[0].textContent;
}

async function setAddonMetadata() {
    await fetch(
        `https://addons.mozilla.org/en-US/firefox/addon/youtube_adblock/`
    )
        .then(r => r.text())
        .then(r => {
            let doc = new JSDOM(r).window.document;
            let elements = doc.getElementsByClassName("MetadataCard AddonMeta-overallRating")[0].querySelectorAll('dl');
            for (let i = 0; i < elements.length; i++) {
                let element = elements[i];
                if (getMetadataTitle(element) === "Users") {
                    DATA.addon_metadata.users = getMetadataContent(element);
                }
                else if (getMetadataTitle(element) === "Reviews") {
                    let reviews = getMetadataContent(element, true);
                    reviews = reviews.replace(/href="\//g, 'href="https://addons.mozilla.org/');
                    DATA.addon_metadata.reviews = reviews;
                }
                else if (getMetadataTitle(element).includes("Stars")) {
                    DATA.addon_metadata.stars = getMetadataContent(element);
                }
            }
        });
}


function generateReadMe() {
    fs.readFile(MUSTACHE_TEMPLATE_PATH, (err, data) => {
        if (err) throw err;
        const output = Mustache.render(data.toString(), DATA);
        fs.writeFileSync(README_PATH, output);
    });
}

async function action() {
    await setAddonMetadata();
    await generateReadMe();
}

action().then(r => {
});
