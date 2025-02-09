module.exports = {
    verbose: true,
    build: {
        overwriteDest: true,
    },
    ignoreFiles: [
        "demo",
        "readme",
        "misc",
        "package-lock.json",
        "*.sh",
        "*.xpi",
        "*.zip",
        "store",
        "test",
        "coverage",
        "releases",
        "web-ext-artifacts",
        "node_modules",
        "martin",
        ".gitignore",
        ".idea",
        ".github",
    ],
    sign: {
        channel: "listed",
        amoMetadata: "amo_metadata.json",
    },
    run: {
        startUrl: [
            "https://www.youtube.com/watch?v=qj-Mlygkheg",
            "about:debugging#/runtime/this-firefox",
        ],
    },
};