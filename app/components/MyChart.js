// app/components/MyChart.js

"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// โหลด ECharts แบบ Dynamic เพื่อไม่ให้ Render ฝั่ง Server-side (SSR)
const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export default function MyChart() {
  // State สำหรับเก็บข้อมูล Treemap
  const [originalData, setOriginalData] = useState([]); // เก็บข้อมูลดิบที่ประมวลผลแล้ว (วิทยาเขต -> คณะ -> สาขา)
  const [currentTreemapData, setCurrentTreemapData] = useState([]); // ข้อมูลที่ใช้แสดงใน Treemap ปัจจุบัน
  const [currentLevel, setCurrentLevel] = useState(0); // ระดับการแสดงผล: 0: Campus, 1: Faculty, 2: Major
  const [selectedCampusName, setSelectedCampusName] = useState(null); // ชื่อวิทยาเขตที่ถูกเลือกเมื่อ Drill-down
  const [selectedFacultyName, setSelectedFacultyName] = useState(null); // ชื่อคณะที่ถูกเลือกเมื่อ Drill-down (สำหรับระดับสาขา)
  const [chartTitle, setChartTitle] = useState(
    "รายงานจำนวนศิษย์เก่ามหาวิทยาลัยสงขลานครินทร์ แยกตามวิทยาเขต/คณะ/สาขา"
  ); // หัวข้อแผนภูมิ
  const [error, setError] = useState(null); // สถานะสำหรับจัดการข้อผิดพลาดในการโหลดข้อมูล

  // กำหนดฟอนต์หลักที่ใช้ทั่วทั้งคอมโพเนนต์
  // เราจะดึงค่าจาก CSS variable ที่กำหนดใน layout.js
  const primaryFontFamily = "var(--font-ibm-plex-thai), sans-serif";

  // useEffect สำหรับ Fetch และประมวลผลข้อมูลเมื่อ Component โหลดครั้งแรก
  useEffect(() => {
    async function fetchData() {
      try {
        setError(null); // ล้าง error เก่าก่อนเริ่ม fetch ใหม่
        const res = await fetch("/api/alumni/campus-faculty-major"); // เรียก API route ของ Next.js

        // ตรวจสอบว่า API route ตอบกลับมาสำเร็จหรือไม่
        if (!res.ok) {
          const errorData = await res.json(); // พยายามอ่าน JSON error จาก API route ของเรา
          throw new Error(
            errorData.error || "Failed to fetch data from API route"
          );
        }

        const rawDataFromApi = await res.json();
        const facultyMajorCounts = rawDataFromApi.faculty_major_counts || [];

        // ตรวจสอบโครงสร้างข้อมูลที่ได้รับจาก API
        if (!Array.isArray(facultyMajorCounts)) {
          console.error("faculty_major_counts is not an array or is missing.");
          setError(
            "รูปแบบข้อมูลจาก API ไม่ถูกต้อง: 'faculty_major_counts' หายไปหรือไม่ใช่อาร์เรย์"
          );
          return;
        }

        // จัดกลุ่มข้อมูล: วิทยาเขต -> คณะ -> สาขา
        const grouped = {};
        facultyMajorCounts.forEach((facultyItem) => {
          const campus = facultyItem.campus_name?.trim() || "N/A Campus";
          const faculty = facultyItem.faculty_name?.trim() || "N/A Faculty";

          // กรองข้อมูลที่ไม่ถูกต้อง: ถ้าไม่มีชื่อคณะหรือชื่อวิทยาเขตซ้ำกับชื่อคณะ
          if (!facultyItem.faculty_name || campus === faculty) return;

          if (!grouped[campus]) {
            grouped[campus] = { name: campus, value: 0, children: {} }; // เก็บ children เป็น object เพื่อให้ง่ายต่อการค้นหา
          }

          if (!grouped[campus].children[faculty]) {
            grouped[campus].children[faculty] = {
              name: faculty,
              value: 0,
              children: [], // children ของคณะเป็น array สำหรับสาขา
            };
          }

          if (Array.isArray(facultyItem.majors)) {
            facultyItem.majors.forEach((majorItem) => {
              const major = majorItem.major_name?.trim() || "N/A Major";
              const count = majorItem.user_count || 0;

              // กรองข้อมูลที่ไม่ถูกต้อง: ถ้าไม่มีชื่อสาขา, ชื่อคณะซ้ำกับชื่อสาขา หรือจำนวนเป็น 0
              if (!majorItem.major_name || faculty === major || count === 0)
                return;

              grouped[campus].children[faculty].children.push({
                name: major,
                value: count,
              });
              grouped[campus].children[faculty].value += count; // เพิ่มจำนวนผู้ใช้ในคณะ
              grouped[campus].value += count; // เพิ่มจำนวนผู้ใช้ในวิทยาเขต
            });
          }
        });

        // แปลงโครงสร้างข้อมูลที่จัดกลุ่มแล้วให้อยู่ในรูปแบบที่ Treemap ต้องการ (array of objects)
        const processedData = Object.values(grouped)
          .map((campus) => ({
            ...campus,
            children: Object.values(campus.children)
              .map((faculty) => ({
                ...faculty,
                // กรองสาขาที่มีจำนวน > 0 และเรียงจากมากไปน้อย
                children: faculty.children
                  .filter((major) => major.value > 0)
                  .sort((a, b) => b.value - a.value),
              }))
              .filter(
                (faculty) => faculty.value > 0 && faculty.children.length > 0
              ) // กรองคณะที่มีจำนวน > 0 และมีสาขา
              .sort((a, b) => b.value - a.value), // เรียงคณะจากมากไปน้อย
          }))
          .filter((campus) => campus.value > 0 && campus.children.length > 0) // กรองวิทยาเขตที่มีจำนวน > 0 และมีคณะ
          .sort((a, b) => b.value - a.value); // เรียงวิทยาเขตจากมากไปน้อย

        setOriginalData(processedData);

        // เริ่มต้นด้วยข้อมูลระดับวิทยาเขต
        const campusLevelData = processedData.map((campus) => ({
          name: campus.name,
          value: campus.value, // จำนวนผู้ใช้ทั้งหมดในวิทยาเขตนั้นๆ
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
  }, []); // [] หมายความว่า useEffect จะทำงานเพียงครั้งเดียวหลัง Render ครั้งแรก

  // ฟังก์ชันจัดการการคลิกบนแผนภูมิ
  const handleChartClick = (params) => {
    // ตรวจสอบว่าคลิกที่ส่วนของข้อมูลจริง ๆ ไม่ใช่พื้นที่ว่าง
    if (!params.data || !params.data.name) return;

    const itemName = params.data.name; // ชื่อของวิทยาเขต คณะ หรือสาขาที่คลิก

    if (currentLevel === 0) {
      // คลิกที่วิทยาเขต -> Drill-down ไปยังระดับคณะ
      const campusData = originalData.find((c) => c.name === itemName);
      if (campusData && campusData.children) {
        const facultyLevelData = campusData.children.map((faculty) => ({
          name: faculty.name,
          value: faculty.value,
        }));
        setCurrentTreemapData(facultyLevelData);
        setSelectedCampusName(itemName);
        setCurrentLevel(1);
        setChartTitle(`${itemName}`); // เปลี่ยนชื่อแผนภูมิเป็นชื่อวิทยาเขต
        setSelectedFacultyName(null); // ล้างคณะที่เลือกไว้
      }
    } else if (currentLevel === 1) {
      // คลิกที่คณะ -> Drill-down ไปยังระดับสาขา
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
          setSelectedFacultyName(itemName); // เก็บชื่อคณะที่ถูกเลือกไว้
          setCurrentLevel(2); // เปลี่ยนระดับเป็นสาขา
          setChartTitle(`${selectedCampusName} / ${itemName}`); // เปลี่ยนชื่อแผนภูมิ
        }
      }
    }
    // หากอยู่ที่ระดับสาขา (currentLevel === 2) จะไม่ทำอะไรเมื่อคลิก
  };

  // ฟังก์ชันสำหรับปุ่ม "กลับ"
  const handleBackButtonClick = () => {
    if (currentLevel === 2) {
      // ถ้าอยู่ที่ระดับสาขา (2) -> กลับไประดับคณะ (1)
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
        setSelectedFacultyName(null); // ล้างชื่อคณะที่เลือก
      }
    } else if (currentLevel === 1) {
      // ถ้าอยู่ที่ระดับคณะ (1) -> กลับไประดับวิทยาเขต (0)
      const campusLevelData = originalData.map((campus) => ({
        name: campus.name,
        value: campus.value,
      }));
      setCurrentTreemapData(campusLevelData);
      setCurrentLevel(0);
      setSelectedCampusName(null); // ล้างชื่อวิทยาเขตที่เลือก
      setChartTitle("รายงานจำนวนศิษย์เก่ามหาวิทยาลัยสงขลานครินทร์ แยกตามวิทยาเขต/คณะ/สาขา");
    }
  };

  // การตั้งค่าสำหรับ ECharts Treemap
  const option = {
    // เปิดใช้งาน Animation ทั่วไป
    animation: true,
    animationDuration: 800, // ระยะเวลา Animation เป็นมิลลิวินาที
    animationEasing: "cubicOut", // รูปแบบการเร่ง-หน่วงของ Animation

    title: {
      text: chartTitle,
      left: "center",
      textStyle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#004AAD",
        //fontFamily: primaryFontFamily, // ใช้ font ที่กำหนดไว้
        fontStyle: 'normal', // ทำให้ไม่เอียง
        
      },
    },
    tooltip: {
      formatter: (info) => {
        const value = info.value;
        let namePath = info.name;
        return `${namePath} : ${value.toLocaleString()} คน`;
      },
      textStyle: {
        fontFamily: primaryFontFamily, // ใช้ font ที่กำหนดไว้
        fontStyle: 'normal', // ทำให้ไม่เอียง
      }
    },
    color: ["#3399ff", "#004080", "#99ccff", "#002855", "#0066cc"],
    series: [
      {
        type: "treemap",
        data: currentTreemapData,
        roam: false, // ปิดการซูม/แพน ด้วยเมาส์
        label: {
          show: true,
          formatter: (params) =>
            `${params.name}\n${params.value.toLocaleString()} คน`, // แสดงชื่อและจำนวน
          color: "#fff", // สีตัวอักษร
          fontSize: 11,
          lineHeight: 16, // เพิ่มระยะห่างระหว่างบรรทัด
          fontFamily: primaryFontFamily, // ใช้ font ที่กำหนดไว้
          fontStyle: 'normal', // ทำให้ไม่เอียง
        },
        itemStyle: {
          borderColor: "#fff", // สีเส้นขอบระหว่าง item
          borderWidth: 1,
          gapWidth: 1, // ระยะห่างระหว่าง item
        },
        breadcrumb: {
          show: false, // ปิด Breadcrumb Navigation อย่างชัดเจน
        },
        // ใช้ colorMappingBy: "index" เพื่อให้ใช้สีตามลำดับที่กำหนดใน 'color' array
        colorMappingBy: "index",
        // การตั้งค่า Animation เฉพาะ Series
        animationDurationUpdate: 800, // ระยะเวลา Animation เมื่ออัปเดตข้อมูล
        animationEasingUpdate: "cubicOut", // รูปแบบการเร่ง-หน่วงเมื่ออัปเดตข้อมูล
      },
    ],
  };

  return (
    // กำหนด Font หลักสำหรับส่วนนี้ (จาก CSS Variable ที่ตั้งค่าใน layout.js)
    <div
      style={{
        display: "flex",
        justifyContent: "center", // จัดให้อยู่กึ่งกลาง
        gap: "20px",
        maxWidth: "1300px",
        width: "100%",
        margin: "auto",
        fontFamily: primaryFontFamily, // ใช้ font ที่กำหนดไว้
        fontStyle: 'normal', // ทำให้ไม่เอียงสำหรับ div หลักนี้ด้วย
      }}
    >
      {/* ส่วน Treemap */}
      <div
        className="p-4 bg-white rounded shadow"
        style={{
          flex: 1,
          height: "600px",
          position: "relative",
          overflow: 'hidden' // *** เพิ่มบรรทัดนี้เพื่อป้องกันการเลื่อนของ container ***
        }}
      >
        {/* แสดงปุ่ม "กลับ" เมื่อไม่ได้อยู่ที่ระดับวิทยาเขต (ระดับ 0) */}
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
              fontFamily: primaryFontFamily, // ใช้ font ที่กำหนดไว้
              fontStyle: 'normal', // ทำให้ไม่เอียง
            }}
          >
            ⬅ Back
          </button>
        )}

        {/* ตรวจสอบว่ามี error หรือข้อมูลหรือไม่ */}
        {error ? (
          <div
            style={{
              textAlign: "center",
              paddingTop: "50px",
              color: "red",
              fontFamily: primaryFontFamily,
              fontStyle: 'normal', // ทำให้ไม่เอียง
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
            onEvents={{ click: handleChartClick }} // กำหนด handler สำหรับการคลิก
          />
        ) : (
          <div
            style={{
              textAlign: "center",
              paddingTop: "50px",
              fontStyle: "normal", // ทำให้ไม่เอียง
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