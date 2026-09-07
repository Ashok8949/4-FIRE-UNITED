/* =========================================================
   4FU WORLD EXPLORER
   PREMIUM GLOBAL INTERACTIVE MAP
========================================================= */


/* =========================================================
   ELEMENTS
========================================================= */

const globeElement =
    document.getElementById("globeViz");

const loadingScreen =
    document.getElementById("globeLoading");

const countryHoverName =
    document.getElementById("countryHoverName");

const countryDetail =
    document.getElementById("countryDetail");

const detailCountry =
    document.getElementById("detailCountry");

const detailOfficial =
    document.getElementById("detailOfficial");

const detailFlag =
    document.getElementById("detailFlag");

const detailCapital =
    document.getElementById("detailCapital");

const detailRegion =
    document.getElementById("detailRegion");

const detailSubRegion =
    document.getElementById("detailSubRegion");

const detailPopulation =
    document.getElementById("detailPopulation");

const detailArea =
    document.getElementById("detailArea");

const detailCode =
    document.getElementById("detailCode");

const detailCurrency =
    document.getElementById("detailCurrency");

const detailLanguages =
    document.getElementById("detailLanguages");

const detailNative =
    document.getElementById("detailNative");

const detailDemonym =
    document.getElementById("detailDemonym");

const detailCalling =
    document.getElementById("detailCalling");

const detailTimezone =
    document.getElementById("detailTimezone");

const detailDensity =
    document.getElementById("detailDensity");

const detailBorders =
    document.getElementById("detailBorders");

const countrySearch =
    document.getElementById("countrySearch");

const searchResults =
    document.getElementById("searchResults");

const clearSearch =
    document.getElementById("clearSearch");

const countryCount =
    document.getElementById("countryCount");

const regionCount =
    document.getElementById("regionCount");

const hudLat =
    document.getElementById("hudLat");

const hudLng =
    document.getElementById("hudLng");

const hudZoom =
    document.getElementById("hudZoom");

const explorePanel =
    document.getElementById("explorePanel");

const networkPanel =
    document.getElementById("networkPanel");


/* =========================================================
   STATE
========================================================= */

let globe = null;

let countries = [];

let countryDirectory = [];

let countryCache = new Map();

let selectedCountry = null;

let selectedFeature = null;

let hoveredFeature = null;

let isDragging = false;

let interactionTimer = null;

let detailsRequestId = 0;

let directoryReady = false;


/* =========================================================
   COLORS
========================================================= */

const COLORS = {

    country:
        "rgba(18, 40, 58, 0.34)",

    countryHover:
        "rgba(255, 114, 0, 0.34)",

    countrySelected:
        "rgba(255, 114, 0, 0.72)",

    border:
        "rgba(255, 112, 0, 0.92)"

};


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeGlobe();

        setupEvents();

        loadCountryDirectory();

    }
);


/* =========================================================
   INITIALIZE GLOBE
========================================================= */

function initializeGlobe() {

    if (!globeElement) {
        return;
    }


    globe =
        Globe()(globeElement)

            .backgroundColor(
                "rgba(0,0,0,0)"
            )

            .showAtmosphere(true)

            .atmosphereColor(
                "#ff7200"
            )

            .atmosphereAltitude(
                0.13
            )

            .globeImageUrl(
                "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            )

            .bumpImageUrl(
                "https://unpkg.com/three-globe/example/img/earth-topology.png"
            )

            .width(
                globeElement.clientWidth
            )

            .height(
                globeElement.clientHeight
            )

            .polygonAltitude(
                feature => {

                    if (
                        feature ===
                        selectedFeature
                    ) {

                        return 0.022;

                    }

                    if (
                        feature ===
                        hoveredFeature
                    ) {

                        return 0.013;

                    }

                    return 0.004;

                }
            )

            .polygonCapColor(
                feature => {

                    if (
                        feature ===
                        selectedFeature
                    ) {

                        return COLORS.countrySelected;

                    }

                    if (
                        feature ===
                        hoveredFeature
                    ) {

                        return COLORS.countryHover;

                    }

                    return COLORS.country;

                }
            )

            .polygonSideColor(
                () =>
                    "rgba(255,90,0,.08)"
            )

            .polygonStrokeColor(
                () =>
                    COLORS.border
            )

            .polygonLabel(
                feature => {

                    const name =
                        getCountryName(
                            feature
                        );

                    return `
                        <div class="country-tooltip">
                            <strong>
                                ${escapeHtml(name)}
                            </strong>

                            <span>
                                CLICK TO EXPLORE
                            </span>
                        </div>
                    `;

                }
            )

            .onPolygonHover(
                feature => {

                    handleCountryHover(
                        feature
                    );

                }
            )

            .onPolygonClick(
                feature => {

                    handleCountryClick(
                        feature
                    );

                }
            );


    /* =====================================================
       CAMERA
    ====================================================== */

    globe.pointOfView(
        {
            lat: 20,
            lng: 15,
            altitude: 2.05
        },
        0
    );


    /* =====================================================
       CONTROLS
    ====================================================== */

    const controls =
        globe.controls();


    controls.autoRotate = true;

    controls.autoRotateSpeed = 0.30;

    controls.enableDamping = true;

    controls.dampingFactor = 0.07;

    controls.enablePan = false;

    controls.rotateSpeed = 0.55;

    controls.zoomSpeed = 0.55;

    controls.minDistance = 165;

    controls.maxDistance = 520;


    /* =====================================================
       INTERACTION
    ====================================================== */

    globeElement.addEventListener(
        "pointerdown",
        () => {

            isDragging = true;

            clearTimeout(
                interactionTimer
            );

            controls.autoRotate = false;

        }
    );


    globeElement.addEventListener(
        "pointerup",
        () => {

            isDragging = false;

            resumeAutoRotation();

        }
    );


    globeElement.addEventListener(
        "pointercancel",
        () => {

            isDragging = false;

            resumeAutoRotation();

        }
    );


    globeElement.addEventListener(
        "mouseleave",
        () => {

            if (
                !selectedFeature &&
                !isDragging
            ) {

                resumeAutoRotation();

            }

        }
    );


    globeElement.addEventListener(
        "touchend",
        () => {

            isDragging = false;

            resumeAutoRotation();

        },
        {
            passive: true
        }
    );


    globeElement.addEventListener(
        "touchcancel",
        () => {

            isDragging = false;

            resumeAutoRotation();

        },
        {
            passive: true
        }
    );


    /* =====================================================
       RESIZE
    ====================================================== */

    window.addEventListener(
        "resize",
        resizeGlobe
    );


    /* =====================================================
       HUD
    ====================================================== */

    setInterval(
        updateHUD,
        150
    );


    /*
       Performance
    */

    try {

        const renderer =
            globe.renderer();

        if (renderer) {

            renderer.setPixelRatio(
                Math.min(
                    window.devicePixelRatio || 1,
                    1.35
                )
            );

        }

    }
    catch (error) {

        console.warn(
            "Renderer optimization unavailable"
        );

    }

}


/* =========================================================
   AUTO ROTATION
========================================================= */

function resumeAutoRotation() {

    clearTimeout(
        interactionTimer
    );


    interactionTimer =
        setTimeout(
            () => {

                if (
                    !selectedFeature &&
                    !countryDetail.classList.contains(
                        "active"
                    )
                ) {

                    globe.controls().autoRotate =
                        true;

                }

            },
            700
        );

}


/* =========================================================
   RESIZE
========================================================= */

function resizeGlobe() {

    if (!globe || !globeElement) {
        return;
    }


    const width =
        globeElement.clientWidth;

    const height =
        globeElement.clientHeight;


    if (
        width <= 0 ||
        height <= 0
    ) {

        return;

    }


    globe
        .width(width)
        .height(height);

}


/* =========================================================
   LOAD COUNTRY DIRECTORY
========================================================= */

async function loadCountryDirectory() {

    try {

        const response =
            await fetch(
                "https://countries.dev/countries?fields=name,alpha2Code,alpha3Code,flag,flags,region,subregion,latlng"
            );


        if (!response.ok) {

            throw new Error(
                "Country directory failed"
            );

        }


        const data =
            await response.json();


        countryDirectory =
            Array.isArray(data)
                ? data
                : (
                    data.countries ||
                    data.data ||
                    []
                );


        directoryReady = true;


        if (
            countryDirectory.length
        ) {

            countryCount.textContent =
                countryDirectory.length;

        }


        /*
           Pre-cache directory
        */

        countryDirectory.forEach(
            country => {

                const code =
                    country.alpha2Code ||
                    country.alpha3Code;

                if (code) {

                    countryCache.set(
                        String(code).toUpperCase(),
                        country
                    );

                }

            }
        );


        setupSearch();


    }
    catch (error) {

        console.warn(
            "Country directory error:",
            error
        );

        directoryReady = false;

        setupSearch();

    }

}


/* =========================================================
   LOAD WORLD MAP
========================================================= */

async function loadWorldMap() {

    try {

        const response =
            await fetch(
                "https://unpkg.com/world-atlas@2/countries-110m.json"
            );


        if (!response.ok) {

            throw new Error(
                "World map unavailable"
            );

        }


        const world =
            await response.json();


        const geoData =
            topojson.feature(
                world,
                world.objects.countries
            );


        countries =
            (
                geoData.features ||
                []
            )
                .filter(
                    feature =>
                        getCountryName(
                            feature
                        ) !== "Antarctica"
                );


        globe
            .polygonsData(
                countries
            );


        updateNetworkStats();


        hideLoading();


    }
    catch (error) {

        console.error(
            "World map error:",
            error
        );


        hideLoading();


        if (countryCount) {
            countryCount.textContent = "—";
        }

    }

}


/* =========================================================
   START WORLD MAP
========================================================= */

loadWorldMap();


/* =========================================================
   COUNTRY NAME
========================================================= */

function getCountryName(
    feature
) {

    if (!feature) {
        return "Unknown Country";
    }


    const props =
        feature.properties ||
        {};


    return (

        props.name ||

        props.NAME ||

        props.ADMIN ||

        props.admin ||

        props.name_long ||

        "Unknown Country"

    );

}


/* =========================================================
   NORMALIZE NAME
========================================================= */

function normalizeCountryName(
    name
) {

    return String(
        name || ""
    )
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[^a-z0-9]+/g,
            " "
        )
        .trim();

}


/* =========================================================
   ALIASES
========================================================= */

const COUNTRY_ALIASES = {

    "united states":
        [
            "united states of america"
        ],

    "russia":
        [
            "russian federation"
        ],

    "south korea":
        [
            "republic of korea",
            "korea republic of"
        ],

    "north korea":
        [
            "democratic people s republic of korea"
        ],

    "iran":
        [
            "iran islamic republic of"
        ],

    "syria":
        [
            "syrian arab republic"
        ],

    "venezuela":
        [
            "venezuela bolivarian republic of"
        ],

    "bolivia":
        [
            "bolivia plurinational state of"
        ],

    "tanzania":
        [
            "tanzania united republic of"
        ],

    "vietnam":
        [
            "viet nam"
        ],

    "laos":
        [
            "lao people s democratic republic"
        ],

    "moldova":
        [
            "moldova republic of"
        ],

    "brunei":
        [
            "brunei darussalam"
        ],

    "cape verde":
        [
            "cabo verde"
        ],

    "ivory coast":
        [
            "cote d ivoire"
        ],

    "czechia":
        [
            "czech republic"
        ],

    "turkiye":
        [
            "turkey"
        ],

    "eswatini":
        [
            "swaziland"
        ]

};


/* =========================================================
   FIND MAP FEATURE
========================================================= */

function findMapFeature(
    country
) {

    if (!country) {
        return null;
    }


    const target =
        normalizeCountryName(
            getDirectoryName(
                country
            )
        );


    let feature =
        countries.find(
            item =>
                normalizeCountryName(
                    getCountryName(item)
                ) === target
        );


    if (feature) {
        return feature;
    }


    const aliases =
        COUNTRY_ALIASES[target] ||
        [];


    feature =
        countries.find(
            item => {

                const mapName =
                    normalizeCountryName(
                        getCountryName(item)
                    );


                return aliases.includes(
                    mapName
                );

            }
        );


    return feature || null;

}


/* =========================================================
   DIRECTORY COUNTRY NAME
========================================================= */

function getDirectoryName(
    country
) {

    if (!country) {
        return "Unknown Country";
    }


    if (
        typeof country.name ===
        "string"
    ) {

        return country.name;

    }


    if (
        country.name &&
        typeof country.name ===
        "object"
    ) {

        return (
            country.name.common ||
            country.name.official ||
            "Unknown Country"
        );

    }


    return (
        country.commonName ||
        "Unknown Country"
    );

}


/* =========================================================
   FLAGS
========================================================= */

function getCountryFlag(
    country
) {

    if (!country) {
        return "🌍";
    }


    if (
        typeof country.flag ===
        "string" &&
        country.flag
    ) {

        return country.flag;

    }


    const code =
        country.alpha2Code ||
        country.cca2 ||
        "";


    if (
        code.length !== 2
    ) {

        return "🌍";

    }


    return code
        .toUpperCase()
        .split("")
        .map(
            char =>
                String.fromCodePoint(
                    127397 +
                    char.charCodeAt(0)
                )
        )
        .join("");

}


/* =========================================================
   SEARCH
========================================================= */

function setupSearch() {

    if (!countrySearch) {
        return;
    }


    countrySearch.addEventListener(
        "input",
        () => {

            renderSearchResults(
                countrySearch.value
            );

        }
    );


    countrySearch.addEventListener(
        "focus",
        () => {

            if (
                countrySearch.value.trim()
            ) {

                renderSearchResults(
                    countrySearch.value
                );

            }

        }
    );


    clearSearch.addEventListener(
        "click",
        () => {

            countrySearch.value = "";

            searchResults.innerHTML = "";

            searchResults.style.display =
                "none";

            countrySearch.focus();

        }
    );


    document.addEventListener(
        "click",
        event => {

            const area =
                document.querySelector(
                    ".search-area"
                );


            if (
                area &&
                !area.contains(
                    event.target
                )
            ) {

                searchResults.style.display =
                    "none";

            }

        }
    );

}


/* =========================================================
   RENDER SEARCH
========================================================= */

function renderSearchResults(
    value
) {

    const query =
        value
            .trim()
            .toLowerCase();


    if (!query) {

        searchResults.style.display =
            "none";

        searchResults.innerHTML = "";

        return;

    }


    if (!directoryReady) {

        searchResults.innerHTML = `
            <div class="search-loading">
                <span class="search-spinner"></span>
                LOADING COUNTRIES...
            </div>
        `;

        searchResults.style.display =
            "block";

        return;

    }


    const matches =
        countryDirectory
            .filter(
                country => {

                    const name =
                        getDirectoryName(
                            country
                        ).toLowerCase();

                    const region =
                        String(
                            country.region ||
                            ""
                        ).toLowerCase();

                    return (
                        name.includes(query) ||
                        region.includes(query)
                    );

                }
            )
            .slice(0, 10);


    if (!matches.length) {

        searchResults.innerHTML = `
            <div class="search-empty">

                <i class="fa-solid fa-earth-americas"></i>

                <span>
                    NO COUNTRY FOUND
                </span>

            </div>
        `;

        searchResults.style.display =
            "block";

        return;

    }


    searchResults.innerHTML =
        matches
            .map(
                country => {

                    const name =
                        getDirectoryName(
                            country
                        );

                    const flag =
                        getCountryFlag(
                            country
                        );

                    const region =
                        country.region ||
                        "WORLD";

                    const code =
                        country.alpha2Code ||
                        country.alpha3Code ||
                        "";


                    return `
                        <button
                            type="button"
                            class="search-result"
                            data-code="${escapeHtml(code)}"
                        >

                            <span
                                class="search-result-flag"
                            >
                                ${flag}
                            </span>


                            <span
                                class="search-result-info"
                            >

                                <strong>
                                    ${escapeHtml(name)}
                                </strong>

                                <small>
                                    ${escapeHtml(region)}
                                </small>

                            </span>


                            <span
                                class="search-result-code"
                            >
                                ${escapeHtml(code)}
                            </span>


                            <i
                                class="fa-solid fa-chevron-right"
                            ></i>

                        </button>
                    `;

                }
            )
            .join("");


    searchResults.style.display =
        "block";


    searchResults
        .querySelectorAll(
            ".search-result"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const code =
                            button.dataset.code;


                        const country =
                            countryDirectory.find(
                                item => {

                                    return (
                                        item.alpha2Code === code ||
                                        item.alpha3Code === code
                                    );

                                }
                            );


                        if (country) {

                            selectSearchCountry(
                                country
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   SEARCH COUNTRY SELECT
========================================================= */

async function selectSearchCountry(
    country
) {

    const name =
        getDirectoryName(
            country
        );


    countrySearch.value =
        name;


    searchResults.style.display =
        "none";


    const feature =
        findMapFeature(
            country
        );


    if (feature) {

        await handleCountryClick(
            feature,
            country
        );

        return;

    }


    /*
       If map matching fails,
       still show details.
    */

    selectedCountry =
        name;

    selectedFeature =
        null;

    stopRotation();

    openDetails();

    await loadCountryDetailsByCode(
        country.alpha2Code ||
        country.alpha3Code,
        name
    );

}


/* =========================================================
   HOVER
========================================================= */

function handleCountryHover(
    feature
) {

    hoveredFeature =
        feature || null;


    if (!feature) {

        countryHoverName.style.display =
            "none";

    }
    else {

        countryHoverName.textContent =
            getCountryName(
                feature
            );

        countryHoverName.style.display =
            "block";

    }


    if (globe) {

        globe
            .polygonCapColor(
                item => {

                    if (
                        item ===
                        selectedFeature
                    ) {

                        return COLORS.countrySelected;

                    }

                    if (
                        item ===
                        hoveredFeature
                    ) {

                        return COLORS.countryHover;

                    }

                    return COLORS.country;

                }
            )

            .polygonAltitude(
                item => {

                    if (
                        item ===
                        selectedFeature
                    ) {

                        return 0.022;

                    }

                    if (
                        item ===
                        hoveredFeature
                    ) {

                        return 0.013;

                    }

                    return 0.004;

                }
            );

    }

}


/* =========================================================
   COUNTRY CLICK
========================================================= */

async function handleCountryClick(
    feature,
    knownCountry = null
) {

    if (!feature) {
        return;
    }


    selectedFeature =
        feature;


    selectedCountry =
        getCountryName(
            feature
        );


    stopRotation();


    /*
       Highlight selected country
    */

    globe
        .polygonCapColor(
            item => {

                if (
                    item ===
                    selectedFeature
                ) {

                    return COLORS.countrySelected;

                }

                if (
                    item ===
                    hoveredFeature
                ) {

                    return COLORS.countryHover;

                }

                return COLORS.country;

            }
        )
        .polygonAltitude(
            item => {

                return (
                    item ===
                    selectedFeature
                )
                    ? 0.022
                    : 0.004;

            }
        );


    /*
       Country center
    */

    const center =
        knownCountry &&
        Array.isArray(
            knownCountry.latlng
        )
            ? {
                lat:
                    knownCountry.latlng[0],
                lng:
                    knownCountry.latlng[1]
            }
            : getCountryCenter(
                feature
            );


    /*
       Camera focus
    */

    globe.pointOfView(
        {
            lat: center.lat,
            lng: center.lng,
            altitude: 1.48
        },
        1100
    );


    /*
       Load full details
    */

    if (
        knownCountry &&
        (
            knownCountry.alpha2Code ||
            knownCountry.alpha3Code
        )
    ) {

        openDetails();

        renderBasicCountry(
            knownCountry,
            selectedCountry
        );


        await loadCountryDetailsByCode(
            knownCountry.alpha2Code ||
            knownCountry.alpha3Code,
            selectedCountry
        );

    }
    else {

        await loadCountryDetails(
            selectedCountry
        );

    }

}


/* =========================================================
   COUNTRY CENTER
========================================================= */

function getCountryCenter(
    feature
) {

    const coordinates = [];

    const geometry =
        feature.geometry;


    if (!geometry) {

        return {
            lat: 20,
            lng: 0
        };

    }


    if (
        geometry.type ===
        "Polygon"
    ) {

        geometry.coordinates
            .forEach(
                ring => {

                    ring.forEach(
                        point => {

                            coordinates.push(
                                point
                            );

                        }
                    );

                }
            );

    }


    if (
        geometry.type ===
        "MultiPolygon"
    ) {

        geometry.coordinates
            .forEach(
                polygon => {

                    polygon.forEach(
                        ring => {

                            ring.forEach(
                                point => {

                                    coordinates.push(
                                        point
                                    );

                                }
                            );

                        }
                    );

                }
            );

    }


    if (!coordinates.length) {

        return {
            lat: 20,
            lng: 0
        };

    }


    let lat = 0;

    let lng = 0;


    coordinates.forEach(
        point => {

            lng +=
                Number(point[0]) || 0;

            lat +=
                Number(point[1]) || 0;

        }
    );


    lng /=
        coordinates.length;

    lat /=
        coordinates.length;


    return {
        lat,
        lng
    };

}


/* =========================================================
   DETAILS
========================================================= */

async function loadCountryDetails(
    countryName
) {

    const requestId =
        ++detailsRequestId;


    openDetails();


    setDetailsLoading(
        countryName
    );


    try {

        /*
           Try directory match first
        */

        const directoryCountry =
            countryDirectory.find(
                country =>
                    normalizeCountryName(
                        getDirectoryName(
                            country
                        )
                    ) ===
                    normalizeCountryName(
                        countryName
                    )
            );


        if (
            directoryCountry &&
            (
                directoryCountry.alpha2Code ||
                directoryCountry.alpha3Code
            )
        ) {

            renderBasicCountry(
                directoryCountry,
                countryName
            );


            await loadCountryDetailsByCode(
                directoryCountry.alpha2Code ||
                directoryCountry.alpha3Code,
                countryName,
                requestId
            );


            return;

        }


        /*
           Fallback name endpoint
        */

        const response =
            await fetch(
                "https://countries.dev/name/" +
                encodeURIComponent(
                    countryName
                ) +
                "?full=true"
            );


        if (!response.ok) {

            throw new Error(
                "Country not found"
            );

        }


        const data =
            await response.json();


        if (
            requestId !==
            detailsRequestId
        ) {

            return;

        }


        const country =
            Array.isArray(data)
                ? data[0]
                : (
                    data.country ||
                    data.data ||
                    data
                );


        if (!country) {

            throw new Error(
                "Country data unavailable"
            );

        }


        renderCountryDetails(
            country
        );

    }
    catch (error) {

        console.warn(
            "Country details error:",
            error
        );


        showDetailsFallback(
            countryName
        );

    }

}


/* =========================================================
   DETAILS BY CODE
========================================================= */

async function loadCountryDetailsByCode(
    code,
    fallbackName = "Country",
    requestId = null
) {

    if (!code) {

        showDetailsFallback(
            fallbackName
        );

        return;

    }


    const normalizedCode =
        String(
            code
        ).toUpperCase();


    const local =
        countryCache.get(
            normalizedCode
        );


    try {

        const response =
            await fetch(
                "https://countries.dev/alpha/" +
                encodeURIComponent(
                    normalizedCode
                ) +
                "?full=true"
            );


        if (!response.ok) {

            throw new Error(
                "Full country data unavailable"
            );

        }


        const data =
            await response.json();


        if (
            requestId !== null &&
            requestId !==
            detailsRequestId
        ) {

            return;

        }


        const country =
            data.country ||
            data.data ||
            data;


        if (!country) {

            throw new Error(
                "Country data missing"
            );

        }


        countryCache.set(
            normalizedCode,
            country
        );


        renderCountryDetails(
            country
        );

    }
    catch (error) {

        console.warn(
            "Country code API error:",
            error
        );


        if (local) {

            renderCountryDetails(
                local
            );

        }
        else {

            showDetailsFallback(
                fallbackName
            );

        }

    }

}


/* =========================================================
   BASIC DETAILS
========================================================= */

function renderBasicCountry(
    country,
    fallbackName
) {

    const name =
        getDirectoryName(
            country
        ) ||
        fallbackName;


    detailCountry.textContent =
        name;


    detailOfficial.textContent =
        "4FU World Explorer";


    detailFlag.innerHTML =
        createFlagElement(
            country,
            name
        );


    detailCapital.textContent =
        "Loading...";

    detailRegion.textContent =
        country.region ||
        "Loading...";

    detailSubRegion.textContent =
        country.subregion ||
        "Loading...";

    detailPopulation.textContent =
        "Loading...";

    detailArea.textContent =
        "Loading...";

    detailCode.textContent =
        country.alpha2Code ||
        country.alpha3Code ||
        "—";

    detailCurrency.textContent =
        "Loading...";

    detailLanguages.textContent =
        "Loading...";

    detailNative.textContent =
        "Loading...";

    detailDemonym.textContent =
        "Loading...";

    detailCalling.textContent =
        "Loading...";

    detailTimezone.textContent =
        "Loading...";

    detailDensity.textContent =
        "Loading...";

    detailBorders.textContent =
        "Loading...";

}


/* =========================================================
   FULL DETAILS RENDER
========================================================= */

function renderCountryDetails(
    country
) {

    const name =
        country.name ||
        {};


    const common =
        typeof name === "string"
            ? name
            : (
                name.common ||
                selectedCountry ||
                "Country"
            );


    const official =
        typeof name === "object"
            ? (
                name.official ||
                "4FU World Explorer"
            )
            : "4FU World Explorer";


    const capital =
        Array.isArray(
            country.capital
        )
            ? country.capital.join(
                ", "
            )
            : (
                country.capital ||
                "No capital data"
            );


    const currencies =
        country.currencies
            ? Object.values(
                country.currencies
            )
                .map(
                    currency => {

                        if (
                            typeof currency ===
                            "string"
                        ) {

                            return currency;

                        }


                        return currency.name
                            ? (
                                currency.symbol
                                    ? `${currency.name} (${currency.symbol})`
                                    : currency.name
                            )
                            : "";

                    }
                )
                .filter(Boolean)
                .join(", ")
            : "—";


    const languages =
        country.languages
            ? (
                Array.isArray(
                    country.languages
                )
                    ? country.languages.join(
                        ", "
                    )
                    : Object.values(
                        country.languages
                    ).join(", ")
            )
            : "—";


    const nativeName =
        country.nativeName
            ? (
                typeof country.nativeName ===
                "string"
                    ? country.nativeName
                    : Object.values(
                        country.nativeName
                    )
                        .map(
                            value =>
                                typeof value ===
                                "string"
                                    ? value
                                    : (
                                        value.common ||
                                        value.official ||
                                        ""
                                    )
                        )
                        .filter(Boolean)
                        .join(", ")
            )
            : "—";


    const calling =
        country.callingCodes ||
        country.callingCode ||
        country.idd?.root
            ? (
                Array.isArray(
                    country.callingCodes
                )
                    ? country.callingCodes.join(
                        ", "
                    )
                    : (
                        country.callingCode ||
                        country.idd?.root ||
                        "—"
                    )
            )
            : "—";


    const timezone =
        Array.isArray(
            country.timezones
        )
            ? country.timezones
                .slice(0, 2)
                .join(", ")
            : (
                country.timezones ||
                "—"
            );


    const borders =
        Array.isArray(
            country.borders
        )
            ? (
                country.borders.length
                    ? country.borders.join(
                        ", "
                    )
                    : "None"
            )
            : (
                country.borders ||
                "None"
            );


    let density =
        country.populationDensity;


    if (
        !density &&
        country.population &&
        country.area
    ) {

        density =
            country.population /
            country.area;

    }


    detailCountry.textContent =
        common;


    detailOfficial.textContent =
        official;


    detailCapital.textContent =
        capital;


    detailRegion.textContent =
        country.region ||
        "—";


    detailSubRegion.textContent =
        country.subregion ||
        "—";


    detailPopulation.textContent =
        formatNumber(
            country.population
        );


    detailArea.textContent =
        country.area
            ? (
                formatNumber(
                    country.area
                ) +
                " km²"
            )
            : "—";


    detailCode.textContent =
        country.alpha2Code ||
        country.cca2 ||
        country.alpha3Code ||
        country.cca3 ||
        "—";


    detailCurrency.textContent =
        currencies;


    detailLanguages.textContent =
        languages;


    detailNative.textContent =
        nativeName;


    detailDemonym.textContent =
        country.demonym ||
        "—";


    detailCalling.textContent =
        calling;


    detailTimezone.textContent =
        timezone;


    detailDensity.textContent =
        density
            ? (
                Number(
                    density
                ).toLocaleString(
                    "en-US",
                    {
                        maximumFractionDigits: 2
                    }
                ) +
                " / km²"
            )
            : "—";


    detailBorders.textContent =
        borders;


    detailFlag.innerHTML =
        createFlagElement(
            country,
            common
        );

}


/* =========================================================
   FLAG ELEMENT
========================================================= */

function createFlagElement(
    country,
    name
) {

    const flags =
        country.flags ||
        {};


    const flagUrl =
        flags.svg ||
        flags.png;


    if (flagUrl) {

        return `
            <img
                src="${escapeHtml(flagUrl)}"
                alt="${escapeHtml(name)} flag"
                loading="lazy"
            >
        `;

    }


    return getCountryFlag(
        country
    );

}


/* =========================================================
   LOADING DETAILS
========================================================= */

function setDetailsLoading(
    name
) {

    detailCountry.textContent =
        name;


    detailOfficial.textContent =
        "Loading country intelligence...";


    detailFlag.innerHTML =
        "🌍";


    const fields = [

        detailCapital,
        detailRegion,
        detailSubRegion,
        detailPopulation,
        detailArea,
        detailCode,
        detailCurrency,
        detailLanguages,
        detailNative,
        detailDemonym,
        detailCalling,
        detailTimezone,
        detailDensity,
        detailBorders

    ];


    fields.forEach(
        field => {

            if (field) {

                field.textContent =
                    "Loading...";

            }

        }
    );

}


/* =========================================================
   FALLBACK
========================================================= */

function showDetailsFallback(
    name
) {

    detailCountry.textContent =
        name;


    detailOfficial.textContent =
        "4FU World Explorer";


    detailCapital.textContent =
        "Not available";

    detailRegion.textContent =
        "World";

    detailSubRegion.textContent =
        "Unknown";

    detailPopulation.textContent =
        "—";

    detailArea.textContent =
        "—";

    detailCode.textContent =
        "—";

    detailCurrency.textContent =
        "—";

    detailLanguages.textContent =
        "—";

    detailNative.textContent =
        "—";

    detailDemonym.textContent =
        "—";

    detailCalling.textContent =
        "—";

    detailTimezone.textContent =
        "—";

    detailDensity.textContent =
        "—";

    detailBorders.textContent =
        "—";

    detailFlag.innerHTML =
        "🌍";

}


/* =========================================================
   OPEN DETAILS
========================================================= */

function openDetails() {

    countryDetail.classList.add(
        "active"
    );

}


/* =========================================================
   CLOSE DETAILS
========================================================= */

function closeDetails() {

    countryDetail.classList.remove(
        "active"
    );


    selectedFeature =
        null;


    selectedCountry =
        null;


    hoveredFeature =
        null;


    globe
        .polygonCapColor(
            () =>
                COLORS.country
        )
        .polygonAltitude(
            () =>
                0.004
        );


    resumeAutoRotation();

}


/* =========================================================
   STOP ROTATION
========================================================= */

function stopRotation() {

    clearTimeout(
        interactionTimer
    );


    if (globe) {

        globe.controls().autoRotate =
            false;

    }

}


/* =========================================================
   FOCUS SELECTED
========================================================= */

function focusSelectedCountry() {

    if (
        !selectedFeature
    ) {

        return;

    }


    stopRotation();


    const center =
        getCountryCenter(
            selectedFeature
        );


    globe.pointOfView(
        {
            lat: center.lat,
            lng: center.lng,
            altitude: 1.48
        },
        800
    );

}


/* =========================================================
   RESET WORLD
========================================================= */

function resetWorld() {

    countrySearch.value =
        "";


    searchResults.style.display =
        "none";


    closeDetails();


    hoveredFeature =
        null;


    selectedFeature =
        null;


    selectedCountry =
        null;


    globe
        .polygonCapColor(
            () =>
                COLORS.country
        )
        .polygonAltitude(
            () =>
                0.004
        );


    globe.pointOfView(
        {
            lat: 20,
            lng: 15,
            altitude: 2.05
        },
        1000
    );


    globe.controls().autoRotate =
        true;

}


/* =========================================================
   NETWORK STATS
========================================================= */

function updateNetworkStats() {

    if (
        countryDirectory.length
    ) {

        countryCount.textContent =
            countryDirectory.length;

    }
    else if (
        countries.length
    ) {

        countryCount.textContent =
            countries.length;

    }


    /*
       Seven major geographic regions
    */

    regionCount.textContent =
        "07";

}


/* =========================================================
   HUD
========================================================= */

function updateHUD() {

    if (!globe) {
        return;
    }


    const pov =
        globe.pointOfView();


    if (!pov) {
        return;
    }


    hudLat.textContent =
        Number(
            pov.lat || 0
        ).toFixed(1) +
        "°";


    hudLng.textContent =
        Number(
            pov.lng || 0
        ).toFixed(1) +
        "°";


    hudZoom.textContent =
        Number(
            pov.altitude || 0
        ).toFixed(2);

}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    /* HOME */

    document
        .getElementById(
            "homeBtn"
        )
        .addEventListener(
            "click",
            () => {

                window.location.href =
                    "index.html";

            }
        );


    /* RESET */

    document
        .getElementById(
            "resetWorld"
        )
        .addEventListener(
            "click",
            resetWorld
        );


    /* CLOSE */

    document
        .getElementById(
            "detailClose"
        )
        .addEventListener(
            "click",
            closeDetails
        );


    document
        .getElementById(
            "closeDetail"
        )
        .addEventListener(
            "click",
            closeDetails
        );


    /* FOCUS */

    document
        .getElementById(
            "focusAgain"
        )
        .addEventListener(
            "click",
            focusSelectedCountry
        );


    /* EXPLORE PANEL */

    document
        .getElementById(
            "exploreTab"
        )
        .addEventListener(
            "click",
            () => {

                const open =
                    explorePanel.classList.toggle(
                        "open"
                    );


                if (open) {

                    networkPanel.classList.remove(
                        "open"
                    );

                }

            }
        );


    /* NETWORK PANEL */

    document
        .getElementById(
            "networkTab"
        )
        .addEventListener(
            "click",
            () => {

                const open =
                    networkPanel.classList.toggle(
                        "open"
                    );


                if (open) {

                    explorePanel.classList.remove(
                        "open"
                    );

                }

            }
        );


    /* ESC */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                searchResults.style.display =
                    "none";


                if (
                    countryDetail.classList.contains(
                        "active"
                    )
                ) {

                    closeDetails();

                }

            }

        }
    );

}


/* =========================================================
   HIDE LOADING
========================================================= */

function hideLoading() {

    if (!loadingScreen) {
        return;
    }


    setTimeout(
        () => {

            loadingScreen.classList.add(
                "hidden"
            );

        },
        250
    );

}


/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatNumber(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "—";

    }


    const number =
        Number(value);


    if (
        !Number.isFinite(
            number
        )
    ) {

        return "—";

    }


    return number.toLocaleString(
        "en-US"
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}