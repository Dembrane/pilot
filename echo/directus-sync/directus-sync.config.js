const directusBaseUrl = process.env.DIRECTUS_BASE_URL;
const directusToken = process.env.DIRECTUS_TOKEN;

if (!directusBaseUrl || !directusToken) {
    throw new Error('DIRECTUS_BASE_URL and DIRECTUS_TOKEN must be set');
}

module.exports = {
    directusUrl: directusBaseUrl,
    directusToken: directusToken,
    dumpPath: './directus-config',
    // Additional options...
};