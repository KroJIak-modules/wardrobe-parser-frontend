import React, { useState, useEffect } from "react";
import styles from "./sources.module.css";

const Sources = ({ open, onClose }) => {
  const [selectedSize, setSelectedSize] = useState("");

  const item = {
    activeSizes: ["M", "L"],
  };

  useEffect(() => {
    if (item.activeSizes.length > 0) {
      setSelectedSize(item.activeSizes[0]);
    }
  }, []);

  if (!open) return null;

  return (
    
      <div className={styles.window} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}></div>

        <div className={styles.mainContainer}>
          <div className={styles.sizeContainer}>
            <select
              className={styles.sizeButton}
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
            >
              {item.activeSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    
  );
};

export default Sources;