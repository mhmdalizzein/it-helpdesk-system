TRUNCATE TABLE activity_logs, notifications, ticket_attachments, ticket_comments, tickets, statuses, priorities, categories, user_accounts, roles
RESTART IDENTITY CASCADE;

INSERT INTO roles (role_name, description) VALUES
('Admin', 'Full system access'),
('IT Support Agent', 'Can manage, update, and resolve assigned tickets'),
('Employee', 'Can create and track support tickets'),
('Manager', 'Can monitor team tickets and view reports');

INSERT INTO categories (category_name, description, is_active) VALUES
('Hardware', 'Issues related to physical devices and equipment', TRUE),
('Software', 'Issues related to applications and software tools', TRUE),
('Network', 'Issues related to internet, Wi-Fi, VPN, and connectivity', TRUE),
('Email', 'Issues related to email accounts and mail services', TRUE),
('Access Request', 'Requests for account access, permissions, or system access', TRUE),
('Other', 'General support requests that do not fit other categories', TRUE);

INSERT INTO priorities (priority_name, description, sort_order) VALUES
('Low', 'Minor issue with limited impact', 1),
('Medium', 'Standard issue affecting normal work', 2),
('High', 'Important issue affecting productivity', 3),
('Critical', 'Urgent issue affecting major operations', 4);

INSERT INTO statuses (status_name, description, sort_order) VALUES
('Open', 'Ticket has been submitted and is waiting to be reviewed', 1),
('In Progress', 'Ticket is currently being handled by support staff', 2),
('Pending', 'Ticket is waiting for more information or external action', 3),
('Resolved', 'Ticket issue has been solved', 4),
('Closed', 'Ticket has been completed and closed', 5);

INSERT INTO user_accounts (
    role_id,
    full_name,
    email,
    password_hash,
    phone_number,
    department,
    is_active
) VALUES
(1, 'System Admin', 'admin@helpdesk.com', 'hashed_password_admin', '+96170000001', 'IT Administration', TRUE),
(2, 'Support Agent', 'agent@helpdesk.com', 'hashed_password_agent', '+96170000002', 'IT Support', TRUE),
(3, 'Employee User', 'employee@helpdesk.com', 'hashed_password_employee', '+96170000003', 'Operations', TRUE),
(4, 'Department Manager', 'manager@helpdesk.com', 'hashed_password_manager', '+96170000004', 'Management', TRUE);

INSERT INTO tickets (
    ticket_reference,
    created_by_user_account_id,
    assigned_to_user_account_id,
    category_id,
    priority_id,
    status_id,
    title,
    description
) VALUES
('TCK-0001', 3, 2, 1, 2, 2, 'Laptop keyboard not working', 'Several keys on the employee laptop keyboard are not responding.'),
('TCK-0002', 3, 2, 3, 3, 1, 'Cannot connect to VPN', 'Employee is unable to connect to the company VPN from home.'),
('TCK-0003', 3, NULL, 5, 2, 1, 'Request access to project folder', 'Employee needs access to the shared project folder for current work.'),
('TCK-0004', 3, 2, 4, 1, 4, 'Email signature update request', 'Employee requested help updating the company email signature.');

INSERT INTO ticket_comments (
    ticket_id,
    user_account_id,
    comment_text,
    is_internal
) VALUES
(1, 3, 'The issue started this morning after restarting the laptop.', FALSE),
(1, 2, 'Checked the device and started troubleshooting the keyboard driver.', TRUE),
(2, 3, 'VPN shows an authentication error when trying to connect.', FALSE),
(4, 2, 'Email signature was updated successfully.', FALSE);

INSERT INTO ticket_attachments (
    ticket_id,
    uploaded_by_user_account_id,
    file_name,
    file_path,
    file_type,
    file_size
) VALUES
(1, 3, 'keyboard-issue.png', '/uploads/tickets/TCK-0001/keyboard-issue.png', 'image/png', 245000),
(2, 3, 'vpn-error.png', '/uploads/tickets/TCK-0002/vpn-error.png', 'image/png', 198000);

INSERT INTO notifications (
    user_account_id,
    ticket_id,
    title,
    message,
    is_read
) VALUES
(2, 1, 'New ticket assigned', 'Ticket TCK-0001 has been assigned to you.', FALSE),
(2, 2, 'New ticket assigned', 'Ticket TCK-0002 has been assigned to you.', FALSE),
(3, 4, 'Ticket resolved', 'Your ticket TCK-0004 has been resolved.', FALSE),
(1, 3, 'New access request', 'A new access request ticket has been created.', FALSE);

INSERT INTO activity_logs (
    user_account_id,
    ticket_id,
    action,
    description
) VALUES
(3, 1, 'Ticket Created', 'Employee created ticket TCK-0001.'),
(1, 1, 'Ticket Assigned', 'Admin assigned ticket TCK-0001 to Support Agent.'),
(2, 1, 'Status Updated', 'Support Agent changed ticket status to In Progress.'),
(3, 2, 'Ticket Created', 'Employee created ticket TCK-0002.'),
(2, 4, 'Ticket Resolved', 'Support Agent resolved ticket TCK-0004.');
