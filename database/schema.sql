CREATE TABLE Role (
    RoleId SERIAL PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL UNIQUE,
    Description VARCHAR(255)
);

CREATE TABLE UserAccount (
    UserAccountId SERIAL PRIMARY KEY,
    RoleId INT NOT NULL,
    FullName VARCHAR(100) NOT NULL,
    Email VARCHAR(150) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    PhoneNumber VARCHAR(30),
    Department VARCHAR(100),
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP,

    CONSTRAINT FkUserAccount_RoleId
        FOREIGN KEY (RoleId) REFERENCES Role(RoleId)
);

CREATE TABLE Category (
    CategoryId SERIAL PRIMARY KEY,
    CategoryName VARCHAR(80) NOT NULL UNIQUE,
    Description VARCHAR(255),
    IsActive BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE Priority (
    PriorityId SERIAL PRIMARY KEY,
    PriorityName VARCHAR(50) NOT NULL UNIQUE,
    Description VARCHAR(255),
    SortOrder INT NOT NULL
);

CREATE TABLE Status (
    StatusId SERIAL PRIMARY KEY,
    StatusName VARCHAR(50) NOT NULL UNIQUE,
    Description VARCHAR(255),
    SortOrder INT NOT NULL
);

CREATE TABLE Ticket (
    TicketId SERIAL PRIMARY KEY,
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

    CONSTRAINT FkTicket_CreatedByUserAccountId
        FOREIGN KEY (CreatedByUserAccountId) REFERENCES UserAccount(UserAccountId),

    CONSTRAINT FkTicket_AssignedToUserAccountId
        FOREIGN KEY (AssignedToUserAccountId) REFERENCES UserAccount(UserAccountId),

    CONSTRAINT FkTicket_CategoryId
        FOREIGN KEY (CategoryId) REFERENCES Category(CategoryId),

    CONSTRAINT FkTicket_PriorityId
        FOREIGN KEY (PriorityId) REFERENCES Priority(PriorityId),

    CONSTRAINT FkTicket_StatusId
        FOREIGN KEY (StatusId) REFERENCES Status(StatusId)
);

CREATE TABLE TicketComment (
    TicketCommentId SERIAL PRIMARY KEY,
    TicketId INT NOT NULL,
    UserAccountId INT NOT NULL,
    CommentText TEXT NOT NULL,
    IsInternal BOOLEAN NOT NULL DEFAULT FALSE,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT FkTicketComment_TicketId
        FOREIGN KEY (TicketId) REFERENCES Ticket(TicketId),

    CONSTRAINT FkTicketComment_UserAccountId
        FOREIGN KEY (UserAccountId) REFERENCES UserAccount(UserAccountId)
);

CREATE TABLE TicketAttachment (
    TicketAttachmentId SERIAL PRIMARY KEY,
    TicketId INT NOT NULL,
    UploadedByUserAccountId INT NOT NULL,
    FileName VARCHAR(255) NOT NULL,
    FilePath VARCHAR(500) NOT NULL,
    FileType VARCHAR(50) NOT NULL,
    FileSize INT NOT NULL,
    UploadedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT FkTicketAttachment_TicketId
        FOREIGN KEY (TicketId) REFERENCES Ticket(TicketId),

    CONSTRAINT FkTicketAttachment_UploadedByUserAccountId
        FOREIGN KEY (UploadedByUserAccountId) REFERENCES UserAccount(UserAccountId)
);

CREATE TABLE Notification (
    NotificationId SERIAL PRIMARY KEY,
    UserAccountId INT NOT NULL,
    TicketId INT,
    Title VARCHAR(150) NOT NULL,
    Message VARCHAR(500) NOT NULL,
    IsRead BOOLEAN NOT NULL DEFAULT FALSE,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ReadAt TIMESTAMP,

    CONSTRAINT FkNotification_UserAccountId
        FOREIGN KEY (UserAccountId) REFERENCES UserAccount(UserAccountId),

    CONSTRAINT FkNotification_TicketId
        FOREIGN KEY (TicketId) REFERENCES Ticket(TicketId)
);

CREATE TABLE ActivityLog (
    ActivityLogId SERIAL PRIMARY KEY,
    UserAccountId INT,
    TicketId INT,
    Action VARCHAR(100) NOT NULL,
    Description VARCHAR(500),
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT FkActivityLog_UserAccountId
        FOREIGN KEY (UserAccountId) REFERENCES UserAccount(UserAccountId),

    CONSTRAINT FkActivityLog_TicketId
        FOREIGN KEY (TicketId) REFERENCES Ticket(TicketId)
);
