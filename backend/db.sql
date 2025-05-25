-- Tabel untuk menyimpan hasil prediksi dari kedua jenis input
CREATE TABLE fiber_predictions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    
    -- Reference ke input source
    input_type ENUM('manual', 'excel') NOT NULL,
    manual_input_id INT NULL,
    excel_input_id INT NULL,
    
    -- Prediction results
    prediction_result JSON,
    confidence_score DECIMAL(5,4),
    quality_assessment VARCHAR(50), -- 'excellent', 'good', 'fair', 'poor'
    optimization_suggestions JSON,
    
    -- Performance metrics
    processing_time_ms INT,
    model_version VARCHAR(20),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (manual_input_id) REFERENCES manual_inputs(id),
    FOREIGN KEY (excel_input_id) REFERENCES excel_inputs(id),
    
    -- Constraint untuk memastikan hanya satu jenis input yang direferensikan
    CONSTRAINT chk_input_reference CHECK (
        (input_type = 'manual' AND manual_input_id IS NOT NULL AND excel_input_id IS NULL) OR
        (input_type = 'excel' AND excel_input_id IS NOT NULL AND manual_input_id IS NULL)
    ),
    
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_input_type (input_type),
    INDEX idx_manual_input (manual_input_id),
    INDEX idx_excel_input (excel_input_id)
);


-- Tabel untuk menyimpan input dari file Excel
CREATE TABLE excel_inputs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    
    -- File information
    original_filename VARCHAR(255) NOT NULL,
    file_hash VARCHAR(64) UNIQUE,
    file_size_bytes BIGINT,
    
    -- Excel processing information
    total_rows INT,
    valid_rows INT,
    processed_rows INT,
    
    -- Raw Excel data (JSON format)
    excel_data JSON,
    
    -- Processing status
    status ENUM('uploaded', 'processing', 'completed', 'failed') DEFAULT 'uploaded',
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_created (user_id, created_at),
    INDEX idx_status (status),
    INDEX idx_file_hash (file_hash)
); 


-- Tabel untuk menyimpan input manual (P1-P30 + SNR)
CREATE TABLE manual_inputs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    
    -- Manual input fields (P1-P30 + SNR)
    p1 DECIMAL(5,2) NOT NULL, p2 DECIMAL(5,2) NOT NULL, p3 DECIMAL(5,2) NOT NULL, 
    p4 DECIMAL(5,2) NOT NULL, p5 DECIMAL(5,2) NOT NULL, p6 DECIMAL(5,2) NOT NULL,
    p7 DECIMAL(5,2) NOT NULL, p8 DECIMAL(5,2) NOT NULL, p9 DECIMAL(5,2) NOT NULL,
    p10 DECIMAL(5,2) NOT NULL, p11 DECIMAL(5,2) NOT NULL, p12 DECIMAL(5,2) NOT NULL,
    p13 DECIMAL(5,2) NOT NULL, p14 DECIMAL(5,2) NOT NULL, p15 DECIMAL(5,2) NOT NULL,
    p16 DECIMAL(5,2) NOT NULL, p17 DECIMAL(5,2) NOT NULL, p18 DECIMAL(5,2) NOT NULL,
    p19 DECIMAL(5,2) NOT NULL, p20 DECIMAL(5,2) NOT NULL, p21 DECIMAL(5,2) NOT NULL,
    p22 DECIMAL(5,2) NOT NULL, p23 DECIMAL(5,2) NOT NULL, p24 DECIMAL(5,2) NOT NULL,
    p25 DECIMAL(5,2) NOT NULL, p26 DECIMAL(5,2) NOT NULL, p27 DECIMAL(5,2) NOT NULL,
    p28 DECIMAL(5,2) NOT NULL, p29 DECIMAL(5,2) NOT NULL, p30 DECIMAL(5,2) NOT NULL,
    snr DECIMAL(5,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    
    -- Constraints untuk validasi range
    CONSTRAINT chk_p_range CHECK (
        p1 BETWEEN 1 AND 10 AND p2 BETWEEN 1 AND 10 AND p3 BETWEEN 1 AND 10 AND
        p4 BETWEEN 1 AND 10 AND p5 BETWEEN 1 AND 10 AND p6 BETWEEN 1 AND 10 AND
        p7 BETWEEN 1 AND 10 AND p8 BETWEEN 1 AND 10 AND p9 BETWEEN 1 AND 10 AND
        p10 BETWEEN 1 AND 10 AND p11 BETWEEN 1 AND 10 AND p12 BETWEEN 1 AND 10 AND
        p13 BETWEEN 1 AND 10 AND p14 BETWEEN 1 AND 10 AND p15 BETWEEN 1 AND 10 AND
        p16 BETWEEN 1 AND 10 AND p17 BETWEEN 1 AND 10 AND p18 BETWEEN 1 AND 10 AND
        p19 BETWEEN 1 AND 10 AND p20 BETWEEN 1 AND 10 AND p21 BETWEEN 1 AND 10 AND
        p22 BETWEEN 1 AND 10 AND p23 BETWEEN 1 AND 10 AND p24 BETWEEN 1 AND 10 AND
        p25 BETWEEN 1 AND 10 AND p26 BETWEEN 1 AND 10 AND p27 BETWEEN 1 AND 10 AND
        p28 BETWEEN 1 AND 10 AND p29 BETWEEN 1 AND 10 AND p30 BETWEEN 1 AND 10
    ),
    CONSTRAINT chk_snr_range CHECK (snr BETWEEN 0 AND 30)
); 
CREATE TABLE users (
    id INT(11) NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
