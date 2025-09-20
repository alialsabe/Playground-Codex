document.addEventListener("DOMContentLoaded", () => {
  const data = window.dashboardData || {};
  const tabButtons = Array.from(document.querySelectorAll(".tab-button"));
  const panels = Array.from(document.querySelectorAll(".tab-panel"));

  function activateTab(targetId) {
    tabButtons.forEach((button) => {
      const isActive = button.dataset.target === targetId;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });

    panels.forEach((panel) => {
      const isActive = panel.id === targetId;
      panel.classList.toggle("active", isActive);
      panel.setAttribute("aria-hidden", String(!isActive));
    });
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.target));
  });

  initializeMap(data);
  initializeCharts(data);
});

function initializeMap(data) {
  const token = data.mapboxToken || "";
  const warning = document.getElementById("mapbox-token-warning");

  if (!token) {
    if (warning) {
      warning.classList.remove("hidden");
    }
    return;
  }

  if (!window.mapboxgl) {
    console.error("Mapbox GL JS did not load correctly.");
    return;
  }

  mapboxgl.accessToken = token;

  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/light-v11",
    center: [-20, 20],
    zoom: 1.6,
  });

  map.addControl(new mapboxgl.NavigationControl(), "top-right");
  map.addControl(new mapboxgl.FullscreenControl());

  map.on("load", () => {
    map.addSource("cities", {
      type: "geojson",
      data: data.geojson,
      cluster: true,
      clusterMaxZoom: 9,
      clusterRadius: 50,
    });

    map.addLayer({
      id: "clusters",
      type: "circle",
      source: "cities",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#93c5fd",
          5,
          "#60a5fa",
          15,
          "#2563eb",
        ],
        "circle-radius": [
          "step",
          ["get", "point_count"],
          18,
          5,
          22,
          15,
          28,
        ],
      },
    });

    map.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "cities",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count"],
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 12,
      },
      paint: {
        "text-color": "#0f172a",
      },
    });

    map.addLayer({
      id: "unclustered-point",
      type: "circle",
      source: "cities",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": "#2563eb",
        "circle-radius": 8,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });

    map.on("click", "clusters", (event) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: ["clusters"],
      });
      const clusterId = features[0].properties.cluster_id;
      map.getSource("cities").getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) {
          return;
        }
        map.easeTo({ center: features[0].geometry.coordinates, zoom });
      });
    });

    map.on("mouseenter", "clusters", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "clusters", () => {
      map.getCanvas().style.cursor = "";
    });

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
    });

    map.on("mouseenter", "unclustered-point", (event) => {
      map.getCanvas().style.cursor = "pointer";
      const feature = event.features[0];
      const { city, followers } = feature.properties;
      const coordinates = feature.geometry.coordinates.slice();
      const formatted = Number(followers).toLocaleString();
      popup
        .setLngLat(coordinates)
        .setHTML(
          `<div class="popup"><h3>${city}</h3><p><strong>${formatted}</strong> followers</p></div>`
        )
        .addTo(map);
    });

    map.on("mouseleave", "unclustered-point", () => {
      map.getCanvas().style.cursor = "";
      popup.remove();
    });
  });
}

function initializeCharts(data) {
  if (typeof Chart === "undefined") {
    console.error("Chart.js is not available");
    return;
  }

  const cityTable = data.cityTable || [];
  const labels = cityTable.map((entry) => entry.city);
  const followers = cityTable.map((entry) => entry.followers);

  const barCtx = document.getElementById("followers-bar-chart");
  const pieCtx = document.getElementById("followers-pie-chart");

  if (!barCtx || !pieCtx) {
    return;
  }

  const palette = [
    "#2563eb",
    "#60a5fa",
    "#1d4ed8",
    "#3b82f6",
    "#38bdf8",
    "#818cf8",
    "#1e40af",
    "#0ea5e9",
    "#1d4ed8",
    "#38bdf8",
  ];

  new Chart(barCtx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Followers",
          data: followers,
          backgroundColor: palette,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.dataset.label}: ${Number(context.parsed.y).toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "#1f2937" },
          grid: { display: false },
        },
        y: {
          ticks: {
            color: "#4b5563",
            callback: (value) => Number(value).toLocaleString(),
          },
          grid: { color: "rgba(148, 163, 184, 0.3)" },
        },
      },
    },
  });

  new Chart(pieCtx, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          label: "Followers",
          data: followers,
          backgroundColor: palette,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#1f2937",
            boxWidth: 16,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.label}: ${Number(context.parsed).toLocaleString()} followers`,
          },
        },
      },
    },
  });
}
