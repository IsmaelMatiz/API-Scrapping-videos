function safeStringify(value) {
    try {
        return JSON.stringify(value);
    } catch {
        return undefined;
    }
}

function pickErrorDetails(err) {
    if (!err || typeof err !== "object") return { message: String(err) };

    const anyErr = /** @type {any} */ (err);
    const details = {
        name: anyErr.name,
        message: anyErr.message,
        stack: anyErr.stack,
        // `cause` existe en Node moderno; puede ser objeto complejo
        cause: anyErr.cause ? safeStringify(anyErr.cause) ?? String(anyErr.cause) : undefined,
    };

    // Playwright a veces trae propiedades útiles adicionales
    if (typeof anyErr.apiName === "string") details.apiName = anyErr.apiName;
    if (typeof anyErr.code === "string") details.code = anyErr.code;

    return details;
}

/**
 * Logging consistente para errores de scraping sin "tapar" el error real.
 * @param {string} fn Nombre de la función (ej. "GetVideoPlayerLink")
 * @param {unknown} err Error capturado
 * @param {Record<string, unknown>} [extra] Contexto (urls, params, etc.)
 */
function logScrapeError(fn, err, extra = {}) {
    const base = pickErrorDetails(err);
    const payload = {
        tag: "SCRAPE_ERROR",
        fn,
        ts: new Date().toISOString(),
        ...base,
        extra,
    };
    // 1) Un log JSON "parseable" para Cloud Logging
    try {
        console.error(JSON.stringify(payload));
    } catch {
        console.error("[SCRAPE_ERROR]", fn, payload);
    }
    // 2) Y un log legible para humanos
    const msg = base?.message ?? String(err);
    console.error(`[SCRAPE_ERROR] ${fn}: ${msg}`);
    if (base?.stack) console.error(base.stack);
}

export { logScrapeError };
