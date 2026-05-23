DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS ticket_attachments;
DROP TABLE IF EXISTS ticket_comments;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS statuses;
DROP TABLE IF EXISTS priorities;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS user_accounts;
DROP TABLE IF EXISTS roles;

CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE user_accounts (
    user_account_id SERIAL PRIMARY KEY,
    role_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(30),
    department VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,

    CONSTRAINT fk_user_accounts_role
        FOREIGN KEY (role_id)
        REFERENCES roles(role_id)
);

CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(80) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE priorities (
    priority_id SERIAL PRIMARY KEY,
    priority_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    sort_order INT NOT NULL,

    CONSTRAINT chk_priorities_sort_order
        CHECK (sort_order > 0)
);

CREATE TABLE statuses (
    status_id SERIAL PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    sort_order INT NOT NULL,

    CONSTRAINT chk_statuses_sort_order
        CHECK (sort_order > 0)
);

CREATE TABLE tickets (
    ticket_id SERIAL PRIMARY KEY,
    ticket_reference VARCHAR(30) NOT NULL UNIQUE,
    created_by_user_account_id INT NOT NULL,
    assigned_to_user_account_id INT,
    category_id INT NOT NULL,
    priority_id INT NOT NULL,
    status_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,

    CONSTRAINT fk_tickets_created_by_user
        FOREIGN KEY (created_by_user_account_id)
        REFERENCES user_accounts(user_account_id),

    CONSTRAINT fk_tickets_assigned_to_user
        FOREIGN KEY (assigned_to_user_account_id)
        REFERENCES user_accounts(user_account_id),

    CONSTRAINT fk_tickets_category
        FOREIGN KEY (category_id)
        REFERENCES categories(category_id),

    CONSTRAINT fk_tickets_priority
        FOREIGN KEY (priority_id)
        REFERENCES priorities(priority_id),

    CONSTRAINT fk_tickets_status
        FOREIGN KEY (status_id)
        REFERENCES statuses(status_id)
);

CREATE TABLE ticket_comments (
    ticket_comment_id SERIAL PRIMARY KEY,
    ticket_id INT NOT NULL,
    user_account_id INT NOT NULL,
    comment_text TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ticket_comments_ticket
        FOREIGN KEY (ticket_id)
        REFERENCES tickets(ticket_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ticket_comments_user
        FOREIGN KEY (user_account_id)
        REFERENCES user_accounts(user_account_id)
);

CREATE TABLE ticket_attachments (
    ticket_attachment_id SERIAL PRIMARY KEY,
    ticket_id INT NOT NULL,
    uploaded_by_user_account_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INT NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ticket_attachments_ticket
        FOREIGN KEY (ticket_id)
        REFERENCES tickets(ticket_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ticket_attachments_user
        FOREIGN KEY (uploaded_by_user_account_id)
        REFERENCES user_accounts(user_account_id),

    CONSTRAINT chk_ticket_attachments_file_size
        CHECK (file_size > 0)
);

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_account_id INT NOT NULL,
    ticket_id INT,
    title VARCHAR(150) NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_account_id)
        REFERENCES user_accounts(user_account_id),

    CONSTRAINT fk_notifications_ticket
        FOREIGN KEY (ticket_id)
        REFERENCES tickets(ticket_id)
        ON DELETE CASCADE
);

CREATE TABLE activity_logs (
    activity_log_id SERIAL PRIMARY KEY,
    user_account_id INT,
    ticket_id INT,
    action VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_logs_user
        FOREIGN KEY (user_account_id)
        REFERENCES user_accounts(user_account_id),

    CONSTRAINT fk_activity_logs_ticket
        FOREIGN KEY (ticket_id)
        REFERENCES tickets(ticket_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_user_accounts_role_id
    ON user_accounts(role_id);

CREATE INDEX idx_tickets_created_by_user_account_id
    ON tickets(created_by_user_account_id);

CREATE INDEX idx_tickets_assigned_to_user_account_id
    ON tickets(assigned_to_user_account_id);

CREATE INDEX idx_tickets_category_id
    ON tickets(category_id);

CREATE INDEX idx_tickets_priority_id
    ON tickets(priority_id);

CREATE INDEX idx_tickets_status_id
    ON tickets(status_id);

CREATE INDEX idx_ticket_comments_ticket_id
    ON ticket_comments(ticket_id);

CREATE INDEX idx_ticket_attachments_ticket_id
    ON ticket_attachments(ticket_id);

CREATE INDEX idx_notifications_user_account_id
    ON notifications(user_account_id);

CREATE INDEX idx_activity_logs_ticket_id
    ON activity_logs(ticket_id);
