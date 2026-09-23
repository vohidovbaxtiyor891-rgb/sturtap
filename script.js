/* =========================================================
   KHAN CINEMA
   ========================================================= */

const TMDB_API_KEY = "d0ca3b6493c06f99791f1880d28f0c54";

const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";

const POSTER_CACHE_KEY = "khanCinemaPosterCacheV3";
const USER_KEY = "khanCinemaUser";
const THEME_KEY = "khanCinemaTheme";
const FAVORITES_KEY = "khanCinemaFavorites";

let currentType = "Kino";
let currentGenre = "all";
let currentSearch = "";
let currentPage = 1;

const ITEMS_PER_PAGE = 18;

let allContent = [];

let posterCache =
    JSON.parse(localStorage.getItem(POSTER_CACHE_KEY)) || {};

let currentSport = "football";


/* =========================================================
   HELPERS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}

function escapeHTML(text = "") {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function normalizeTitle(title = "") {
    return title
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();
}

function savePosterCache() {
    localStorage.setItem(
        POSTER_CACHE_KEY,
        JSON.stringify(posterCache)
    );
}


/* =========================================================
   TMDB
   ========================================================= */

async function tmdbRequest(endpoint, params = {}) {

    if (
        !TMDB_API_KEY ||
        TMDB_API_KEY.includes("BU_YERGA")
    ) {
        throw new Error("TMDB API key kiritilmagan");
    }

    const url = new URL(
        TMDB_API_URL + endpoint
    );

    url.searchParams.set(
        "api_key",
        TMDB_API_KEY
    );

    url.searchParams.set(
        "language",
        "en-US"
    );

    Object.entries(params).forEach(
        ([key, value]) => {
            url.searchParams.set(
                key,
                value
            );
        }
    );

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("TMDB error");
    }

    return response.json();
}


/* =========================================================
   LOAD CONTENT
   ========================================================= */

async function loadContent() {

    $("movieGrid").innerHTML = `
        <div class="loading">
            Kontent yuklanmoqda...
        </div>
    `;

    try {

        const [movies, tv, cartoons] =
            await Promise.all([
                loadTMDBType("movie"),
                loadTMDBType("tv"),
                loadTMDBCartoons()
            ]);

        allContent = [
            ...movies,
            ...tv,
            ...cartoons
        ];

        renderContent();

    } catch (error) {

        console.error(error);

        $("movieGrid").innerHTML = `
            <div class="loading">
                <h3>Kontentni yuklab bo'lmadi.</h3>
                <p style="margin-top:10px">
                    TMDB API kalitini tekshiring.
                </p>
            </div>
        `;
    }
}


/* =========================================================
   MOVIES
   ========================================================= */

async function loadTMDBType(type) {

    const results = [];

    for (let page = 1; page <= 3; page++) {

        const data = await tmdbRequest(
            `/discover/${type}`,
            {
                page,
                sort_by: "popularity.desc",
                include_adult: false
            }
        );

        data.results.forEach(item => {

            results.push({
                id: `${type}-${item.id}`,
                tmdbId: item.id,

                title:
                    item.title ||
                    item.name,

                type:
                    type === "movie"
                        ? "Kino"
                        : "Serial",

                poster:
                    item.poster_path
                        ? TMDB_IMAGE_URL +
                        item.poster_path
                        : null,

                overview:
                    item.overview || "",

                rating:
                    item.vote_average || 0,

                year:
                    (
                        item.release_date ||
                        item.first_air_date ||
                        ""
                    ).slice(0, 4),

                genreIds:
                    item.genre_ids || [],

                mediaType: type
            });

        });
    }

    return results;
}


/* =========================================================
   CARTOONS
   ========================================================= */

async function loadTMDBCartoons() {

    const results = [];

    for (let page = 1; page <= 3; page++) {

        const data = await tmdbRequest(
            "/discover/movie",
            {
                page,
                sort_by: "popularity.desc",
                include_adult: false,
                with_genres: 16
            }
        );

        data.results.forEach(item => {

            results.push({

                id: `cartoon-${item.id}`,

                tmdbId: item.id,

                title:
                    item.title,

                type:
                    "Multfilm",

                poster:
                    item.poster_path
                        ? TMDB_IMAGE_URL +
                        item.poster_path
                        : null,

                overview:
                    item.overview || "",

                rating:
                    item.vote_average || 0,

                year:
                    (
                        item.release_date || ""
                    ).slice(0, 4),

                genreIds:
                    item.genre_ids || [],

                mediaType:
                    "movie"

            });

        });
    }

    return results;
}


/* =========================================================
   RENDER CONTENT
   ========================================================= */

function getFilteredContent() {

    let list =
        allContent.filter(
            item =>
                item.type === currentType
        );


    if (currentGenre !== "all") {

        const genreId =
            Number(currentGenre);

        list =
            list.filter(
                item =>
                    item.genreIds.includes(
                        genreId
                    )
            );
    }


    if (currentSearch.trim()) {

        const search =
            normalizeTitle(
                currentSearch
            );

        list =
            list.filter(
                item =>
                    normalizeTitle(
                        item.title
                    ).includes(search)
            );
    }


    return list;
}


function renderContent() {

    const list =
        getFilteredContent();

    $("contentCount").textContent =
        list.length;


    const titleMap = {

        Kino:
            "Kinolar",

        Serial:
            "Seriallar",

        Multfilm:
            "Multfilmlar"

    };

    $("contentTitle").textContent =
        titleMap[currentType] ||
        "Kontent";


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                list.length /
                ITEMS_PER_PAGE
            )
        );


    if (
        currentPage >
        totalPages
    ) {
        currentPage = 1;
    }


    const start =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

    const pageItems =
        list.slice(
            start,
            start + ITEMS_PER_PAGE
        );


    if (!pageItems.length) {

        $("movieGrid").innerHTML = `
            <div class="loading">
                Bu bo'limda hech narsa topilmadi.
            </div>
        `;

    } else {

        $("movieGrid").innerHTML =
            pageItems
                .map(createMovieCard)
                .join("");
    }


    renderPagination(
        totalPages
    );
}


/* =========================================================
   MOVIE CARD
   ========================================================= */

function createMovieCard(item) {

    const favorites =
        getFavorites();

    const isFavorite =
        favorites.includes(
            item.id
        );


    const poster =
        item.poster ||
        createPosterFallback(
            item.title
        );


    return `

        <article
            class="movie-card"
            onclick="openMovie('${item.id}')"
        >

            <div class="poster">

                <img
                    src="${poster}"
                    alt="${escapeHTML(item.title)}"
                    loading="lazy"
                >

                <span class="poster-type">
                    ${item.type}
                </span>

                <button
                    class="favorite-btn ${isFavorite
            ? "active"
            : ""
        }"
                    onclick="
                        event.stopPropagation();
                        toggleFavorite('${item.id}')
                    "
                >
                    ${isFavorite
            ? "♥"
            : "♡"
        }
                </button>

            </div>

            <div class="movie-info">

                <div class="movie-title">
                    ${escapeHTML(item.title)}
                </div>

                <div class="movie-meta">

                    <span>
                        ${item.year || "—"}
                    </span>

                    <span class="rating">
                        ⭐
                        ${Number(
            item.rating || 0
        ).toFixed(1)}
                    </span>

                </div>

            </div>

        </article>
    `;
}


function createPosterFallback(title) {

    return (
        "https://placehold.co/500x750/171821/ffffff" +
        "?text=" +
        encodeURIComponent(
            "Poster mavjud emas"
        )
    );
}


/* =========================================================
   PAGINATION
   ========================================================= */

function renderPagination(totalPages) {

    const container =
        $("pagination");

    container.innerHTML = "";

    if (totalPages <= 1) {
        return;
    }


    const maxButtons = 7;

    let start =
        Math.max(
            1,
            currentPage - 3
        );

    let end =
        Math.min(
            totalPages,
            start + maxButtons - 1
        );


    if (
        end - start <
        maxButtons - 1
    ) {

        start =
            Math.max(
                1,
                end - maxButtons + 1
            );
    }


    if (currentPage > 1) {

        const btn =
            document.createElement(
                "button"
            );

        btn.className =
            "page-btn";

        btn.textContent =
            "‹";

        btn.onclick = () => {

            currentPage--;

            renderContent();

            scrollToMovies();
        };

        container.appendChild(btn);
    }


    for (
        let i = start;
        i <= end;
        i++
    ) {

        const btn =
            document.createElement(
                "button"
            );

        btn.className =
            "page-btn";

        if (i === currentPage) {
            btn.classList.add(
                "active"
            );
        }

        btn.textContent = i;

        btn.onclick = () => {

            currentPage = i;

            renderContent();

            scrollToMovies();
        };

        container.appendChild(btn);
    }


    if (
        currentPage <
        totalPages
    ) {

        const btn =
            document.createElement(
                "button"
            );

        btn.className =
            "page-btn";

        btn.textContent =
            "›";

        btn.onclick = () => {

            currentPage++;

            renderContent();

            scrollToMovies();
        };

        container.appendChild(btn);
    }
}


/* =========================================================
   NAVIGATION
   ========================================================= */

document
    .querySelectorAll(".nav-link")
    .forEach(link => {

        link.addEventListener(
            "click",
            event => {

                event.preventDefault();

                const type =
                    link.dataset.type;

                if (type) {

                    currentType =
                        type;

                    currentGenre =
                        "all";

                    currentSearch =
                        "";

                    currentPage =
                        1;

                    $("searchInput").value =
                        "";

                    document
                        .querySelectorAll(
                            ".genre-btn"
                        )
                        .forEach(btn =>
                            btn.classList.remove(
                                "active"
                            )
                        );

                    document
                        .querySelector(
                            '.genre-btn[data-genre="all"]'
                        )
                        .classList.add(
                            "active"
                        );

                    renderContent();

                    scrollToMovies();

                } else {

                    const section =
                        link.dataset.section;

                    if (
                        section ===
                        "sport"
                    ) {

                        scrollToSection(
                            "sport"
                        );

                    } else {

                        scrollToSection(
                            "home"
                        );
                    }
                }


                document
                    .querySelectorAll(
                        ".nav-link"
                    )
                    .forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );

                link.classList.add(
                    "active"
                );

            }
        );

    });


function goToMovies(type) {

    currentType = type;
    currentGenre = "all";
    currentSearch = "";
    currentPage = 1;

    $("searchInput").value = "";

    renderContent();

    scrollToMovies();
}


function scrollToMovies() {

    $("movies").scrollIntoView({
        behavior: "smooth"
    });
}


function scrollToSection(id) {

    $(id).scrollIntoView({
        behavior: "smooth"
    });
}


/* =========================================================
   SEARCH
   ========================================================= */

$("searchInput")
    .addEventListener(
        "input",
        event => {

            currentSearch =
                event.target.value;

            currentPage = 1;

            renderContent();
        }
    );


/* =========================================================
   GENRES
   ========================================================= */

document
    .querySelectorAll(".genre-btn")
    .forEach(btn => {

        btn.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".genre-btn"
                    )
                    .forEach(
                        b =>
                            b.classList.remove(
                                "active"
                            )
                    );

                btn.classList.add(
                    "active"
                );

                currentGenre =
                    btn.dataset.genre;

                currentPage = 1;

                renderContent();
            }
        );

    });


/* =========================================================
   MOVIE MODAL
   ========================================================= */

function openMovie(id) {

    const item =
        allContent.find(
            x => x.id === id
        );

    if (!item) {
        return;
    }


    const isFavorite =
        getFavorites().includes(
            item.id
        );


    const poster =
        item.poster ||
        createPosterFallback(
            item.title
        );


    $("movieDetails").innerHTML = `

        <div class="movie-detail">

            <div>

                <img
                    class="movie-detail-poster"
                    src="${poster}"
                    alt="${escapeHTML(
        item.title
    )}"
                >

            </div>

            <div>

                <span class="section-label">
                    ${item.type}
                </span>

                <h2>
                    ${escapeHTML(
        item.title
    )}
                </h2>

                <p>
                    ${item.overview ||
        "Ushbu kontent haqida ma'lumot mavjud emas."
        }
                </p>

                <p style="margin-top:15px">
                    📅 ${item.year || "—"}
                    &nbsp;&nbsp;
                    ⭐ ${Number(
            item.rating || 0
        ).toFixed(1)}
                </p>

                <div class="detail-actions">

                    <button
                        class="detail-favorite"
                        onclick="
                            toggleFavorite('${item.id}');
                            openMovie('${item.id}');
                        "
                    >
                        ${isFavorite
            ? "♥ Sevimlilardan olib tashlash"
            : "♡ Sevimlilarga qo'shish"
        }
                    </button>

                </div>

            </div>

        </div>
    `;


    $("movieModal")
        .classList.add("show");
}


function closeMovieModal() {

    $("movieModal")
        .classList.remove("show");
}


/* =========================================================
   FAVORITES
   ========================================================= */

function getFavorites() {

    return JSON.parse(
        localStorage.getItem(
            FAVORITES_KEY
        ) || "[]"
    );
}


function saveFavorites(list) {

    localStorage.setItem(
        FAVORITES_KEY,
        JSON.stringify(list)
    );
}


function toggleFavorite(id) {

    if (!getCurrentUser()) {

        showToast(
            "Sevimlilarga qo'shish uchun avval kiring."
        );

        openAuthModal();

        return;
    }


    let favorites =
        getFavorites();


    if (
        favorites.includes(id)
    ) {

        favorites =
            favorites.filter(
                x => x !== id
            );

        showToast(
            "Sevimlilardan olib tashlandi."
        );

    } else {

        favorites.push(id);

        showToast(
            "Sevimlilarga qo'shildi ❤️"
        );
    }


    saveFavorites(
        favorites
    );

    renderContent();

    renderProfileFavorites();
}


/* =========================================================
   AUTH
   ========================================================= */

function getCurrentUser() {

    return JSON.parse(
        localStorage.getItem(
            USER_KEY
        ) || "null"
    );
}


function saveUser(user) {

    localStorage.setItem(
        USER_KEY,
        JSON.stringify(user)
    );
}


$("authButton")
    .addEventListener(
        "click",
        openAuthModal
    );


function openAuthModal() {

    $("authModal")
        .classList.add("show");
}


function closeAuthModal() {

    $("authModal")
        .classList.remove("show");
}


document
    .querySelectorAll(".auth-tab")
    .forEach(tab => {

        tab.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".auth-tab"
                    )
                    .forEach(
                        t =>
                            t.classList.remove(
                                "active"
                            )
                    );

                tab.classList.add(
                    "active"
                );

                const type =
                    tab.dataset.auth;


                if (type === "login") {

                    $("loginForm")
                        .classList.remove(
                            "hidden"
                        );

                    $("registerForm")
                        .classList.add(
                            "hidden"
                        );

                    $("authTitle")
                        .textContent =
                        "Kirish";

                } else {

                    $("loginForm")
                        .classList.add(
                            "hidden"
                        );

                    $("registerForm")
                        .classList.remove(
                            "hidden"
                        );

                    $("authTitle")
                        .textContent =
                        "Akkaunt yaratish";
                }

            }
        );

    });


/* LOGIN */

$("loginForm")
    .addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const email =
                $("loginEmail")
                    .value.trim();

            const password =
                $("loginPassword")
                    .value;


            const savedUser =
                JSON.parse(
                    localStorage.getItem(
                        "khanCinemaAccount"
                    ) || "null"
                );


            if (
                !savedUser ||
                savedUser.email !== email ||
                savedUser.password !== password
            ) {

                showToast(
                    "Email yoki parol noto'g'ri."
                );

                return;
            }


            saveUser(
                savedUser
            );

            closeAuthModal();

            updateHeader();

            showToast(
                "Xush kelibsiz, " +
                savedUser.name +
                "!"
            );
        }
    );


/* REGISTER */

$("registerForm")
    .addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const user = {

                name:
                    $("registerName")
                        .value.trim(),

                surname:
                    $("registerSurname")
                        .value.trim(),

                email:
                    $("registerEmail")
                        .value.trim(),

                password:
                    $("registerPassword")
                        .value,

                phone: "",

                about: "",

                avatar:
                    createDefaultAvatar(
                        $("registerName")
                            .value.trim()
                    )

            };


            localStorage.setItem(
                "khanCinemaAccount",
                JSON.stringify(
                    user
                )
            );


            saveUser(
                user
            );


            closeAuthModal();

            updateHeader();

            showToast(
                "Akkauntingiz yaratildi! 🎉"
            );
        }
    );


/* =========================================================
   HEADER USER
   ========================================================= */

function updateHeader() {

    const user =
        getCurrentUser();


    if (user) {

        $("authButton")
            .classList.add(
                "hidden"
            );

        $("profileButton")
            .classList.remove(
                "hidden"
            );


        $("headerUserName")
            .textContent =
            user.name ||
            "Profil";


        $("headerAvatar")
            .src =
            user.avatar ||
            createDefaultAvatar(
                user.name
            );

    } else {

        $("authButton")
            .classList.remove(
                "hidden"
            );

        $("profileButton")
            .classList.add(
                "hidden"
            );
    }
}


function createDefaultAvatar(name = "User") {

    const letter =
        name
            .trim()
            .charAt(0)
            .toUpperCase() ||
        "U";


    return (
        "https://ui-avatars.com/api/" +
        "?name=" +
        encodeURIComponent(letter) +
        "&background=e50914&color=fff&size=256"
    );
}


/* =========================================================
   PROFILE
   ========================================================= */

$("profileButton")
    .addEventListener(
        "click",
        openProfile
    );


function openProfile() {

    const user =
        getCurrentUser();


    if (!user) {

        openAuthModal();

        return;
    }


    fillProfile(
        user
    );

    renderProfileFavorites();


    $("profileModal")
        .classList.add("show");
}


function closeProfile() {

    $("profileModal")
        .classList.remove("show");
}


function fillProfile(user) {

    $("profileAvatar")
        .src =
        user.avatar ||
        createDefaultAvatar(
            user.name
        );


    $("profileName")
        .textContent =
        `${user.name || ""} ${user.surname || ""
            }`.trim() ||
        "Profil";


    $("profileEmail")
        .textContent =
        user.email || "";


    $("infoName")
        .textContent =
        user.name || "-";


    $("infoSurname")
        .textContent =
        user.surname || "-";


    $("infoPhone")
        .textContent =
        user.phone || "-";


    $("infoEmail")
        .textContent =
        user.email || "-";


    $("infoAbout")
        .textContent =
        user.about ||
        "Ma'lumot yo'q";
}


/* =========================================================
   PROFILE EDIT
   ========================================================= */

$("editProfileBtn")
    .addEventListener(
        "click",
        () => {

            const user =
                getCurrentUser();


            $("editName").value =
                user.name || "";

            $("editSurname").value =
                user.surname || "";

            $("editPhone").value =
                user.phone || "";

            $("editEmail").value =
                user.email || "";

            $("editAbout").value =
                user.about || "";


            $("profileInfo")
                .classList.add(
                    "hidden"
                );

            $("profileEditForm")
                .classList.remove(
                    "hidden"
                );
        }
    );


$("cancelEditBtn")
    .addEventListener(
        "click",
        () => {

            $("profileInfo")
                .classList.remove(
                    "hidden"
                );

            $("profileEditForm")
                .classList.add(
                    "hidden"
                );
        }
    );


$("profileEditForm")
    .addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const user =
                getCurrentUser();


            user.name =
                $("editName")
                    .value.trim();

            user.surname =
                $("editSurname")
                    .value.trim();

            user.phone =
                $("editPhone")
                    .value.trim();

            user.email =
                $("editEmail")
                    .value.trim();

            user.about =
                $("editAbout")
                    .value.trim();


            saveUser(user);


            localStorage.setItem(
                "khanCinemaAccount",
                JSON.stringify(user)
            );


            fillProfile(user);

            updateHeader();


            $("profileInfo")
                .classList.remove(
                    "hidden"
                );

            $("profileEditForm")
                .classList.add(
                    "hidden"
                );


            showToast(
                "Profil saqlandi."
            );
        }
    );


/* =========================================================
   AVATAR
   ========================================================= */

$("avatarInput")
    .addEventListener(
        "change",
        event => {

            const file =
                event.target.files[0];


            if (!file) {
                return;
            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                showToast(
                    "Faqat rasm tanlang."
                );

                return;
            }


            const reader =
                new FileReader();


            reader.onload =
                () => {

                    const user =
                        getCurrentUser();


                    user.avatar =
                        reader.result;


                    saveUser(
                        user
                    );


                    localStorage.setItem(
                        "khanCinemaAccount",
                        JSON.stringify(
                            user
                        )
                    );


                    fillProfile(
                        user
                    );

                    updateHeader();


                    showToast(
                        "Avatar o'zgartirildi."
                    );
                };


            reader.readAsDataURL(
                file
            );
        }
    );


/* =========================================================
   PROFILE FAVORITES
   ========================================================= */

function renderProfileFavorites() {

    const grid =
        $("favoriteGrid");

    if (!grid) {
        return;
    }


    const ids =
        getFavorites();


    $("favoriteCount")
        .textContent =
        `${ids.length} ta`;


    const items =
        ids
            .map(
                id =>
                    allContent.find(
                        item =>
                            item.id === id
                    )
            )
            .filter(Boolean);


    if (!items.length) {

        grid.innerHTML = `
            <div class="empty-favorites">
                ❤️ Hali sevimlilar ro'yxatingiz bo'sh.
            </div>
        `;

        return;
    }


    grid.innerHTML =
        items
            .map(item => {

                const poster =
                    item.poster ||
                    createPosterFallback(
                        item.title
                    );


                return `
                    <div
                        class="favorite-item"
                        onclick="openMovie('${item.id}')"
                    >

                        <img
                            src="${poster}"
                            alt="${escapeHTML(
                    item.title
                )}"
                        >

                        <div>
                            ${escapeHTML(
                    item.title
                )}
                        </div>

                    </div>
                `;
            })
            .join("");
}


/* =========================================================
   LOGOUT
   ========================================================= */

$("logoutBtn")
    .addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                USER_KEY
            );

            closeProfile();

            updateHeader();

            showToast(
                "Akkauntdan chiqdingiz."
            );
        }
    );


/* =========================================================
   SPORT LIVE
   ========================================================= */

const sportEndpoints = {

    football:
        "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard",

    basketball:
        "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",

    tennis:
        "https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard"

};


async function loadSport(sport) {

    currentSport = sport;


    $("sportGrid").innerHTML = `
        <div class="loading">
            ${getSportName(sport)}
            yuklanmoqda...
        </div>
    `;


    if (sport === "ufc") {

        renderUFCDemo();

        return;
    }


    if (sport === "all") {

        await loadAllSports();

        return;
    }


    try {

        const url =
            sportEndpoints[sport];


        const response =
            await fetch(url);


        if (!response.ok) {
            throw new Error();
        }


        const data =
            await response.json();


        renderSportEvents(
            data.events || [],
            sport
        );


    } catch (error) {

        renderSportFallback(
            sport
        );
    }
}


function getSportName(sport) {

    const names = {

        football:
            "Football",

        basketball:
            "Basketball",

        tennis:
            "Tennis",

        ufc:
            "UFC",

        all:
            "Sport"

    };

    return names[sport] ||
        "Sport";
}


function renderSportEvents(
    events,
    sport
) {

    if (!events.length) {

        renderSportFallback(
            sport
        );

        return;
    }


    $("sportGrid").innerHTML =
        events
            .slice(0, 12)
            .map(
                event =>
                    createSportCard(
                        event,
                        sport
                    )
            )
            .join("");
}


function createSportCard(
    event,
    sport
) {

    const competition =
        event.competitions?.[0];


    const competitors =
        competition?.competitors ||
        [];


    const home =
        competitors.find(
            x =>
                x.homeAway ===
                "home"
        );


    const away =
        competitors.find(
            x =>
                x.homeAway ===
                "away"
        );


    const status =
        event.status
            ?.type
            ?.shortDetail ||
        event.status
            ?.type
            ?.detail ||
        "Scheduled";


    return `

        <div class="sport-card">

            <div class="sport-top">

                <span class="sport-name">
                    ${getSportName(
        sport
    )}
                </span>

                <span class="sport-live">
                    ● LIVE
                </span>

            </div>

            <div class="teams">

                <div class="team">

                    <span class="team-name">
                        ${escapeHTML(
        home?.team?.displayName ||
        "Home"
    )
        }
                    </span>

                    <span class="team-score">
                        ${home?.score ??
        "-"
        }
                    </span>

                </div>

                <div class="team">

                    <span class="team-name">
                        ${escapeHTML(
            away?.team?.displayName ||
            "Away"
        )
        }
                    </span>

                    <span class="team-score">
                        ${away?.score ??
        "-"
        }
                    </span>

                </div>

            </div>

            <div class="sport-time">
                ${escapeHTML(status)}
            </div>

        </div>

    `;
}


/* =========================================================
   SPORT FALLBACK
   ========================================================= */

function renderSportFallback(
    sport
) {

    const demo = {

        football: [
            ["Manchester City", "Real Madrid"],
            ["Barcelona", "Bayern Munich"],
            ["Liverpool", "Arsenal"],
            ["PSG", "Inter"]
        ],

        basketball: [
            ["Lakers", "Warriors"],
            ["Celtics", "Bucks"],
            ["Nets", "Knicks"],
            ["Heat", "Bulls"]
        ],

        tennis: [
            ["Carlos Alcaraz", "Jannik Sinner"],
            ["Novak Djokovic", "Alexander Zverev"],
            ["Daniil Medvedev", "Taylor Fritz"]
        ]

    };


    const games =
        demo[sport] || [];


    if (!games.length) {

        $("sportGrid").innerHTML = `
            <div class="loading">
                Hozircha ${getSportName(
            sport
        )} o'yinlari topilmadi.
            </div>
        `;

        return;
    }


    $("sportGrid").innerHTML =
        games
            .map(
                game => `

                    <div class="sport-card">

                        <div class="sport-top">

                            <span class="sport-name">
                                ${getSportName(
                    sport
                )}
                            </span>

                            <span class="sport-live">
                                ● LIVE
                            </span>

                        </div>

                        <div class="teams">

                            <div class="team">

                                <span class="team-name">
                                    ${game[0]}
                                </span>

                                <span class="team-score">
                                    -
                                </span>

                            </div>

                            <div class="team">

                                <span class="team-name">
                                    ${game[1]}
                                </span>

                                <span class="team-score">
                                    -
                                </span>

                            </div>

                        </div>

                        <div class="sport-time">
                            Live / Jadval
                        </div>

                    </div>
                `
            )
            .join("");
}


function renderUFCDemo() {

    const fights = [
        ["UFC Main Event", "Live Card"],
        ["UFC Fight Night", "Upcoming"],
        ["UFC Main Card", "Live"],
        ["UFC Prelims", "Upcoming"]
    ];


    $("sportGrid").innerHTML =
        fights
            .map(
                fight => `

                    <div class="sport-card">

                        <div class="sport-top">

                            <span class="sport-name">
                                🥊 UFC
                            </span>

                            <span class="sport-live">
                                ● LIVE
                            </span>

                        </div>

                        <div class="teams">

                            <div class="team">

                                <span class="team-name">
                                    ${fight[0]}
                                </span>

                                <span class="team-score">
                                    🥊
                                </span>

                            </div>

                            <div class="team">

                                <span class="team-name">
                                    ${fight[1]}
                                </span>

                                <span class="team-score">
                                    —
                                </span>

                            </div>

                        </div>

                        <div class="sport-time">
                            Sport Live
                        </div>

                    </div>
                `
            )
            .join("");
}


/* =========================================================
   ALL SPORTS
   ========================================================= */

async function loadAllSports() {

    $("sportGrid").innerHTML = `
        <div class="loading">
            Barcha sportlar yuklanmoqda...
        </div>
    `;


    const sports = [
        "football",
        "basketball",
        "tennis"
    ];


    let html = "";


    for (const sport of sports) {

        try {

            const response =
                await fetch(
                    sportEndpoints[sport]
                );

            const data =
                await response.json();


            const events =
                data.events || [];


            html += events
                .slice(0, 3)
                .map(
                    event =>
                        createSportCard(
                            event,
                            sport
                        )
                )
                .join("");

        } catch {

            // fallback pastda
        }
    }


    if (!html) {

        $("sportGrid").innerHTML = `
            <div class="loading">
                Hozircha sport ma'lumotlari mavjud emas.
            </div>
        `;

    } else {

        $("sportGrid").innerHTML =
            html;
    }
}


/* SPORT BUTTONS */

document
    .querySelectorAll(".sport-tab")
    .forEach(btn => {

        btn.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".sport-tab"
                    )
                    .forEach(
                        x =>
                            x.classList.remove(
                                "active"
                            )
                    );

                btn.classList.add(
                    "active"
                );


                loadSport(
                    btn.dataset.sport
                );
            }
        );

    });


/* =========================================================
   THEME
   ========================================================= */

$("themeBtn")
    .addEventListener(
        "click",
        () => {

            document.body
                .classList.toggle(
                    "light"
                );


            const light =
                document.body
                    .classList.contains(
                        "light"
                    );


            localStorage.setItem(
                THEME_KEY,
                light
                    ? "light"
                    : "dark"
            );


            $("themeBtn")
                .textContent =
                light
                    ? "☀️"
                    : "🌙";
        }
    );


function loadTheme() {

    const theme =
        localStorage.getItem(
            THEME_KEY
        );


    if (theme === "light") {

        document.body
            .classList.add(
                "light"
            );

        $("themeBtn")
            .textContent =
            "☀️";

    } else {

        $("themeBtn")
            .textContent =
            "🌙";
    }
}


/* =========================================================
   LANGUAGE
   ========================================================= */

const translations = {

    uz: {

        home:
            "Bosh sahifa",

        sport:
            "Sport Live",

        movies:
            "Kinolar",

        series:
            "Seriallar",

        cartoons:
            "Multfilmlar",

        auth:
            "Kirish / Akkaunt yaratish"

    },

    ru: {

        home:
            "Главная",

        sport:
            "Спорт Live",

        movies:
            "Фильмы",

        series:
            "Сериалы",

        cartoons:
            "Мультфильмы",

        auth:
            "Войти / Создать аккаунт"

    },

    en: {

        home:
            "Home",

        sport:
            "Sport Live",

        movies:
            "Movies",

        series:
            "Series",

        cartoons:
            "Cartoons",

        auth:
            "Login / Create account"

    }

};


$("languageSelect")
    .addEventListener(
        "change",
        event => {

            const lang =
                event.target.value;

            const t =
                translations[lang];


            const links =
                document.querySelectorAll(
                    ".nav-link"
                );


            links[0].textContent =
                t.home;

            links[1].textContent =
                t.sport;

            links[2].textContent =
                t.movies;

            links[3].textContent =
                t.series;

            links[4].textContent =
                t.cartoons;


            if (
                !getCurrentUser()
            ) {

                $("authButton")
                    .textContent =
                    t.auth;
            }
        }
    );


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer;


function showToast(message) {

    const toast =
        $("toast");


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );
}


/* =========================================================
   MODAL CLICK OUTSIDE
   ========================================================= */

document
    .querySelectorAll(".modal")
    .forEach(modal => {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    modal.classList.remove(
                        "show"
                    );
                }

            }
        );

    });


/* =========================================================
   INITIALIZATION
   ========================================================= */

async function init() {

    loadTheme();

    updateHeader();

    await loadContent();

    loadSport(
        "football"
    );
}


init();
