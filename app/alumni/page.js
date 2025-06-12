"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

const MyChart = dynamic(() => import("../components/MyChart"), { ssr: false });
const DrillDownMap = dynamic(() => import("../components/DrillDownMap"), {
  ssr: false,
});

export default function Page() {
  const [view, setView] = useState("faculty");

  return (
    <>
      <style jsx>{`
        .page-container {
          max-width: 1200px;
          margin: 3rem auto;
          padding: 0 1.5rem;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          color: #004aad;
        }

        .main-title {
          font-weight: 700;
          font-size: 2.8rem;
          text-align: center;
          margin-bottom: 2.5rem;
          color: #004aad;
          text-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
        }

        .button-group {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .action-button {
          padding: 0.75rem 1.8rem;
          font-size: 1.15rem;
          font-weight: 600;
          border: 2px solid #004aad;
          background-color: white;
          color: #004aad;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          box-shadow: 0 3px 8px rgba(0, 74, 173, 0.2);
          user-select: none;
          outline: none;
        }

        .action-button:hover {
          background-color: #79b2ff;
          color: white;
          box-shadow: 0 6px 15px rgba(0, 74, 173, 0.5);
          transform: translateY(-3px);
        }

        .action-button.active {
          background-color: #004aad;
          color: white;
          box-shadow: 0 8px 20px rgba(0, 74, 173, 0.7);
          transform: translateY(-3px);
          border-color: #004aad;
        }

        .content-area {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
        }

        .section-box {
          background-color: #ffffff;
          border-radius: 15px;
          padding: 2.5rem;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
          min-height: 550px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: #333;
          font-size: 1.1rem;
          font-style: italic;
          box-sizing: border-box;
          border: 1px solid #e0e0e0;
        }

        .map-section {
          min-height: 500px;
        }

        @media (min-width: 992px) {
          .content-area {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="page-container">

        <div className="content-area">
          <div className="section-box">
            <MyChart />
          </div>

          <div className="section-box map-section">
            <DrillDownMap />
          </div>
        </div>
      </div>
    </>
  );
}
