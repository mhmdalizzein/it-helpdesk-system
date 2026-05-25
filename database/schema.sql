DROP TABLE IF EXISTS ActivityLogs;
DROP TABLE IF EXISTS Notifications;
DROP TABLE IF EXISTS TicketAttachments;
DROP TABLE IF EXISTS TicketComments;
DROP TABLE IF EXISTS Tickets;
DROP TABLE IF EXISTS Statuses;
DROP TABLE IF EXISTS Priorities;
DROP TABLE IF EXISTS Categories;
DROP TABLE IF EXISTS UserAccounts;
DROP TABLE IF EXISTS Roles;

CREATE TABLE Roles (
    Id SERIAL PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL UNIQUE,
    Description VARCHAR(255)
);

CREATE TABLE UserAccounts (
    Id SERIAL PRIMARY KEY,
    RoleId INT NOT NULL,
    FullName VARCHAR(100) NOT NULL,
    Email VARCHAR(150) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    PhoneNumber VARCHAR(30),
    Department VARCHAR(100),
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP,

    CONSTRAINT FkUserAccountsRole
        FOREIGN KEY (RoleId)
        REFERENCES Roles(Id)
);

CREATE TABLE Categories (
    Id SERIAL PRIMARY KEY,
    CategoryName VARCHAR(80) NOT NULL UNIQUE,
    Description VARCHAR(255),
    IsActive BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE Priorities (
    Id SERIAL PRIMARY KEY,
    PriorityName VARCHAR(50) NOT NULL UNIQUE,
    Description VARCHAR(255),
    SortOrder INT NOT NULL,

    CONSTRAINT ChkPrioritiesSortOrder
        CHECK (SortOrder > 0)
);

CREATE TABLE Statuses (
    Id SERIAL PRIMARY KEY,
    StatusName VARCHAR(50) NOT NULL UNIQUE,
    Description VARCHAR(255),
    SortOrder INT NOT NULL,

    CONSTRAINT ChkStatusesSortOrder
        CHECK (SortOrder > 0)
);

CREATE TABLE Tickets (
    Id SERIAL PRIMARY KEY,
    TicketReference VARCHAR(30) NOT NULL UNIQUE,
    CreatedByUserAccountId INT NOT NULL,
    AssignedToUserAccountId INT,
    CategoryId INT NOT NULL,
    PriorityId INT NOT NULL,
    StatusId INT NOT NULL,
    Title VARCHAR(150) NOT NULL,
    Description TEXT NOT NULL,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP,
    ResolvedAt TIMESTAMP,
    ClosedAt TIMESTAMP,

    CONSTRAINT FkTicketsCreatedByUser
        FOREIGN KEY (CreatedByUserAccountId)
        REFERENCES UserAccounts(Id),

    CONSTRAINT FkTicketsAssignedToUser
        FOREIGN KEY (AssignedToUserAccountId)
        REFERENCES UserAccounts(Id),

    CONSTRAINT FkTicketsCategory
        FOREIGN KEY (CategoryId)
        REFERENCES Categories(Id),

    CONSTRAINT FkTicketsPriority
        FOREIGN KEY (PriorityId)
        REFERENCES Priorities(Id),

    CONSTRAINT FkTicketsStatus
        FOREIGN KEY (StatusId)
        REFERENCES Statuses(Id)
);

CREATE TABLE TicketComments (
    Id SERIAL PRIMARY KEY,
    TicketId INT NOT NULL,
    UserAccountId INT NOT NULL,
    CommentText TEXT NOT NULL,
    IsInternal BOOLEAN NOT NULL DEFAULT FALSE,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT FkTicketCommentsTicket
        FOREIGN KEY (TicketId)
        REFERENCES Tickets(Id)
        ON DELETE CASCADE,

    CONSTRAINT FkTicketCommentsUser
        FOREIGN KEY (UserAccountId)
        REFERENCES UserAccounts(Id)
);

CREATE TABLE TicketAttachments (
    Id SERIAL PRIMARY KEY,
    TicketId INT NOT NULL,
    UploadedByUserAccountId INT NOT NULL,
    FileName VARCHAR(255) NOT NULL,
    FilePath VARCHAR(500) NOT NULL,
    FileType VARCHAR(50) NOT NULL,
    FileSize INT NOT NULL,
    UploadedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT FkTicketAttachmentsTicket
        FOREIGN KEY (TicketId)
        REFERENCES Tickets(Id)
        ON DELETE CASCADE,

    CONSTRAINT FkTicketAttachmentsUser
        FOREIGN KEY (UploadedByUserAccountId)
        REFERENCES UserAccounts(Id),

    CONSTRAINT ChkTicketAttachmentsFileSize
        CHECK (FileSize > 0)
);

CREATE TABLE Notifications (
    Id SERIAL PRIMARY KEY,
    UserAccountId INT NOT NULL,
    TicketId INT,
    Title VARCHAR(150) NOT NULL,
    Message VARCHAR(500) NOT NULL,
    IsRead BOOLEAN NOT NULL DEFAULT FALSE,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ReadAt TIMESTAMP,

    CONSTRAINT FkNotificationsUser
        FOREIGN KEY (UserAccountId)
        REFERENCES UserAccounts(Id),

    CONSTRAINT FkNotificationsTicket
        FOREIGN KEY (TicketId)
        REFERENCES Tickets(Id)
        ON DELETE CASCADE
);

CREATE TABLE ActivityLogs (
    Id SERIAL PRIMARY KEY,
    UserAccountId INT,
    TicketId INT,
    Action VARCHAR(100) NOT NULL,
    Description VARCHAR(500),
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT FkActivityLogsUser
        FOREIGN KEY (UserAccountId)
        REFERENCES UserAccounts(Id),

    CONSTRAINT FkActivityLogsTicket
        FOREIGN KEY (TicketId)
        REFERENCES Tickets(Id)
        ON DELETE CASCADE
);

CREATE INDEX IdxUserAccountsRoleId
    ON UserAccounts(RoleId);

CREATE INDEX IdxTicketsCreatedByUserAccountId
    ON Tickets(CreatedByUserAccountId);

CREATE INDEX IdxTicketsAssignedToUserAccountId
    ON Tickets(AssignedToUserAccountId);

CREATE INDEX IdxTicketsCategoryId
    ON Tickets(CategoryId);

CREATE INDEX IdxTicketsPriorityId
    ON Tickets(PriorityId);

CREATE INDEX IdxTicketsStatusId
    ON Tickets(StatusId);

CREATE INDEX IdxTicketCommentsTicketId
    ON TicketComments(TicketId);

CREATE INDEX IdxTicketAttachmentsTicketId
    ON TicketAttachments(TicketId);

CREATE INDEX IdxNotificationsUserAccountId
    ON Notifications(UserAccountId);

CREATE INDEX IdxActivityLogsTicketId
    ON ActivityLogs(TicketId);
