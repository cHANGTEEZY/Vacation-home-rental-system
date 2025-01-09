CREATE DATABASE vacation_home_rental_db;

CREATE TABLE user_details (
    user_id SERIAL PRIMARY KEY,
    user_name VARCHAR(255),
    user_email VARCHAR(255) UNIQUE,
    user_password VARCHAR(255),
    password_update_date VARCHAR(10),
    user_phone_number VARCHAR(20),
    user_address VARCHAR(255),
    address_zip_code VARCHAR(10),
    user_emergency_contact VARCHAR(255),
    user_role VARCHAR(20) NOT NULl DEFAULT 'user';
);

CREATE TABLE admin_host_messages (
    admin_host_message_id SERIAL PRIMARY KEY, 
    admin_id INT NOT NULL REFERENCES user_details(user_id) ON DELETE CASCADE, 
    host_id INT NOT NULL REFERENCES user_details(user_id) ON DELETE CASCADE, 
    message_subject VARCHAR(255) NOT NULL, 
    message_body TEXT NOT NULL, 
    rejection_reason TEXT, 
);

CREATE TABLE property_listing_details (
    property_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES user_details(user_id) ON DELETE CASCADE,  
    property_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    property_region VARCHAR(50) NOT NULL,
    approximate_location VARCHAR(255) NOT NULl,
    latitude VARCHAR(255) NOT NULL,
    longitude VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),  
    guests INT NOT NULL CHECK (guests >= 0),  
    bedrooms INT NOT NULL CHECK (bedrooms >= 0), 
    beds INT NOT NULL CHECK (beds >= 0),  
    bathrooms INT NOT NULL CHECK (bathrooms >= 0),  
    kitchens INT NOT NULL CHECK (kitchens >= 0),  
    swimming_pool INT  NOT NULL CHECK (swimming_pool >= 0),  
    amenities JSONB,  
    image_urls TEXT[],  
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

);

CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES user_details(user_id) ON DELETE CASCADE,
    property_id INT NOT NULL REFERENCES property_listing_details(property_id) ON DELETE CASCADE,
    booking_start_date DATE NOT NULL,
    booking_end_date DATE NOT NULL,
    total_guests INT NOT NULL CHECK (total_guests > 0),
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    booking_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_dates CHECK (booking_end_date >= booking_start_date)
);

CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES user_details(user_id) ON DELETE CASCADE,
    property_id INT NOT NULL REFERENCES property_listing_details(property_id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating>=1 AND rating <=5),
    review_message TEXT NOT NULL,
    review_date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    property_id INT NOT NULL REFERENCES property_listing_details(property_id) ON DELETE CASCADE,
    host_id INT NOT NULL REFERENCES user_details(user_id) ON DELETE CASCADE,
    sender_id INT NOT NULL REFERENCES user_details(user_id) ON DELETE CASCADE,
    sent_message TEXT ,
    received_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE booked_properties (
    booked_property_id  SERIAL PRIMARY KEY,
    property_id INT NOT NULL REFERENCES property_listing_details(property_id) ON DELETE CASCADE,
    host_id INT NOT NULL REFERENCES user_details(user_id) ON DELETE CASCADE
);

CREATE TABLE wishlists (
    wishlists_id SERIAL PRIMARY KEY,
    property_id INT NOT NULL REFERENCES property_listing_details(property_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES user_details(user_id) ON DELETE CASCADE
);

CREATE TABLE visited_properties (
  visited_property_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES user_details(user_id) ON DELETE CASCADE,
  property_id INT NOT NULL REFERENCES property_listing_details(property_id) ON DELETE CASCADE,
  CONSTRAINT unique_user_property UNIQUE (user_id, property_id)
);
