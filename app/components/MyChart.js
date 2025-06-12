"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export default function MyChart() {
  const [originalData, setOriginalData] = useState([]);
  const [currentTreemapData, setCurrentTreemapData] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [selectedCampusName, setSelectedCampusName] = useState(null);
  const [selectedFacultyName, setSelectedFacultyName] = useState(null);
  const [chartTitle, setChartTitle] = useState(
    "รายงานจำนวนศิษย์เก่ามหาวิทยาลัยสงขลานครินทร์ แยกตามวิทยาเขต/คณะ/สาขา"
  );
  const [error, setError] = useState(null);

  const primaryFontFamily = "var(--font-ibm-plex-thai), sans-serif";

  useEffect(() => {
    async function fetchData() {
      try {
        setError(null);
        const res = await fetch("/api/alumni/campus-faculty-major");

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.error || "Failed to fetch data from API route"
          );
        }

        const rawDataFromApi = await res.json();
        const facultyMajorCounts = rawDataFromApi.faculty_major_counts || [];

        if (!Array.isArray(facultyMajorCounts)) {
          console.error("faculty_major_counts is not an array or is missing.");
          setError(
            "รูปแบบข้อมูลจาก API ไม่ถูกต้อง: 'faculty_major_counts' หายไปหรือไม่ใช่อาร์เรย์"
          );
          return;
        }

        const grouped = {};
        facultyMajorCounts.forEach((facultyItem) => {
          const campus = facultyItem.campus_name?.trim() || "N/A Campus";
          const faculty = facultyItem.faculty_name?.trim() || "N/A Faculty";

          if (!facultyItem.faculty_name || campus === faculty) return;

          if (!grouped[campus]) {
            grouped[campus] = { name: campus, value: 0, children: {} };
          }

          if (!grouped[campus].children[faculty]) {
            grouped[campus].children[faculty] = {
              name: faculty,
              value: 0,
              children: [],
            };
          }

          if (Array.isArray(facultyItem.majors)) {
            facultyItem.majors.forEach((majorItem) => {
              const major = majorItem.major_name?.trim() || "N/A Major";
              const count = majorItem.user_count || 0;

              if (!majorItem.major_name || faculty === major || count === 0)
                return;

              grouped[campus].children[faculty].children.push({
                name: major,
                value: count,
              });
              grouped[campus].children[faculty].value += count;
              grouped[campus].value += count;
            });
          }
        });

        const processedData = Object.values(grouped)
          .map((campus) => ({
            ...campus,
            children: Object.values(campus.children)
              .map((faculty) => ({
                ...faculty,
                children: faculty.children
                  .filter((major) => major.value > 0)
                  .sort((a, b) => b.value - a.value),
              }))
              .filter(
                (faculty) => faculty.value > 0 && faculty.children.length > 0
              )
              .sort((a, b) => b.value - a.value),
          }))
          .filter((campus) => campus.value > 0 && campus.children.length > 0)
          .sort((a, b) => b.value - a.value);

        setOriginalData(processedData);

        const campusLevelData = processedData.map((campus) => ({
          name: campus.name,
          value: campus.value,
        }));
        setCurrentTreemapData(campusLevelData);
        setChartTitle("รายงานจำนวนศิษย์เก่ามหาวิทยาลัยสงขลานครินทร์ แยกตามวิทยาเขต/คณะ/สาขา");
      } catch (error) {
        console.error("Error loading or processing treemap data:", error);
        setError(`ไม่สามารถโหลดข้อมูลได้: ${error.message}`);
        setOriginalData([]);
        setCurrentTreemapData([]);
      }
    }
    fetchData();
  }, []);

  const handleChartClick = (params) => {
    if (!params.data || !params.data.name) return;

    const itemName = params.data.name;

    if (currentLevel === 0) {
      const campusData = originalData.find((c) => c.name === itemName);
      if (campusData && campusData.children) {
        const facultyLevelData = campusData.children.map((faculty) => ({
          name: faculty.name,
          value: faculty.value,
        }));
        setCurrentTreemapData(facultyLevelData);
        setSelectedCampusName(itemName);
        setCurrentLevel(1);
        setChartTitle(`${itemName}`);
        setSelectedFacultyName(null);
      }
    } else if (currentLevel === 1) {
      const campusData = originalData.find(
        (c) => c.name === selectedCampusName
      );
      if (campusData) {
        const facultyData = campusData.children.find(
          (f) => f.name === itemName
        );
        if (facultyData && facultyData.children) {
          const majorLevelData = facultyData.children.map((major) => ({
            name: major.name,
            value: major.value,
          }));
          setCurrentTreemapData(majorLevelData);
          setSelectedFacultyName(itemName);
          setCurrentLevel(2);
          setChartTitle(`${selectedCampusName} / ${itemName}`);
        }
      }
    }
  };

  const handleBackButtonClick = () => {
    if (currentLevel === 2) {
      const campusData = originalData.find(
        (c) => c.name === selectedCampusName
      );
      if (campusData) {
        const facultyLevelData = campusData.children.map((faculty) => ({
          name: faculty.name,
          value: faculty.value,
        }));
        setCurrentTreemapData(facultyLevelData);
        setCurrentLevel(1);
        setChartTitle(`${selectedCampusName}`);
        setSelectedFacultyName(null);
      }
    } else if (currentLevel === 1) {
      const campusLevelData = originalData.map((campus) => ({
        name: campus.name,
        value: campus.value,
      }));
      setCurrentTreemapData(campusLevelData);
      setCurrentLevel(0);
      setSelectedCampusName(null);
      setChartTitle("รายงานจำนวนศิษย์เก่ามหาวิทยาลัยสงขลานครินทร์ แยกตามวิทยาเขต/คณะ/สาขา");
    }
  };

  const option = {
    animation: true,
    animationDuration: 800,
    animationEasing: "cubicOut",

    title: {
      text: chartTitle,
      left: "center",
      textStyle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#004AAD",
        fontStyle: 'normal',
      },
    },
    tooltip: {
      formatter: (info) => {
        const value = info.value;
        let namePath = info.name;
        return `${namePath} : ${value.toLocaleString()} คน`;
      },
      textStyle: {
        fontFamily: primaryFontFamily,
        fontStyle: 'normal',
      }
    },
    color: ["#3399ff", "#004080", "#99ccff", "#002855", "#0066cc"],
    series: [
      {
        type: "treemap",
        data: currentTreemapData,
        roam: false,
        label: {
          show: true,
          formatter: (params) =>
            `${params.name}\n${params.value.toLocaleString()} คน`,
          color: "#fff",
          fontSize: 11,
          lineHeight: 16,
          fontFamily: primaryFontFamily,
          fontStyle: 'normal',
        },
        itemStyle: {
          borderColor: "#fff",
          borderWidth: 1,
          gapWidth: 1,
        },
        breadcrumb: {
          show: false,
        },
        colorMappingBy: "index",
        animationDurationUpdate: 800,
        animationEasingUpdate: "cubicOut",
      },
    ],
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "20px",
        maxWidth: "1300px",
        width: "100%",
        margin: "auto",
        fontFamily: primaryFontFamily,
        fontStyle: 'normal',
      }}
    >
      <div
        className="p-4 bg-white rounded shadow"
        style={{
          flex: 1,
          height: "600px",
          position: "relative",
          overflow: 'hidden'
        }}
      >
        {currentLevel > 0 && (
          <button
            onClick={handleBackButtonClick}
            style={{
              position: "absolute",
              top: "15px",
              left: "15px",
              zIndex: 10,
              padding: "8px 12px",
              backgroundColor: "#004AAD",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontFamily: primaryFontFamily,
              fontStyle: 'normal',
            }}
          >
            ⬅ Back
          </button>
        )}

        {error ? (
          <div
            style={{
              textAlign: "center",
              paddingTop: "50px",
              color: "red",
              fontFamily: primaryFontFamily,
              fontStyle: 'normal',
            }}
          >
            {error}
            <p style={{ fontStyle: 'normal' }}>
              กรุณาลองใหม่อีกครั้งในภายหลัง
              หรือติดต่อผู้ดูแลระบบหากปัญหายังคงอยู่
            </p>
          </div>
        ) : currentTreemapData.length > 0 ? (
          <ReactECharts
            option={option}
            style={{ width: "100%", height: "100%" }}
            onEvents={{ click: handleChartClick }}
          />
        ) : (
          <div
            style={{
              textAlign: "center",
              paddingTop: "50px",
              fontStyle: "normal",
              fontWeight: "bold",
              color: "#004AAD",
              fontSize: 40,
              fontFamily: primaryFontFamily,
            }}
          >
            Loading......
          </div>
        )}
      </div>
    </div>
  );
}
