create database fitplanhub;
use fitplanhub;

-- Users table (both trainers and regular users)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('user', 'trainer') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fitness plans table
CREATE TABLE fitness_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INT NOT NULL,
    trainer_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trainer_id) REFERENCES users(id)
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (plan_id) REFERENCES fitness_plans(id),
    UNIQUE KEY unique_subscription (user_id, plan_id)
);

-- Follow relationships
CREATE TABLE follows (
    id INT PRIMARY KEY AUTO_INCREMENT,
    follower_id INT NOT NULL,
    trainer_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id),
    FOREIGN KEY (trainer_id) REFERENCES users(id),
    UNIQUE KEY unique_follow (follower_id, trainer_id)
);

-- Insert sample data
INSERT INTO users (email, password, name, role) VALUES
('trainer1@email.com', 'hashed_password', 'John Trainer', 'trainer'),
('user1@email.com', 'hashed_password', 'Alice User', 'user');

INSERT INTO fitness_plans (title, description, price, duration_days, trainer_id) VALUES
('Fat Loss Beginner Plan', 'Complete 30-day fat loss program...', 49.99, 30, 1),
('Muscle Building Advanced', 'Advanced weight training program...', 79.99, 60, 1);