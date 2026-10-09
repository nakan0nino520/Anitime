// js/api.js
const ENDPOINT = 'https://graphql.anilist.co';
const CACHE_TTL = 3600000; // 1 GIỜ
const MIN_INTERVAL = 2000; // 30 REQUEST/PHÚT
let lastRequestTime = 0;

function generateKey(query, variables) {
    try {
        const str = JSON.stringify({ q: query.replace(/\s+/g, ' '), v: variables });
        return 'api_' + btoa(encodeURIComponent(str)).slice(-100);
    } catch (e) {
        return 'api_' + Date.now();
    }
}

function getCache(key, ignoreTTL) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const obj = JSON.parse(raw);
        if (!ignoreTTL && Date.now() - obj.t > CACHE_TTL) return null;
        return obj.d;
    } catch (e) { return null; }
}

function setCache(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: data }));
    } catch (e) {
        try { localStorage.clear(); } catch (e2) {}
    }
}

async function gql(query, variables = {}) {
    const cacheKey = generateKey(query, variables);
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const now = Date.now();
    const wait = Math.max(0, MIN_INTERVAL - (now - lastRequestTime));
    if (wait > 0) await new Promise(r => setTimeout(r, wait));

    try {
        lastRequestTime = Date.now();
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ query, variables })
        });

        if (res.status === 429) {
            const retry = parseInt(res.headers.get('Retry-After') || '60');
            console.warn('Rate limit, chờ ' + retry + 's');
            await new Promise(r => setTimeout(r, retry * 1000));
            return gql(query, variables);
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);

        const json = await res.json();
        if (json.errors) throw new Error(json.errors[0].message);

        setCache(cacheKey, json.data);
        return json.data;
    } catch (err) {
        console.error('API Error:', err);
        const old = getCache(cacheKey, true);
        if (old) return old;
        throw err;
    }
}

// ========== LỊCH PHÁT SÓNG ==========
async function getSchedule(fromSec, toSec) {
    const query = `
        query ($from: Int, $to: Int) {
            Page(perPage: 50) {
                airingSchedules(airingAt_greater: $from, airingAt_lesser: $to) {
                    id airingAt episode
                    media {
                        id
                        title { romaji native english }
                        coverImage { large }
                        genres averageScore episodes format siteUrl
                    }
                }
            }
        }
    `;
    const data = await gql(query, { from: Math.floor(fromSec), to: Math.floor(toSec) });
    return data && data.Page ? data.Page.airingSchedules : [];
}

// ========== MÙA ==========
async function getSeasonal(season, year, format) {
    const query = `
        query ($season: MediaSeason, $year: Int, $format: MediaFormat) {
            Page(perPage: 50) {
                media(season: $season, seasonYear: $year, format: $format, type: ANIME, sort: POPULARITY_DESC) {
                    id title { romaji native english }
                    coverImage { large }
                    genres averageScore popularity episodes format season seasonYear
                }
            }
        }
    `;
    const data = await gql(query, { season, year, format });
    return data && data.Page ? data.Page.media : [];
}

// ========== CHI TIẾT ==========
async function getDetail(id) {
    const query = `
        query ($id: Int) {
            Media(id: $id) {
                id
                title { romaji native english }
                coverImage { extraLarge large color }
                bannerImage
                description(asHtml: false)
                genres averageScore popularity favourites episodes duration status season seasonYear format source
                startDate { year month day }
                endDate { year month day }
                studios(isMain: true) { nodes { name } }
                staff(perPage: 6) { edges { role node { name { full } } } }
                characters(perPage: 6) { edges { role node { name { full } image { medium } } } }
                trailer { id site }
                externalLinks { url site type }
                relations { edges { node { id title { romaji } coverImage { large } } } }
                recommendations(perPage: 6) { nodes { mediaRecommendation { id title { romaji } coverImage { large } } } }
            }
        }
    `;
    const data = await gql(query, { id });
    return data ? data.Media : null;
}

// ============================================================
// HÀM TÌM KIẾM CHÍNH - XÂY DỰNG QUERY ĐỘNG
// CHỈ THÊM FIELD VÀO QUERY NẾU CÓ GIÁ TRỊ
// TRÁNH TRUYỀN null CHO ARRAY - GÂY LỖI ANILIST
// ============================================================
async function search(keyword, filters = {}) {
    console.log('[API] search() - keyword:', keyword);
    console.log('[API] search() - filters:', filters);

    // ===== DANH SÁCH 18 GENRES CHÍNH THỨC CỦA ANILIST =====
    const officialGenres = [
        'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi',
        'Fantasy', 'Horror', 'Mahou Shoujo', 'Mecha', 'Music',
        'Mystery', 'Psychological', 'Romance', 'Sci-Fi',
        'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
    ];

    // ===== PHÂN LOẠI GENRES vs TAGS =====
    const rawGenres = filters.genres || [];
    const genresList = rawGenres.filter(g => officialGenres.includes(g));
    const extraGenres = rawGenres.filter(g => !officialGenres.includes(g));

    const tagsList = [
        ...(filters.themes || []),
        ...(filters.demographics || []),
        ...extraGenres
    ];

    // ===== MAP SOURCE =====
    const sourceMap = {
        'Manga': 'MANGA',
        'Light Novel': 'LIGHT_NOVEL',
        'Visual Novel': 'VISUAL_NOVEL',
        'Video Game': 'VIDEO_GAME',
        'Original': 'ORIGINAL',
        'Web Manga': 'WEB_MANGA',
        'Web Novel': 'WEB_NOVEL',
        'Novel': 'NOVEL',
        'Other': 'OTHER'
    };

    // ===== XỬ LÝ OTHER (FORMAT / NĂM) =====
    const formatList = ['TV', 'TV_SHORT', 'MOVIE', 'OVA', 'ONA', 'SPECIAL', 'MUSIC'];
    let selectedFormat = filters.format || null;
    let selectedYear = filters.year || null;

    if (filters.other && Array.isArray(filters.other)) {
        for (const item of filters.other) {
            const upper = item.toUpperCase().replace('-', '_');
            if (formatList.includes(upper)) {
                selectedFormat = upper;
            }
            // XỬ LÝ THẬP KỶ (2020s → 2020)
            if (/^\d{4}s$/i.test(item)) {
                selectedYear = parseInt(item);
            }
            // XỬ LÝ NĂM CỤ THỂ (2024)
            if (/^\d{4}$/.test(item)) {
                selectedYear = parseInt(item);
            }
        }
    }

    // ===== XÂY DỰNG QUERY ĐỘNG =====
    // CHỈ THÊM PARAMETER VÀO QUERY NẾU CÓ GIÁ TRỊ
    const queryParams = [];
    const varDefs = [];
    const varValues = {};

    // KEYWORD
    if (keyword && keyword.trim()) {
        varDefs.push('$search: String');
        queryParams.push('search: $search');
        varValues.search = keyword.trim();
    }

    // GENRES
    if (genresList.length > 0) {
        varDefs.push('$genres: [String]');
        queryParams.push('genre_in: $genres');
        varValues.genres = genresList;
    }

    // TAGS
    if (tagsList.length > 0) {
        varDefs.push('$tags: [String]');
        queryParams.push('tag_in: $tags');
        varValues.tags = tagsList;
    }

    // SOURCE
    if (filters.source && filters.source.length && sourceMap[filters.source[0]]) {
        varDefs.push('$source: MediaSource');
        queryParams.push('source: $source');
        varValues.source = sourceMap[filters.source[0]];
    }

    // FORMAT
    if (selectedFormat) {
        varDefs.push('$format: MediaFormat');
        queryParams.push('format: $format');
        varValues.format = selectedFormat;
    }

    // NĂM
    if (selectedYear) {
        varDefs.push('$seasonYear: Int');
        queryParams.push('seasonYear: $seasonYear');
        varValues.seasonYear = selectedYear;
    }

    // SORT (LUÔN CÓ)
    varDefs.push('$sort: [MediaSort]');
    queryParams.push('sort: $sort');
    varValues.sort = [filters.sort || 'POPULARITY_DESC'];

    // ===== TẠO QUERY CUỐI CÙNG =====
    const varDefStr = '(' + varDefs.join(', ') + ')';
    const paramStr = queryParams.join(', ');

    const query = `
        query ${varDefStr} {
            Page(perPage: 30) {
                media(${paramStr}, type: ANIME, isAdult: false) {
                    id
                    title { romaji native english }
                    coverImage { large extraLarge }
                    genres
                    averageScore
                    popularity
                    episodes
                    format
                    seasonYear
                    siteUrl
                }
            }
        }
    `;

    console.log('[API] Query:', query);
    console.log('[API] Vars:', varValues);

    try {
        const data = await gql(query, varValues);
        const result = data && data.Page ? data.Page.media : [];
        console.log('[API] Kết quả:', result.length);
        return result;
    } catch (err) {
        console.error('[API] search lỗi:', err);
        return [];
    }
}

// ========== LẤY NHÂN VẬT (ANILIST) ==========
async function getCharacters(animeId) {
    const ANILIST_URL = 'https://graphql.anilist.co';
    const query = `
        query ($id: Int) {
            Media(id: $id) {
                characters(perPage: 25, sort: [ROLE, RELEVANCE, ID]) {
                    edges {
                        role
                        node {
                            id
                            name { full native }
                            image { large medium }
                            description
                            gender
                            age
                            favourites
                        }
                        voiceActors(language: JAPANESE) {
                            id
                            name { full }
                            image { large }
                        }
                    }
                }
            }
        }
    `;
    try {
        const res = await fetch(ANILIST_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ query, variables: { id: animeId } })
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        if (json.errors) throw new Error(json.errors[0].message);
        const edges = json.data?.Media?.characters?.edges || [];
        return edges.map(e => ({
            id: e.node.id,
            name: e.node.name.full,
            nativeName: e.node.name.native,
            image: e.node.image?.large || e.node.image?.medium || '',
            role: e.role,
            description: e.node.description || '',
            gender: e.node.gender,
            age: e.node.age,
            favourites: e.node.favourites,
            voiceActor: e.voiceActors?.[0] ? {
                name: e.voiceActors[0].name.full,
                image: e.voiceActors[0].image?.large || ''
            } : null
        }));
    } catch (err) {
        console.error('[API] getCharacters lỗi:', err);
        return [];
    }
}

// ========== LẤY DANH SÁCH TẬP (JIKAN) ==========
async function getEpisodes(malId) {
    try {
        const res = await fetch(`https://api.jikan.moe/v4/anime/${malId}/episodes`);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        if (!json.data) return [];
        return json.data.map(ep => ({
            malId: ep.mal_id,
            title: ep.title || `Tập ${ep.mal_id}`,
            titleJapanese: ep.title_japanese || '',
            titleRomanji: ep.title_romaji || '',
            aired: ep.aired,
            filler: ep.filler,
            recap: ep.recap,
            forumUrl: ep.forum_url,
            url: ep.url
        }));
    } catch (err) {
        console.error('[API] getEpisodes lỗi:', err);
        return [];
    }
}

// ========== LẤY MAL ID TỪ ANILIST ID ==========
async function getMalIdFromAnilist(anilistId) {
    const ANILIST_URL = 'https://graphql.anilist.co';
    const query = `
        query ($id: Int) {
            Media(id: $id) {
                idMal
            }
        }
    `;
    try {
        const res = await fetch(ANILIST_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables: { id: anilistId } })
        });
        const json = await res.json();
        return json.data?.Media?.idMal || null;
    } catch (err) {
        return null;
    }
}

// ========== LẤY TÓM TẮT TẬP (JIKAN) ==========
async function getEpisodeDetail(malId, episodeNumber) {
    try {
        const res = await fetch(`https://api.jikan.moe/v4/anime/${malId}/episodes/${episodeNumber}`);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        return json.data || null;
    } catch (err) {
        console.error('[API] getEpisodeDetail lỗi:', err);
        return null;
    }
}

// GÁN BIẾN TOÀN CỤC
window.API = {
    getSchedule, getSeasonal, getDetail, search,
    getCharacters, getEpisodes, getMalIdFromAnilist, getEpisodeDetail
};
