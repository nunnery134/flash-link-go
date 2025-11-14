interface Tab {
  id: string;
  url: string;
  title?: string;
}

let tabs: Tab[] = [
  { id: "tab1", url: "https://www.example.com" },
  { id: "tab2", url: "https://www.example.com" },
];

let activeTabId = "tab1";

// Get the currently active tab
function getActiveTab(): Tab | undefined {
  return tabs.find(tab => tab.id === activeTabId);
}

// Update a tab’s properties
function updateTab(tab: Tab, updates: Partial<Tab>) {
  Object.assign(tab, updates);
  renderTab(tab); // Update UI if necessary
}

// Load a URL in a tab’s iframe (or browser view)
function loadUrlForTab(tab: Tab, url: string) {
  const iframe = document.getElementById(tab.id) as HTMLIFrameElement;
  if (iframe) iframe.src = url;
}

// Render tabs dynamically (basic example)
function renderTabs() {
  const tabsContainer = document.getElementById("tabsContainer");
  if (!tabsContainer) return;

  tabsContainer.innerHTML = ""; // Clear existing tabs

  tabs.forEach(tab => {
    const tabElement = document.createElement("div");
    tabElement.className = `tab ${tab.id === activeTabId ? "active" : ""}`;
    tabElement.innerHTML = `
      <input type="text" id="search-${tab.id}" placeholder="Search Google..."/>
      <button id="searchBtn-${tab.id}">Search</button>
      <iframe id="${tab.id}" src="${tab.url}" style="width:100%; height:300px;"></iframe>
    `;
    tabsContainer.appendChild(tabElement);

    const input = document.getElementById(`search-${tab.id}`) as HTMLInputElement;
    const button = document.getElementById(`searchBtn-${tab.id}`);

    // Search function for this specific tab
    const handleSearch = () => {
      const query = input.value.trim();
      if (!query) return;
      const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      updateTab(tab, { url: googleUrl });
      loadUrlForTab(tab, googleUrl);
    };

    button?.addEventListener("click", handleSearch);
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleSearch();
    });
  });
}

// Change active tab
function setActiveTab(tabId: string) {
  activeTabId = tabId;
  renderTabs();
}

// Initial render
document.addEventListener("DOMContentLoaded", () => {
  renderTabs();
});
