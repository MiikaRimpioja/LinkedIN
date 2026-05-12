const createPool = require("./db_pool");
require("dotenv").config();

(async () => {
  const pool = await createPool();

  try {
    await pool.execute(`
  CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_by INT NOT NULL,
    modified_by INT,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'processed', 'approved') DEFAULT 'pending',
    language VARCHAR(10) DEFAULT 'fi',
    sender VARCHAR(255),
    pallet INT, 
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_modified_by (modified_by),
    INDEX idx_status (status),
    INDEX idx_language (language),
    INDEX idx_upload_date (upload_date),
    INDEX idx_pallet (pallet),  
    FULLTEXT INDEX fts_filename (filename),
    FULLTEXT INDEX fts_sender (sender)
  ); 
`);

    await pool.execute(`  
    CREATE TABLE IF NOT EXISTS product_lines (
      id INT AUTO_INCREMENT PRIMARY KEY,
      document_id INT NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      code VARCHAR(100),
      ordered_quantity INT,
      shipped_quantity INT,
      note TEXT,
      INDEX idx_document_id (document_id),
      FOREIGN KEY (document_id) REFERENCES documents(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    );
  `);

    await pool.execute(`
    CREATE TABLE IF NOT EXISTS senders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      document_id INT NOT NULL,
      company VARCHAR(255),
      contact_person VARCHAR(255),
      address TEXT,
      city VARCHAR(100),
      postal_code VARCHAR(20),
      country VARCHAR(100),
      INDEX idx_document_id (document_id),
      INDEX idx_company (company),
      FOREIGN KEY (document_id) REFERENCES documents(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    );
  `);
    await pool.execute(`
    CREATE TABLE IF NOT EXISTS receivers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      document_id INT NOT NULL,
      contact_person VARCHAR(255),
      address TEXT,
      city VARCHAR(100),
      postal_code VARCHAR(20),
      country VARCHAR(100),
      INDEX idx_document_id (document_id),
      INDEX idx_contact_person (contact_person),
      FOREIGN KEY (document_id) REFERENCES documents(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    );
    `);
    await pool.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      document_id INT NOT NULL,
      sales_order_number VARCHAR(100),
      package_number VARCHAR(100),
      order_date DATETIME,
      shipping_date DATETIME,
      INDEX idx_document_id (document_id),
      INDEX idx_sales_order_number (sales_order_number),
      FOREIGN KEY (document_id) REFERENCES documents(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    );
  `);

    await pool.execute(`
  CREATE TABLE IF NOT EXISTS product_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    code_type VARCHAR(50) NOT NULL,
    code_value VARCHAR(100) NOT NULL,
    UNIQUE(product_id, code_type),
    INDEX idx_code_value (code_value),
    FOREIGN KEY (product_id) REFERENCES products(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
  );
`);

    await pool.execute(`
  CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit VARCHAR(50),
    price DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'EUR',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    FULLTEXT INDEX fts_description (description)
  );
`);

    console.log("All tables and indexes created successfully!");
  } catch (err) {
    console.error("Error creating tables:", err.message);
  } finally {
    await pool.end();
  }
})();
