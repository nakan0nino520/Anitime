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

// LỊCH PHÁT SÓNG
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

// HÀM TÌM KIẾM CHÍNH (PHÂN TÁCH ĐÚNG GENRES VÀ TAGS CHO ANILIST)
async function search(keyword, filters = {}) {
    const query = `
        query ($search: String, $genres: [String], $tags: [String], $source: MediaSource, $format: MediaFormat, $sort: [MediaSort], $seasonYear: Int) {
            Page(perPage: 30) {
                media(search: $search, genre_in: $genres, tag_in: $tags, source: $source, format: $format, seasonYear: $seasonYear, type: ANIME, sort: $sort) {
                    id title { romaji native english }
                    coverImage { large }
                    genres averageScore popularity episodes format seasonYear
                }
            }
        }
    `;

    // Map Nguồn từ UI sang chuẩn Enum của AniList API
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

    // Xử lý bộ lọc phần "Khác" (Format hoặc Thập kỷ / Năm)
    const formatList = ['TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL'];
    let selectedFormat = filters.format || null;
    let selectedYear = filters.year || null;

    if (filters.other && Array.isArray(filters.other)) {
        for (const item of filters.other) {
            const upper = item.toUpperCase();
            if (formatList.includes(upper)) {
                selectedFormat = upper;
            }
            if (/^\d{4}s$/.test(item)) {
                selectedYear = parseInt(item);
            }
        }
    }

    // Danh sách các thể loại chính thức của AniList
    const officialGenres = [
        'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi',
        'Fantasy', 'Horror', 'Mahou Shoujo', 'Mecha', 'Music',
        'Mystery', 'Psychological', 'Romance', 'Sci-Fi',
        'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
    ];

    const rawGenres = filters.genres || [];
    const genresList = rawGenres.filter(g => officialGenres.includes(g));

    // Đẩy các tag từ themes, demographics và thể loại phụ vào tag_in
    const tagsList = [
        ...(filters.themes || []),
        ...(filters.demographics || []),
        ...rawGenres.filter(g => !officialGenres.includes(g))
    ];

    const vars = {
        search: keyword && keyword.trim() ? keyword.trim() : null,
        genres: genresList.length ? genresList : null,
        tags: tagsList.length ? tagsList : null,
        source: filters.source && filters.source.length ? (sourceMap[filters.source[0]] || null) : null,
        format: selectedFormat,
        seasonYear: selectedYear,
        sort: [filters.sort || 'POPULARITY_DESC']
    };

    const data = await gql(query, vars);
    return data && data.Page ? data.Page.media : [];
}

// Gán biến toàn cục
window.API = { getSchedule, getSeasonal, getDetail, search };
