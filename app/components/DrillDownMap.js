// "use client";

// import { useEffect, useState, useRef } from "react";
// import "leaflet/dist/leaflet.css";

// export default function DrillDownMap() {
//   const [level, setLevel] = useState("province");
//   const [mapInstance, setMapInstance] = useState(null);
//   const [apiData, setApiData] = useState(null);
//   const [currentCountry, setCurrentCountry] = useState(null);
//   const [currentProvince, setCurrentProvince] = useState(null);
//   const [currentDistrict, setCurrentDistrict] = useState(null);
//   const LRef = useRef(null);

//   // Function to create HTML content for the tooltip
//   const createTooltipContent = (name, count) => `
//     <div style="text-align: center; font-family: 'Sarabun', Arial, sans-serif; padding: 3px 8px;">
//       <strong style="font-size: 1.1em; color: #2c3e50; font-style: normal;">${name}</strong><br>
//       <span style="font-size: 0.95em; color: #34495e; font-style: normal;">จำนวน: ${
//         count !== undefined ? count.toLocaleString() : "N/A"
//       }</span>
//     </div>
//   `;

//   // Fetch API data on component mount
//   useEffect(() => {
//     fetch("/api/alumni/count-alumni-location")
//       .then((res) => {
//         if (!res.ok) {
//           throw new Error(`API call failed: ${res.statusText}`);
//         }
//         return res.json();
//       })
//       .then((data) => {
//         setApiData(data);
//       })
//       .catch((error) => {
//         console.error("Error fetching data:", error);
//       });
//   }, []);

//   // Initialize and manage the Leaflet map
//   useEffect(() => {
//     if (!apiData) return;

//     // Dynamically import Leaflet to ensure it runs client-side with "use client"
//     import("leaflet").then((LModule) => {
//       LRef.current = LModule;
//       const L = LRef.current;

//       // Check if a map instance already exists on the DOM element
//       const mapContainer = L.DomUtil.get("map");
//       if (mapContainer && mapContainer._leaflet_id) {
//         const oldMap = mapInstance;
//         if (oldMap) {
//           oldMap.remove(); // Remove old map instance to prevent duplicates
//         }
//       }

//       // Create a new map instance if one doesn't exist
//       if (mapContainer && !mapContainer._leaflet_id) {
//         const _map = L.map("map", {
//           zoomControl: false, // Disable default zoom controls
//         }).setView(apiData.center || [13.736717, 100.523186], 6); // Set initial view

//         L.control.zoom({ position: "bottomright" }).addTo(_map); // Add zoom controls to bottom-right

//         setMapInstance(_map); // Store map instance in state

//         // Add OpenStreetMap tile layer
//         L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//           attribution:
//             '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
//         }).addTo(_map);

//         // Add a "Reset Map" control button
//         const resetControl = L.control({ position: "topright" });
//         resetControl.onAdd = function () {
//           const div = L.DomUtil.create(
//             "div",
//             "leaflet-bar leaflet-control leaflet-control-custom"
//           );
//           Object.assign(div.style, {
//             backgroundColor: "white",
//             padding: "8px 12px",
//             cursor: "pointer",
//             fontSize: "14px",
//             fontFamily: "'Sarabun', Arial, sans-serif",
//             fontWeight: "600",
//             color: "#2c3e50",
//             border: "1px solid #bdc3c7",
//             borderRadius: "4px",
//             boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
//           });
//           div.title = "รีเซ็ตการแสดงผลแผนที่";
//           div.innerHTML = "Reset";
//           div.onmouseover = function () {
//             this.style.backgroundColor = "#f9f9f9";
//           };
//           div.onmouseout = function () {
//             this.style.backgroundColor = "white";
//           };
//           div.onclick = (e) => {
//             L.DomEvent.stopPropagation(e);
//             if (apiData) {
//               loadProvinces(_map, apiData); // Reset to province level
//             }
//           };
//           return div;
//         };
//         resetControl.addTo(_map);

//         loadProvinces(_map, apiData); // Load initial province data
//       } else if (mapInstance && apiData) {
//         loadProvinces(mapInstance, apiData); // Reload province data if map already exists
//       }
//     });

//     return () => {
//       // No specific cleanup needed for this example, but typically map.remove() might be here
//     };
//   }, [apiData]);

//   // Function to clear all markers from the map
//   function clearMarkers(map) {
//     if (!map || !LRef.current) return;
//     map.eachLayer((layer) => {
//       if (layer instanceof LRef.current.Marker) {
//         map.removeLayer(layer);
//       }
//     });
//   }

//   // Function to create an L.DivIcon displaying the name and count (adjusted size and font-style)
//   const createCountDivIcon = (name, count) => {
//     const L = LRef.current;
//     const countText = count !== undefined ? count.toLocaleString() : "N/A";

//     const markerSize = 20; // ลดขนาด Marker ลงเป็น 20px
//     const nameFontSize = "0.4em"; // ปรับขนาดตัวอักษรสำหรับชื่อให้เล็กลงมาก
//     const countFontSize = "0.7em"; // ปรับขนาดตัวอักษรสำหรับจำนวนให้เล็กลงมาก

//     const htmlContent = `
//       <div style="
//         display: flex;
//         flex-direction: column;
//         align-items: center;
//         justify-content: center;
//         width: ${markerSize}px;
//         height: ${markerSize}px;
//         background-color: #007bff;
//         border-radius: 50%;
//         border: 2px solid white;
//         box-shadow: 0 2px 4px rgba(0,0,0,0.3);
//         font-family: 'Sarabun', Arial, sans-serif;
//         color: white;
//         transform: translate(-50%, -50%);
//         cursor: pointer;
//         font-style: normal;
//         line-height: 1.0; /* ปรับ line-height ให้ชิดขึ้นอีก */
//         overflow: hidden;
//         text-overflow: ellipsis;
//       ">
//         <span style="font-size: ${nameFontSize}; font-weight: normal; text-align: center; white-space: nowrap; max-width: 90%;">${name}</span>
//         <span style="font-size: ${countFontSize}; font-weight: bold; text-align: center;">${countText}</span>
//       </div>
//     `;

//     return L.divIcon({
//       className: 'count-div-icon',
//       html: htmlContent,
//       iconSize: [markerSize, markerSize],
//       iconAnchor: [markerSize / 2, markerSize / 2],
//     });
//   };

//   // Load and display province data
//   function loadProvinces(map, countryData) {
//     if (!map || !LRef.current) return;
//     const L = LRef.current;
//     setLevel("province");
//     clearMarkers(map);
//     setCurrentCountry(countryData);
//     setCurrentProvince(null);
//     setCurrentDistrict(null);

//     const provinces = countryData.children;

//     provinces.forEach((province) => {
//       if (province.center) {
//         L.marker(province.center, {
//           icon: createCountDivIcon(province.name, province.count),
//         })
//           .addTo(map)
//           .bindTooltip(
//             createTooltipContent(province.name, province.count),
//             {
//               direction: "top",
//               permanent: false,
//               sticky: true,
//               offset: L.point(0, -10),
//               className: "custom-tooltip",
//             }
//           )
//           .on("click", () => {
//             setCurrentProvince(province);
//             loadDistricts(map, province); // Drill down to districts
//           });
//       }
//     });

//     // Adjust map view to fit provinces
//     if (provinces.length > 0) {
//       const firstProvinceWithCenter = provinces.find((p) => p.center);
//       if (firstProvinceWithCenter) {
//         map.setView(firstProvinceWithCenter.center, 7);
//       } else if (countryData.center) {
//         map.setView(countryData.center, 6);
//       }
//     } else if (countryData.center) {
//       map.setView(countryData.center, 6);
//     }
//   }

//   // Load and display district data
//   function loadDistricts(map, provinceData) {
//     if (!map || !LRef.current) return;
//     const L = LRef.current;
//     setLevel("district");
//     clearMarkers(map);
//     setCurrentProvince(provinceData);
//     setCurrentDistrict(null);

//     const districts = provinceData.children;

//     districts.forEach((district) => {
//       if (district.center) {
//         L.marker(district.center, {
//           icon: createCountDivIcon(district.name, district.count),
//         })
//           .addTo(map)
//           .bindTooltip(
//             createTooltipContent(district.name, district.count),
//             {
//               direction: "top",
//               permanent: false,
//               sticky: true,
//               offset: L.point(0, -10),
//               className: "custom-tooltip",
//             }
//           )
//           .on("click", () => {
//             setCurrentDistrict(district);
//             loadSubdistricts(map, district); // Drill down to subdistricts (tambons)
//           });
//       }
//     });

//     // Adjust map view to fit districts
//     if (districts.length > 0) {
//       const firstDistrictWithCenter = districts.find((d) => d.center);
//       if (firstDistrictWithCenter) {
//         map.setView(firstDistrictWithCenter.center, 9);
//       } else if (provinceData.center) {
//         map.setView(provinceData.center, 8);
//       }
//     } else if (provinceData.center) {
//       map.setView(provinceData.center, 8);
//     }
//   }

//   // Load and display subdistrict (tambon) data
//   function loadSubdistricts(map, districtData) {
//     if (!map || !LRef.current) return;
//     const L = LRef.current;
//     setLevel("subdistrict");
//     clearMarkers(map);
//     setCurrentDistrict(districtData);

//     const tambons = districtData.children;

//     tambons.forEach((tambon) => {
//       if (
//         typeof tambon.latitude === "number" &&
//         typeof tambon.longitude === "number"
//       ) {
//         L.marker([tambon.latitude, tambon.longitude], {
//           icon: createCountDivIcon(tambon.name, tambon.count),
//         })
//           .addTo(map)
//           .bindTooltip(
//             createTooltipContent(tambon.name, tambon.count),
//             {
//               direction: "top",
//               permanent: false,
//               sticky: true,
//               offset: L.point(0, -10),
//               className: "custom-tooltip",
//             }
//           );
//       }
//     });

//     // Adjust map view to fit subdistricts
//     if (tambons.length > 0) {
//       const firstTambonWithCoords = tambons.find(
//         (t) => typeof t.latitude === "number" && typeof t.longitude === "number"
//       );
//       if (firstTambonWithCoords) {
//         map.setView(
//           [firstTambonWithCoords.latitude, firstTambonWithCoords.longitude],
//           12
//         );
//       } else if (districtData.center) {
//         map.setView(districtData.center, 11);
//       }
//     } else if (districtData.center) {
//       map.setView(districtData.center, 11);
//     }
//   }

//   // Inline style for the "Back" button
//   const backButtonStyle = {
//     position: "absolute",
//     top: "10px",
//     left: "10px",
//     zIndex: 1000,
//     padding: "8px 12px",
//     backgroundColor: "white",
//     fontFamily: "'Sarabun', Arial, sans-serif",
//     fontSize: "14px",
//     fontWeight: "600",
//     color: "#2c3e50",
//     border: "1px solid #bdc3c7",
//     borderRadius: "4px",
//     cursor: "pointer",
//     boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
//     display: "flex",
//     alignItems: "center",
//   };

//   // Render the navigation (back button)
//   const renderNavigation = () => {
//     // Only show the back button if not at the province level
//     if (!mapInstance || !LRef.current || level === "province") return null;

//     const goBack = (e) => {
//       LRef.current.DomEvent.stopPropagation(e); // Prevent map click event
//       if (level === "subdistrict" && currentProvince) {
//         loadDistricts(mapInstance, currentProvince); // Go back to districts
//       } else if (level === "district" && apiData) {
//         loadProvinces(mapInstance, apiData); // Go back to provinces
//       }
//     };

//     let currentBackButtonStyle = { ...backButtonStyle };

//     return (
//       <button
//         onClick={goBack}
//         style={currentBackButtonStyle}
//         onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f9f9f9")}
//         onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "white")}
//         title="ย้อนกลับไปยังระดับก่อนหน้า"
//       >
//         ⬅ Back
//       </button>
//     );
//   };

//   return (
//     <div
//       style={{
//         position: "relative",
//         width: "100%",
//         height: "600px",
//         fontFamily: "'Sarabun', Arial, sans-serif",
//       }}
//     >
//       {renderNavigation()}
//       <div id="map" style={{ height: "100%", width: "100%" }} />
//     </div>
//   );
// }


"use client";

import { useEffect, useState, useRef } from "react";
import "leaflet/dist/leaflet.css";

export default function DrillDownMap() {
  const [level, setLevel] = useState("province");
  const [mapInstance, setMapInstance] = useState(null);
  const [apiData, setApiData] = useState(null);
  const [currentCountry, setCurrentCountry] = useState(null);
  const [currentProvince, setCurrentProvince] = useState(null);
  const [currentDistrict, setCurrentDistrict] = useState(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null); // เพิ่ม state เพื่อเก็บ ID ของมาร์กเกอร์ที่ถูกเลือก
  const LRef = useRef(null);

  // Function to create HTML content for the tooltip
  const createTooltipContent = (name, count) => `
    <div style="text-align: center; font-family: 'Sarabun', Arial, sans-serif; padding: 3px 8px;">
      <strong style="font-size: 1.1em; color: #2c3e50; font-style: normal;">${name}</strong><br>
      <span style="font-size: 0.95em; color: #34495e; font-style: normal;">จำนวน: ${
        count !== undefined ? count.toLocaleString() : "N/A"
      }</span>
    </div>
  `;

  // Fetch API data on component mount
  useEffect(() => {
    fetch("/api/alumni/count-alumni-location")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API call failed: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        setApiData(data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);

  // Initialize and manage the Leaflet map
  useEffect(() => {
    if (!apiData) return;

    // Dynamically import Leaflet to ensure it runs client-side with "use client"
    import("leaflet").then((LModule) => {
      LRef.current = LModule;
      const L = LRef.current;

      // Check if a map instance already exists on the DOM element
      const mapContainer = L.DomUtil.get("map");
      if (mapContainer && mapContainer._leaflet_id) {
        const oldMap = mapInstance;
        if (oldMap) {
          oldMap.remove(); // Remove old map instance to prevent duplicates
        }
      }

      // Create a new map instance if one doesn't exist
      if (mapContainer && !mapContainer._leaflet_id) {
        const _map = L.map("map", {
          zoomControl: false, // Disable default zoom controls
        }).setView(apiData.center || [13.736717, 100.523186], 6); // Set initial view

        L.control.zoom({ position: "bottomright" }).addTo(_map); // Add zoom controls to bottom-right

        setMapInstance(_map); // Store map instance in state

        // Add OpenStreetMap tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        }).addTo(_map);

        // Add a "Reset Map" control button
        const resetControl = L.control({ position: "topright" });
        resetControl.onAdd = function () {
          const div = L.DomUtil.create(
            "div",
            "leaflet-bar leaflet-control leaflet-control-custom"
          );
          Object.assign(div.style, {
            backgroundColor: "white",
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: "14px",
            fontFamily: "'Sarabun', Arial, sans-serif",
            fontWeight: "600",
            color: "#2c3e50",
            border: "1px solid #bdc3c7",
            borderRadius: "4px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
          });
          div.title = "รีเซ็ตการแสดงผลแผนที่";
          div.innerHTML = "Reset";
          div.onmouseover = function () {
            this.style.backgroundColor = "#f9f9f9";
          };
          div.onmouseout = function () {
            this.style.backgroundColor = "white";
          };
          div.onclick = (e) => {
            L.DomEvent.stopPropagation(e);
            if (apiData) {
              setSelectedMarkerId(null); // Clear selected marker on reset
              loadProvinces(_map, apiData); // Reset to province level
            }
          };
          return div;
        };
        resetControl.addTo(_map);

        loadProvinces(_map, apiData); // Load initial province data
      } else if (mapInstance && apiData) {
        // Only reload provinces if mapInstance already exists and apiData is available
        // This ensures the initial load happens once
        if (level === "province" && !selectedMarkerId) {
            loadProvinces(mapInstance, apiData);
        }
      }
    });

    return () => {
      // Cleanup can be added here if needed, e.g., mapInstance.remove();
    };
  }, [apiData]);

  // Function to clear all markers from the map
  function clearMarkers(map) {
    if (!map || !LRef.current) return;
    map.eachLayer((layer) => {
      if (layer instanceof LRef.current.Marker) {
        map.removeLayer(layer);
      }
    });
  }

  // Function to create an L.DivIcon displaying the name and count (adjusted size and font-style)
  // เพิ่ม isSelected เข้าไปในพารามิเตอร์
  const createCountDivIcon = (name, count, isSelected = false) => {
    const L = LRef.current;
    const countText = count !== undefined ? count.toLocaleString() : "N/A";

    // ปรับขนาดเริ่มต้นและขนาดเมื่อเลือก
    const baseMarkerSize = 20;
    const selectedMarkerSize = 60; // ขนาดเมื่อขยาย
    const markerSize = isSelected ? selectedMarkerSize : baseMarkerSize;

    // ปรับขนาดตัวอักษรสำหรับชื่อและจำนวน
    const baseNameFontSize = "0.4em";
    const baseCountFontSize = "0.7em";
    const selectedNameFontSize = "0.7em"; // ขนาดตัวอักษรเมื่อขยาย
    const selectedCountFontSize = "1.2em"; // ขนาดตัวอักษรเมื่อขยาย

    const nameFontSize = isSelected ? selectedNameFontSize : baseNameFontSize;
    const countFontSize = isSelected ? selectedCountFontSize : baseCountFontSize;

    // เพิ่มคลาส CSS สำหรับมาร์กเกอร์ที่ถูกเลือก
    const selectedClass = isSelected ? 'count-div-icon-selected' : '';

    const htmlContent = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: ${markerSize}px;
        height: ${markerSize}px;
        background-color: ${isSelected ? '#e67e22' : '#007bff'}; /* เปลี่ยนสีเมื่อถูกเลือก */
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5); /* เพิ่ม shadow เมื่อขยาย */
        font-family: 'Sarabun', Arial, sans-serif;
        color: white;
        transform: translate(-50%, -50%);
        cursor: pointer;
        font-style: normal;
        line-height: 1.0;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: all 0.3s ease-in-out; /* เพิ่ม transition เพื่อการเปลี่ยนขนาดที่ราบรื่น */
      ">
        <span style="font-size: ${nameFontSize}; font-weight: normal; text-align: center; white-space: nowrap; max-width: 90%;">${name}</span>
        <span style="font-size: ${countFontSize}; font-weight: bold; text-align: center;">${countText}</span>
      </div>
    `;

    return L.divIcon({
      className: `count-div-icon ${selectedClass}`,
      html: htmlContent,
      iconSize: [markerSize, markerSize],
      iconAnchor: [markerSize / 2, markerSize / 2],
    });
  };

  // Load and display province data
  function loadProvinces(map, countryData) {
    if (!map || !LRef.current) return;
    const L = LRef.current;
    setLevel("province");
    clearMarkers(map);
    setCurrentCountry(countryData);
    setCurrentProvince(null);
    setCurrentDistrict(null);
    // ไม่ต้องล้าง selectedMarkerId ที่นี่ เพราะต้องการให้มันถูกตั้งค่าเมื่อมีการคลิกใหม่

    const provinces = countryData.children;

    provinces.forEach((province) => {
      if (province.center) {
        // ตรวจสอบว่ามาร์กเกอร์นี้คือมาร์กเกอร์ที่ถูกเลือกหรือไม่
        const isSelected = selectedMarkerId === province.name;
        L.marker(province.center, {
          icon: createCountDivIcon(province.name, province.count, isSelected),
        })
          .addTo(map)
          .bindTooltip(
            createTooltipContent(province.name, province.count),
            {
              direction: "top",
              permanent: false,
              sticky: true,
              offset: L.point(0, -10),
              className: "custom-tooltip",
            }
          )
          .on("click", () => {
            setSelectedMarkerId(province.name); // ตั้งค่า ID ของมาร์กเกอร์ที่ถูกเลือก
            setCurrentProvince(province);
            loadDistricts(map, province); // Drill down to districts
          });
      }
    });

    // Adjust map view to fit provinces
    if (provinces.length > 0) {
      const firstProvinceWithCenter = provinces.find((p) => p.center);
      if (firstProvinceWithCenter) {
        map.setView(firstProvinceWithCenter.center, 7);
      } else if (countryData.center) {
        map.setView(countryData.center, 6);
      }
    } else if (countryData.center) {
      map.setView(countryData.center, 6);
    }
  }

  // Load and display district data
  function loadDistricts(map, provinceData) {
    if (!map || !LRef.current) return;
    const L = LRef.current;
    setLevel("district");
    clearMarkers(map);
    setCurrentProvince(provinceData);
    setCurrentDistrict(null);
    // ไม่ต้องล้าง selectedMarkerId ที่นี่

    const districts = provinceData.children;

    districts.forEach((district) => {
      if (district.center) {
        // ตรวจสอบว่ามาร์กเกอร์นี้คือมาร์กเกอร์ที่ถูกเลือกหรือไม่
        const isSelected = selectedMarkerId === district.name;
        L.marker(district.center, {
          icon: createCountDivIcon(district.name, district.count, isSelected),
        })
          .addTo(map)
          .bindTooltip(
            createTooltipContent(district.name, district.count),
            {
              direction: "top",
              permanent: false,
              sticky: true,
              offset: L.point(0, -10),
              className: "custom-tooltip",
            }
          )
          .on("click", () => {
            setSelectedMarkerId(district.name); // ตั้งค่า ID ของมาร์กเกอร์ที่ถูกเลือก
            setCurrentDistrict(district);
            loadSubdistricts(map, district); // Drill down to subdistricts (tambons)
          });
      }
    });

    // Adjust map view to fit districts
    if (districts.length > 0) {
      const firstDistrictWithCenter = districts.find((d) => d.center);
      if (firstDistrictWithCenter) {
        map.setView(firstDistrictWithCenter.center, 9);
      } else if (provinceData.center) {
        map.setView(provinceData.center, 8);
      }
    } else if (provinceData.center) {
      map.setView(provinceData.center, 8);
    }
  }

  // Load and display subdistrict (tambon) data
  function loadSubdistricts(map, districtData) {
    if (!map || !LRef.current) return;
    const L = LRef.current;
    setLevel("subdistrict");
    clearMarkers(map);
    setCurrentDistrict(districtData);
    // ไม่ต้องล้าง selectedMarkerId ที่นี่

    const tambons = districtData.children;

    tambons.forEach((tambon) => {
      if (
        typeof tambon.latitude === "number" &&
        typeof tambon.longitude === "number"
      ) {
        // ตรวจสอบว่ามาร์กเกอร์นี้คือมาร์กเกอร์ที่ถูกเลือกหรือไม่
        const isSelected = selectedMarkerId === tambon.name;
        L.marker([tambon.latitude, tambon.longitude], {
          icon: createCountDivIcon(tambon.name, tambon.count, isSelected),
        })
          .addTo(map)
          .bindTooltip(
            createTooltipContent(tambon.name, tambon.count),
            {
              direction: "top",
              permanent: false,
              sticky: true,
              offset: L.point(0, -10),
              className: "custom-tooltip",
            }
          )
          .on("click", () => {
              setSelectedMarkerId(tambon.name); // ตั้งค่า ID ของมาร์กเกอร์ที่ถูกเลือก
              // ในระดับสุดท้าย เราแค่เลือก ไม่ต้องโหลดอะไรต่อ
              // แต่เราต้องโหลด subdistrict อีกครั้งเพื่อแสดงมาร์กเกอร์ที่เลือก
              loadSubdistricts(map, districtData);
          });
      }
    });

    // Adjust map view to fit subdistricts
    if (tambons.length > 0) {
      const firstTambonWithCoords = tambons.find(
        (t) => typeof t.latitude === "number" && typeof t.longitude === "number"
      );
      if (firstTambonWithCoords) {
        map.setView(
          [firstTambonWithCoords.latitude, firstTambonWithCoords.longitude],
          12
        );
      } else if (districtData.center) {
        map.setView(districtData.center, 11);
      }
    } else if (districtData.center) {
      map.setView(districtData.center, 11);
    }
  }

  // Inline style for the "Back" button
  const backButtonStyle = {
    position: "absolute",
    top: "10px",
    left: "10px",
    zIndex: 1000,
    padding: "8px 12px",
    backgroundColor: "white",
    fontFamily: "'Sarabun', Arial, sans-serif",
    fontSize: "14px",
    fontWeight: "600",
    color: "#2c3e50",
    border: "1px solid #bdc3c7",
    borderRadius: "4px",
    cursor: "pointer",
    boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
    display: "flex",
    alignItems: "center",
  };

  // Render the navigation (back button)
  const renderNavigation = () => {
    // Only show the back button if not at the province level
    if (!mapInstance || !LRef.current || level === "province") return null;

    const goBack = (e) => {
      LRef.current.DomEvent.stopPropagation(e); // Prevent map click event
      setSelectedMarkerId(null); // Clear selected marker on back navigation
      if (level === "subdistrict" && currentProvince) {
        loadDistricts(mapInstance, currentProvince); // Go back to districts
      } else if (level === "district" && apiData) {
        loadProvinces(mapInstance, apiData); // Go back to provinces
      }
    };

    let currentBackButtonStyle = { ...backButtonStyle };

    return (
      <button
        onClick={goBack}
        style={currentBackButtonStyle}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f9f9f9")}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "white")}
        title="ย้อนกลับไปยังระดับก่อนหน้า"
      >
        ⬅ Back
      </button>
    );
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "600px",
        fontFamily: "'Sarabun', Arial, sans-serif",
      }}
    >
      {renderNavigation()}
      <div id="map" style={{ height: "100%", width: "100%" }} />
    </div>
  );
}