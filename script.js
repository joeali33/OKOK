// Global variables
let allProducts = [];

// DOM elements
const mainApp = document.getElementById("mainApp");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const suggestions = document.getElementById("suggestions");
const searchResults = document.getElementById("searchResults");
const resultsTitle = document.getElementById("resultsTitle");
const resultsContainer = document.getElementById("resultsContainer");
const noResults = document.getElementById("noResults");
const welcomeMessage = document.getElementById("welcomeMessage");

// Initialize the application
document.addEventListener("DOMContentLoaded", function() {
    prepareProductData();
    setupEventListeners();
});

function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener("input", handleSearchInput);
    searchInput.addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            handleSearch();
        }
    });
    searchBtn.addEventListener("click", handleSearch);
    
    // Hide suggestions when clicking outside
    document.addEventListener("click", function(e) {
        if (!e.target.closest(".search-container")) {
            hideSuggestions();
        }
    });
}

function prepareProductData() {
    allProducts = [];
    
    // Add B2B products
    pricingData.b2b.forEach(product => {
        allProducts.push({
            ...product,
            supplier: "B2B",
            adultPrice: product.b2b_adult_price,
            childPrice: product.b2b_child_price,
            tripPrice: product.b2b_trip_price
        });
    });
    
    // Add RATHIN products
    pricingData.rathin.forEach(product => {
        allProducts.push({
            ...product,
            supplier: "RATHIN",
            adultPrice: product.rathin_price1,
            childPrice: product.rathin_price2,
            tripPrice: null
        });
    });
}

// Search functions
function handleSearchInput() {
    const query = searchInput.value.trim();
    
    if (query.length > 0) {
        const results = fuzzySearch(query, allProducts, 0.3);
        showSuggestions(results.slice(0, 5));
    } else {
        hideSuggestions();
        clearResults();
        showWelcomeMessage();
    }
}

function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;
    
    hideSuggestions();
    const results = fuzzySearch(query, allProducts, 0.3);
    displaySearchResults(results, query);
}

function showSuggestions(results) {
    if (results.length === 0) {
        hideSuggestions();
        return;
    }
    
    suggestions.innerHTML = "";
    results.forEach(result => {
        const suggestionItem = document.createElement("div");
        suggestionItem.className = "suggestion-item";
        suggestionItem.innerHTML = `
            <div class="suggestion-name">${result.name}</div>
            <div class="suggestion-details">${result.supplier} - AED ${result.adultPrice}</div>
        `;
        
        suggestionItem.addEventListener("click", () => {
            searchInput.value = result.name;
            handleSearch();
        });
        
        suggestions.appendChild(suggestionItem);
    });
    
    suggestions.style.display = "block";
}

function hideSuggestions() {
    suggestions.style.display = "none";
}

function displaySearchResults(results, query) {
    hideWelcomeMessage();
    hideNoResults();
    
    if (results.length === 0) {
        showNoResults();
        return;
    }
    
    // Group results by product name
    const groupedResults = {};
    results.forEach(product => {
        const key = product.name.toLowerCase();
        if (!groupedResults[key]) {
            groupedResults[key] = {
                name: product.name,
                suppliers: {}
            };
        }
        groupedResults[key].suppliers[product.supplier] = product;
    });
    
    const finalResults = Object.values(groupedResults);
    
    resultsTitle.textContent = `Results (${finalResults.length})`;
    resultsContainer.innerHTML = "";
    
    finalResults.forEach(result => {
        const resultElement = createResultElement(result);
        resultsContainer.appendChild(resultElement);
    });
    
    searchResults.style.display = "block";
}

function createResultElement(result) {
    const bestPrice = getBestPrice(result.suppliers);
    
    const resultDiv = document.createElement("div");
    resultDiv.className = "result-item";
    
    let suppliersHTML = "";
    
    // B2B Supplier
    if (result.suppliers.B2B) {
        const isBest = bestPrice.supplier === "B2B";
        suppliersHTML += `
            <div class="supplier-card ${isBest ? "best-price" : ""}">
                <div class="supplier-header">
                    <div class="supplier-name">B2B</div>
                    ${isBest ? "<div class=\"best-price-badge\"><i class=\"fas fa-trending-down\"></i> Best Price</div>" : ""}
                </div>
                <div class="price-list">
                    <div class="price-item">
                        <span class="price-label">Adult:</span>
                        <span class="price-value">AED ${result.suppliers.B2B.adultPrice}</span>
                    </div>
                    ${result.suppliers.B2B.childPrice > 0 ? `
                        <div class="price-item">
                            <span class="price-label">Child:</span>
                            <span class="price-value">AED ${result.suppliers.B2B.childPrice}</span>
                        </div>
                    ` : ""}
                    ${result.suppliers.B2B.tripPrice > 0 ? `
                        <div class="price-item">
                            <span class="price-label">Trip:</span>
                            <span class="price-value">AED ${result.suppliers.B2B.tripPrice}</span>
                        </div>
                    ` : ""}
                </div>
            </div>
        `;
    }
    
    // RATHIN Supplier
    if (result.suppliers.RATHIN) {
        const isBest = bestPrice.supplier === "RATHIN";
        suppliersHTML += `
            <div class="supplier-card ${isBest ? "best-price" : ""}">
                <div class="supplier-header">
                    <div class="supplier-name">RATHIN</div>
                    ${isBest ? "<div class=\"best-price-badge\"><i class=\"fas fa-trending-down\"></i> Best Price</div>" : ""}
                </div>
                <div class="price-list">
                    <div class="price-item">
                        <span class="price-label">Price:</span>
                        <span class="price-value">AED ${result.suppliers.RATHIN.adultPrice}</span>
                    </div>
                    ${result.suppliers.RATHIN.childPrice ? `
                        <div class="price-item">
                            <span class="price-label">Child:</span>
                            <span class="price-value">AED ${result.suppliers.RATHIN.childPrice}</span>
                        </div>
                    ` : ""}
                </div>
            </div>
        `;
    }
    
    resultDiv.innerHTML = `
        <div class="result-name">${result.name}</div>
        <div class="suppliers-grid">
            ${suppliersHTML}
        </div>
    `;
    
    return resultDiv;
}

function getBestPrice(suppliers) {
    const prices = [];
    
    if (suppliers.B2B) {
        prices.push({ supplier: "B2B", price: suppliers.B2B.adultPrice, type: "Adult" });
        if (suppliers.B2B.childPrice > 0) {
            prices.push({ supplier: "B2B", price: suppliers.B2B.childPrice, type: "Child" });
        }
    }
    
    if (suppliers.RATHIN) {
        prices.push({ supplier: "RATHIN", price: suppliers.RATHIN.adultPrice, type: "Adult" });
        if (suppliers.RATHIN.childPrice) {
            prices.push({ supplier: "RATHIN", price: suppliers.RATHIN.childPrice, type: "Child" });
        }
    }
    
    return prices.reduce((best, current) => 
        current.price < best.price ? current : best
    );
}

function clearResults() {
    searchResults.style.display = "none";
    resultsContainer.innerHTML = "";
}

function showNoResults() {
    noResults.style.display = "block";
}

function hideNoResults() {
    noResults.style.display = "none";
}

function showWelcomeMessage() {
    welcomeMessage.style.display = "block";
}

function hideWelcomeMessage() {
    welcomeMessage.style.display = "none";
}

// Fuzzy search implementation
function levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

function fuzzySearch(query, items, threshold = 0.6) {
    if (!query) return [];
    
    const results = items.map(item => {
        const distance = levenshteinDistance(query.toLowerCase(), item.name.toLowerCase());
        const maxLength = Math.max(query.length, item.name.length);
        const similarity = 1 - (distance / maxLength);
        
        return {
            ...item,
            similarity
        };
    }).filter(item => item.similarity >= threshold);
    
    return results.sort((a, b) => b.similarity - a.similarity);
}

